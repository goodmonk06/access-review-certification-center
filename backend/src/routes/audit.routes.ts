import { FastifyInstance } from 'fastify';
import { AuditAction } from '@prisma/client';
import { auditService } from '../services/audit.service';

export async function auditRoutes(fastify: FastifyInstance) {
  // Get audit logs
  fastify.get('/audit-logs', async (request, reply) => {
    try {
      const query = request.query as {
        actor?: string;
        action?: AuditAction;
        targetType?: string;
        startDate?: string;
        endDate?: string;
        limit?: string;
      };

      const logs = await auditService.getLogs({
        actor: query.actor,
        action: query.action,
        targetType: query.targetType,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        limit: query.limit ? parseInt(query.limit, 10) : undefined,
      });

      return reply.status(200).send({
        success: true,
        data: logs,
      });
    } catch (error) {
      throw error;
    }
  });

  // Get actions summary
  fastify.get('/audit-logs/summary', async (request, reply) => {
    try {
      const query = request.query as {
        startDate?: string;
        endDate?: string;
      };

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const summary = await auditService.getActionsSummary(
        query.startDate ? new Date(query.startDate) : thirtyDaysAgo,
        query.endDate ? new Date(query.endDate) : now,
      );

      return reply.status(200).send({
        success: true,
        data: summary,
      });
    } catch (error) {
      throw error;
    }
  });

  // Get user activity
  fastify.get('/audit-logs/user/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };
      const { limit } = request.query as { limit?: string };

      const logs = await auditService.getUserActivity(
        userId,
        limit ? parseInt(limit, 10) : undefined,
      );

      return reply.status(200).send({
        success: true,
        data: logs,
      });
    } catch (error) {
      throw error;
    }
  });
}
