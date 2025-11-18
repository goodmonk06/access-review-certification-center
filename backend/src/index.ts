import Fastify from 'fastify';
import cors from '@fastify/cors';
import { connectDB, disconnectDB } from './db';
import { importRoutes } from './routes/import.routes';
import { campaignRoutes } from './routes/campaign.routes';
import { reviewRoutes } from './routes/review.routes';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = '0.0.0.0';

async function startServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  });

  // Register CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  await fastify.register(importRoutes);
  await fastify.register(campaignRoutes);
  await fastify.register(reviewRoutes);

  // Connect to database
  await connectDB();

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`\nReceived ${signal}, closing server...`);
      await fastify.close();
      await disconnectDB();
      process.exit(0);
    });
  });

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`\n✓ Server running at http://${HOST}:${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (err) {
    fastify.log.error(err);
    await disconnectDB();
    process.exit(1);
  }
}

startServer();
