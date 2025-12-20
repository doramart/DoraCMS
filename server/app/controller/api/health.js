'use strict';

const { Controller } = require('egg');

/**
 * 健康检查控制器
 * 用于Docker健康检查和服务监控
 */
class HealthController extends Controller {
  /**
   * 健康检查接口
   * GET /api/health
   */
  async check() {
    const { ctx, app } = this;

    try {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: app.config.pkg ? app.config.pkg.version : 'unknown',
        environment: app.config.env,
        databaseType: process.env.DATABASE_TYPE || 'mongodb',
        services: {},
      };

      // 根据数据库类型检查对应的数据库
      const databaseType = process.env.DATABASE_TYPE || 'mongodb';

      if (databaseType === 'mongodb') {
        // MongoDB 健康检查
        try {
          if (app.mongoose && app.mongoose.connection) {
            const connection = app.mongoose.connection;

            // 检查连接状态：0=disconnected, 1=connected, 2=connecting, 3=disconnecting
            if (connection.readyState === 1) {
              // 尝试ping数据库
              await connection.db.admin().ping();
              healthStatus.services.mongodb = {
                status: 'healthy',
                message: 'Connected',
                readyState: connection.readyState,
                host: connection.host,
                name: connection.name,
              };
            } else {
              healthStatus.services.mongodb = {
                status: 'unhealthy',
                message: `Connection not ready (state: ${connection.readyState})`,
                readyState: connection.readyState,
              };
              healthStatus.status = 'degraded';
            }
          } else {
            healthStatus.services.mongodb = {
              status: 'unhealthy',
              message: 'Mongoose not initialized or connection unavailable',
            };
            healthStatus.status = 'degraded';
          }
        } catch (error) {
          ctx.logger.error('MongoDB health check failed:', error);
          healthStatus.services.mongodb = {
            status: 'unhealthy',
            message: error.message,
          };
          healthStatus.status = 'degraded';
        }
      } else if (databaseType === 'mariadb') {
        // MariaDB 健康检查
        try {
          if (app.sequelize) {
            // 验证数据库连接
            await app.sequelize.authenticate();

            // 获取数据库信息
            const [[result]] = await app.sequelize.query('SELECT DATABASE() as db, VERSION() as version');

            healthStatus.services.mariadb = {
              status: 'healthy',
              message: 'Connected',
              database: result.db,
              version: result.version,
            };
          } else {
            healthStatus.services.mariadb = {
              status: 'unhealthy',
              message: 'Sequelize not initialized',
            };
            healthStatus.status = 'degraded';
          }
        } catch (error) {
          ctx.logger.error('MariaDB health check failed:', error);
          healthStatus.services.mariadb = {
            status: 'unhealthy',
            message: error.message,
          };
          healthStatus.status = 'degraded';
        }
      } else {
        // 未知数据库类型
        healthStatus.services.database = {
          status: 'unknown',
          message: `Unknown database type: ${databaseType}`,
        };
        healthStatus.status = 'degraded';
      }

      // 检查Redis连接（如果配置了Redis）
      if (app.redis) {
        try {
          await app.redis.ping();
          healthStatus.services.redis = {
            status: 'healthy',
            message: 'Connected',
          };
        } catch (error) {
          ctx.logger.error('Redis health check failed:', error);
          healthStatus.services.redis = {
            status: 'unhealthy',
            message: error.message,
          };
          healthStatus.status = 'degraded';
        }
      } else {
        healthStatus.services.redis = {
          status: 'not_configured',
          message: 'Redis not configured',
        };
      }

      // 检查内存使用情况
      const memUsage = process.memoryUsage();
      healthStatus.memory = {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      };

      // 根据健康状态设置HTTP状态码
      const httpStatus = healthStatus.status === 'healthy' ? 200 : healthStatus.status === 'degraded' ? 200 : 503;

      ctx.status = httpStatus;
      ctx.body = healthStatus;
    } catch (error) {
      ctx.logger.error('Health check failed:', error);

      ctx.status = 503;
      ctx.body = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        uptime: process.uptime(),
      };
    }
  }

  /**
   * 简单存活检查
   * GET /api/health/alive
   */
  async alive() {
    const { ctx } = this;

    ctx.status = 200;
    ctx.body = {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * 就绪检查
   * GET /api/health/ready
   */
  async ready() {
    const { ctx, app } = this;

    try {
      const databaseType = process.env.DATABASE_TYPE || 'mongodb';
      let isReady = false;
      const databaseService = {};

      if (databaseType === 'mongodb') {
        // MongoDB 就绪检查
        if (app.mongoose && app.mongoose.connection && app.mongoose.connection.readyState === 1) {
          await app.mongoose.connection.db.admin().ping();
          isReady = true;
          databaseService.mongodb = 'ready';
        }
      } else if (databaseType === 'mariadb') {
        // MariaDB 就绪检查
        if (app.sequelize) {
          await app.sequelize.authenticate();
          isReady = true;
          databaseService.mariadb = 'ready';
        }
      }

      if (isReady) {
        ctx.status = 200;
        ctx.body = {
          status: 'ready',
          timestamp: new Date().toISOString(),
          databaseType,
          services: databaseService,
        };
      } else {
        ctx.status = 503;
        ctx.body = {
          status: 'not ready',
          timestamp: new Date().toISOString(),
          databaseType,
          error: 'Database not connected',
        };
      }
    } catch (error) {
      ctx.logger.error('Ready check failed:', error);
      ctx.status = 503;
      ctx.body = {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}

module.exports = HealthController;
