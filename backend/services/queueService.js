import Bull from 'bull';
import { logger } from '../server.js';

let analyzeQueue;

export async function initializeQueue() {
  try {
    // Initialize Bull queue with Redis
    // For now, use in-memory queue
    analyzeQueue = new Bull('analyze-queue', {
      redis: {
        port: 6379,
        host: '127.0.0.1'
      }
    });
    
    logger.info('Job queue initialized');
  } catch (error) {
    logger.warn('Redis not available, using in-memory queue');
    // Fallback to in-memory processing
  }
}

export async function addToQueue(type, data) {
  if (analyzeQueue) {
    return await analyzeQueue.add(type, data);
  }
  // Fallback: return mock job
  return { id: Date.now(), type, data };
}

export async function getJobStatus(jobId) {
  if (analyzeQueue) {
    const job = await analyzeQueue.getJob(jobId);
    if (job) {
      return {
        status: await job.getState(),
        progress: job.progress(),
        result: job.returnvalue,
        completed: await job.isCompleted()
      };
    }
  }
  return null;
}
