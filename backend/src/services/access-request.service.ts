import { prisma } from '../db';
import { RequestStatus, Priority } from '@prisma/client';
import { logger } from '../lib/logger';
import { metrics, METRICS } from '../lib/metrics';
import { auditService } from './audit.service';
import { eventBus, EventTypes, RequestApprovedEvent } from '../lib/events';
import { NotFoundError, UnauthorizedError } from '../lib/errors';

export interface CreateAccessRequestData {
  systemId: string;
  requesterId: string;
  role: string;
  justification: string;
  urgency?: Priority;
  expiresAt?: Date;
}

export interface ReviewAccessRequestData {
  reviewerId: string;
  status: 'APPROVED' | 'REJECTED';
  comment?: string;
}

export class AccessRequestService {
  async createRequest(data: CreateAccessRequestData) {
    return metrics.measureTime(
      'create_access_request',
      async () => {
        // Verify system exists
        const system = await prisma.systemResource.findUnique({
          where: { id: data.systemId },
        });

        if (!system) {
          throw new NotFoundError('System not found');
        }

        // Verify requester exists
        const requester = await prisma.principal.findUnique({
          where: { id: data.requesterId },
        });

        if (!requester) {
          throw new NotFoundError('Requester not found');
        }

        // Create the request
        const request = await prisma.accessRequest.create({
          data: {
            systemId: data.systemId,
            requesterId: data.requesterId,
            role: data.role,
            justification: data.justification,
            urgency: data.urgency || 'MEDIUM',
            expiresAt: data.expiresAt,
          },
          include: {
            system: true,
            requester: true,
          },
        });

        // Log audit trail
        await auditService.log({
          actor: data.requesterId,
          action: 'REQUEST_CREATED',
          target: request.id,
          targetType: 'AccessRequest',
          details: {
            systemId: data.systemId,
            role: data.role,
            urgency: request.urgency,
          },
        });

        // Emit event
        await eventBus.emit({
          type: EventTypes.REQUEST_CREATED,
          timestamp: new Date(),
          actor: data.requesterId,
          data: {
            requestId: request.id,
            systemId: data.systemId,
            role: data.role,
          },
        });

        // Update metrics
        metrics.incrementCounter(METRICS.ACCESS_REQUESTS_CREATED, 1, {
          system: system.name,
          urgency: request.urgency,
        });

        logger.info('Access request created', {
          requestId: request.id,
          requesterId: data.requesterId,
          systemId: data.systemId,
        });

        return request;
      },
      { operation: 'create' },
    );
  }

  async reviewRequest(requestId: string, data: ReviewAccessRequestData) {
    const request = await prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: {
        system: true,
        requester: true,
      },
    });

    if (!request) {
      throw new NotFoundError('Access request not found');
    }

    if (request.status !== 'PENDING') {
      throw new UnauthorizedError('Request has already been reviewed');
    }

    // Update request status
    const updated = await prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: data.status,
        reviewerId: data.reviewerId,
        reviewedAt: new Date(),
        reviewComment: data.comment,
      },
      include: {
        system: true,
        requester: true,
        reviewer: true,
      },
    });

    // Log audit trail
    await auditService.log({
      actor: data.reviewerId,
      action: data.status === 'APPROVED' ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED',
      target: requestId,
      targetType: 'AccessRequest',
      details: {
        requesterId: request.requesterId,
        systemId: request.systemId,
        role: request.role,
        comment: data.comment,
      },
    });

    // If approved, create the access grant
    if (data.status === 'APPROVED') {
      const grant = await prisma.accessGrant.create({
        data: {
          systemId: request.systemId,
          principalId: request.requesterId,
          role: request.role,
          source: 'ACCESS_REQUEST',
          accessRequestId: requestId,
          expiresAt: request.expiresAt,
        },
      });

      // Update request with grant ID
      await prisma.accessRequest.update({
        where: { id: requestId },
        data: { status: 'PROVISIONED' },
      });

      // Emit approval event
      const event: RequestApprovedEvent = {
        type: EventTypes.REQUEST_APPROVED,
        timestamp: new Date(),
        actor: data.reviewerId,
        data: {
          requestId: request.id,
          systemId: request.systemId,
          requesterId: request.requesterId,
          role: request.role,
        },
      };
      await eventBus.emit(event);

      logger.info('Access request approved and grant created', {
        requestId: request.id,
        grantId: grant.id,
      });
    } else {
      // Emit rejection event
      await eventBus.emit({
        type: EventTypes.REQUEST_REJECTED,
        timestamp: new Date(),
        actor: data.reviewerId,
        data: {
          requestId: request.id,
          systemId: request.systemId,
          requesterId: request.requesterId,
        },
      });

      logger.info('Access request rejected', { requestId: request.id });
    }

    return updated;
  }

  async getRequestsForReviewer(reviewerId: string) {
    // In production, implement proper reviewer assignment logic
    return prisma.accessRequest.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        system: true,
        requester: true,
      },
      orderBy: [{ urgency: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async getRequestsByUser(userId: string) {
    return prisma.accessRequest.findMany({
      where: { requesterId: userId },
      include: {
        system: true,
        reviewer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingRequestsCount() {
    return prisma.accessRequest.count({
      where: { status: 'PENDING' },
    });
  }
}

export const accessRequestService = new AccessRequestService();
