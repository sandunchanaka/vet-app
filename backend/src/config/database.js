const { PrismaClient } = require('@prisma/client');

class DatabaseConfig {
  constructor() {
    this.prisma = null;
    this.connectionPool = null;
  }

  async initialize() {
    try {
      // Initialize Prisma client
      this.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        errorFormat: 'pretty',
      });

      // Test database connection
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');

      return this.prisma;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async close() {
    if (this.prisma) {
      await this.prisma.$disconnect();
      console.log('🔌 Database connection closed');
    }
  }

  getClient() {
    if (!this.prisma) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.prisma;
  }

  // Health check for database
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }
}

// Singleton instance
const databaseConfig = new DatabaseConfig();

module.exports = databaseConfig;
