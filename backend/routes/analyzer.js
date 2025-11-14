import express from 'express';
import Joi from 'joi';
import AdAnalyzer from '../services/adAnalyzer.js';
import { logger } from '../server.js';
import { saveAnalysis, getAnalysisHistory } from '../database/models/Analysis.js';
import { addToQueue } from '../services/queueService.js';

const router = express.Router();
const analyzer = new AdAnalyzer();

// Validation schema
const analyzeSchema = Joi.object({
  url: Joi.string().uri().required(),
  options: Joi.object({
    screenshot: Joi.boolean().default(true),
    deepScan: Joi.boolean().default(true),
    compareWithPrevious: Joi.boolean().default(false)
  }).default({})
});

// Analyze endpoint
router.post('/url', async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = analyzeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    
    const { url, options } = value;
    logger.info(`Analysis requested for: ${url}`);
    
    // Add to queue for processing
    const job = await addToQueue('analyze', { url, options });
    
    // Return job ID for status checking
    res.json({
      success: true,
      message: 'Analysis started',
      jobId: job.id,
      statusUrl: `/api/analyze/status/${job.id}`
    });
    
  } catch (error) {
    logger.error('Analysis error:', error);
    next(error);
  }
});

// Synchronous analysis endpoint (for smaller sites)
router.post('/url/sync', async (req, res, next) => {
  try {
    const { error, value } = analyzeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    
    const { url } = value;
    
    // Perform analysis
    const results = await analyzer.analyze(url);
    
    // Save to database
    await saveAnalysis(results);
    
    res.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    logger.error('Sync analysis error:', error);
    next(error);
  }
});

// Get analysis status
router.get('/status/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    // Get job status from queue
    const job = await getJobStatus(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    res.json({
      success: true,
      status: job.status,
      progress: job.progress,
      result: job.completed ? job.result : null
    });
    
  } catch (error) {
    logger.error('Status check error:', error);
    next(error);
  }
});

// Get analysis history
router.get('/history', async (req, res, next) => {
  try {
    const { url, limit = 10, offset = 0 } = req.query;
    
    const history = await getAnalysisHistory({ url, limit, offset });
    
    res.json({
      success: true,
      data: history
    });
    
  } catch (error) {
    logger.error('History retrieval error:', error);
    next(error);
  }
});

// Compare analyses
router.post('/compare', async (req, res, next) => {
  try {
    const { analysisIds } = req.body;
    
    if (!Array.isArray(analysisIds) || analysisIds.length !== 2) {
      return res.status(400).json({
        success: false,
        error: 'Please provide exactly 2 analysis IDs to compare'
      });
    }
    
    const comparison = await compareAnalyses(analysisIds[0], analysisIds[1]);
    
    res.json({
      success: true,
      data: comparison
    });
    
  } catch (error) {
    logger.error('Comparison error:', error);
    next(error);
  }
});

// Export report
router.get('/export/:analysisId', async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    const { format = 'json' } = req.query;
    
    const analysis = await getAnalysisById(analysisId);
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }
    
    if (format === 'json') {
      res.json(analysis);
    } else if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(analysis);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analysis-${analysisId}.csv`);
      res.send(csv);
    } else if (format === 'pdf') {
      // Generate PDF report
      const pdf = await generatePDFReport(analysis);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=analysis-${analysisId}.pdf`);
      res.send(pdf);
    } else {
      res.status(400).json({
        success: false,
        error: 'Unsupported export format'
      });
    }
    
  } catch (error) {
    logger.error('Export error:', error);
    next(error);
  }
});

// Cleanup on server shutdown
process.on('SIGTERM', async () => {
  await analyzer.cleanup();
});

export { router as analyzerRouter };
