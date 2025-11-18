import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { accessRequestService } from '../services/access-request.service';

const createRequestSchema = z.object({
  systemId: z.string(),
  requesterId: z.string(),
  role: z.string(),
  justification: z.string().min(10),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  expiresAt: z.string().optional(),
});

const reviewRequestSchema = z.object({
  reviewerId: z.string(),
  status: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().optional(),
});

export async function accessRequestRoutes(fastify: FastifyInstance) {
  // Create access request
  fastify.post('/access-requests', async (request, reply) => {
    try {
      const data = createRequestSchema.parse(request.body);

      const accessRequest = await accessRequestService.createRequest({
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      });

      return reply.status(201).send({
        success: true,
        data: accessRequest,
      });
    } catch (error) {
      throw error;
    }
  });

  // Get pending requests (for reviewers)
  fastify.get('/access-requests/pending', async (request, reply) => {
    try {
      const { reviewerId } = request.query as { reviewerId?: string };

      if (!reviewerId) {
        return reply.status(400).send({
          success: false,
          error: 'reviewerId query parameter is required',
        });
      }

      const requests = await accessRequestService.getRequestsForReviewer(reviewerId);

      return reply.status(200).send({
        success: true,
        data: requests,
      });
    } catch (error) {
      throw error;
    }
  });

  // Get requests by user
  fastify.get('/access-requests/user/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };

      const requests = await accessRequestService.getRequestsByUser(userId);

      return reply.status(200).send({
        success: true,
        data: requests,
      });
    } catch (error) {
      throw error;
    }
  });

  // Review access request
  fastify.post('/access-requests/:requestId/review', async (request, reply) => {
    try {
      const { requestId } = request.params as { requestId: string };
      const data = reviewRequestSchema.parse(request.body);

      const result = await accessRequestService.reviewRequest(requestId, data);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      throw error;
    }
  });

  // Get pending count
  fastify.get('/access-requests/stats/pending', async (request, reply) => {
    try {
      const count = await accessRequestService.getPendingRequestsCount();

      return reply.status(200).send({
        success: true,
        data: { count },
      });
    } catch (error) {
      throw error;
    }
  });
}
