import { prisma } from '../db';
import { AuditAction } from '@prisma/client';
import { logger } from '../lib/logger';

export interface AuditLogEntry {
  actor: string;
  action: AuditAction;
  target?: string;
  targetType?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

export class AuditService {
  async log(entry: AuditLogEntry) {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          actor: entry.actor,
          action: entry.action,
          target: entry.target,
          targetType: entry.targetType,
          details: entry.details || {},
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          success: entry.success ?? true,
          errorMessage: entry.errorMessage,
        },
      });

      logger.debug('Audit log created', {
        auditLogId: auditLog.id,
        actor: entry.actor,
        action: entry.action,
      });

      return auditLog;
    } catch (error) {
      logger.error('Failed to create audit log', error, entry);
      // Don't throw - audit logging should never break main flow
    }
  }

  async getLogs(filters: {
    actor?: string;
    action?: AuditAction;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};

    if (filters.actor) where.actor = filters.actor;
    if (filters.action) where.action = filters.action;
    if (filters.targetType) where.targetType = filters.targetType;

    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) (where.timestamp as Record<string, unknown>).gte = filters.startDate;
      if (filters.endDate) (where.timestamp as Record<string, unknown>).lte = filters.endDate;
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100,
    });
  }

  async getActionsSummary(startDate: Date, endDate: Date) {
    const logs = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        action: true,
      },
    });

    return logs.map((log) => ({
      action: log.action,
      count: log._count.action,
    }));
  }

  async getUserActivity(userId: string, limit: number = 50) {
    return prisma.auditLog.findMany({
      where: { actor: userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}

export const auditService = new AuditService();
