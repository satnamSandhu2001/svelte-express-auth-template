import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import logger from '#/lib/logger';
import { errorHandler } from '#/middleware/error.middleware';
import { notFoundHandler } from '#/middleware/notFound.middleware';
import prisma, { connectDB } from './lib/database';
import initializeRouter from './router';
import cookieParser from 'cookie-parser';
import path from 'path';
import { appConfig, ensureEnvVariables } from './lib/config';

ensureEnvVariables();

class Server {
  public app: Application;
  private readonly port: number;

  constructor() {
    logger.info('Initializing server...');
    this.app = express();
    this.port = appConfig.PORT;

    this.initializeMiddleware();
    this.initializeRoutes();

    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    if (appConfig.NODE_ENV === 'production') {
      // CSP for serving static app
      this.app.use(
        helmet({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'", 'data:'],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'none'"],
            },
          },
          crossOriginResourcePolicy: {
            policy: 'cross-origin',
          },
        })
      );
    } else {
      // (Dev)Disable CSP
      this.app.use(
        helmet({
          contentSecurityPolicy: false,
          crossOriginResourcePolicy: {
            policy: 'cross-origin',
          },
        })
      );
    }

    this.app.use(
      cors({
        origin: appConfig.CORS_ORIGINS,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      })
    );
    this.app.use(cookieParser());
    this.app.use(compression());

    this.app.use(
      morgan(appConfig.NODE_ENV === 'production' ? 'combined' : 'dev')
    );

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private serveStaticFiles(): void {
    logger.info('Serving static files...');

    this.app.use(
      express.static(path.join(__dirname, '../../web/build'), {
        maxAge: '1d',
        etag: true,
      })
    );

    this.app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(__dirname, '../../web/build/index.html'));
    });
  }

  private initializeRoutes(): void {
    this.app.use('/api', initializeRouter);

    if (appConfig.NODE_ENV === 'production') {
      this.serveStaticFiles();
    }
  }
  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      await connectDB();
      this.app.listen(this.port, appConfig.NODE_ENV === 'development' ? '0.0.0.0' : '127.0.0.1', () => {
        logger.info(`🚀 Server running on port ${this.port}`);
        logger.info(` Environment: ${appConfig.NODE_ENV || 'development'}`);
        logger.info(` CORS allowed: ${appConfig.CORS_ORIGINS}`);
        logger.info(` Health check: http://localhost:${this.port}/api/ping`);
      });
    } catch (error) {
      logger.error('Failed to start server: ', error);
      process.exit(1);
    }
  }
}

const server = new Server();
server.start();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});
