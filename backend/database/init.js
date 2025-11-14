import { Sequelize } from 'sequelize';
import { logger } from '../server.js';

let sequelize = null;

export async function initializeDatabase() {
  try {
    // For now, use SQLite for simplicity
    // In production, use PostgreSQL
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: false
    });
    
    await sequelize.authenticate();
    logger.info('Database connection established');
    
    // Initialize models
    await initializeModels();
    
    // Sync database
    await sequelize.sync({ alter: true });
    logger.info('Database synchronized');
    
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

async function initializeModels() {
  // Models will be defined here
}

export { sequelize };
