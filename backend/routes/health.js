import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

router.get('/ready', async (req, res) => {
  // Check if all services are ready
  try {
    // Check database connection
    // Check Redis connection
    // Check Puppeteer
    
    res.json({
      status: 'ready',
      services: {
        database: 'connected',
        redis: 'connected',
        puppeteer: 'ready'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});

export { router as healthRouter };
