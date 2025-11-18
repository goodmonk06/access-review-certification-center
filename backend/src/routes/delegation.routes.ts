import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { delegationService } from '../services/delegation.service';

const createDelegationSchema = z.object({
  reviewItemId: z.string(),
  delegatorId: z.string(),
  delegateeId: z.string(),
  reason: z.string().optional(),
  endsAt: z.string().optional(),
});

export async function delegationRoutes(fastify: FastifyInstance) {
  // Create delegation
  fastify.post('/delegations', async (request, reply) => {
    try {
      const data = createDelegationSchema.parse(request.body);

      const delegation = await delegationService.createDelegation({
        ...data,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      });

      return reply.status(201).send({
        success: true,
        data: delegation,
      });
    } catch (error) {
      throw error;
    }
  });

  // Get delegations for user
  fastify.get('/delegations/user/:userId', async (request, reply) => {
    try {
      const { userId } = request.params as { userId: string };

      const delegations = await delegationService.getDelegationsForUser(userId);

      return reply.status(200).send({
        success: true,
        data: delegations,
      });
    } catch (error) {
      throw error;
    }
  });

  // Revoke delegation
  fastify.post('/delegations/:delegationId/revoke', async (request, reply) => {
    try {
      const { delegationId } = request.params as { delegationId: string };
      const { actorId } = request.body as { actorId: string };

      if (!actorId) {
        return reply.status(400).send({
          success: false,
          error: 'actorId is required in request body',
        });
      }

      const delegation = await delegationService.revokeDelegation(delegationId, actorId);

      return reply.status(200).send({
        success: true,
        data: delegation,
      });
    } catch (error) {
      throw error;
    }
  });
}
