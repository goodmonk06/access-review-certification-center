import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { reviewService } from '../services/review.service';

const updateDecisionSchema = z.object({
  decision: z.enum(['KEEP', 'REVOKE']),
  comment: z.string().optional(),
});

export async function reviewRoutes(fastify: FastifyInstance) {
  // Get review items for a reviewer
  fastify.get('/reviews', async (request, reply) => {
    try {
      const { reviewerEmail, campaignId } = request.query as {
        reviewerEmail?: string;
        campaignId?: string;
      };

      if (!reviewerEmail) {
        return reply.status(400).send({
          success: false,
          error: 'reviewerEmail query parameter is required',
        });
      }

      const items = await reviewService.getReviewItemsForReviewer(reviewerEmail, campaignId);

      return reply.status(200).send({
        success: true,
        data: items,
      });
    } catch (error) {
      console.error('Get review items error:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get review items',
      });
    }
  });

  // Get a specific review item
  fastify.get('/reviews/:itemId', async (request, reply) => {
    try {
      const { itemId } = request.params as { itemId: string };
      const item = await reviewService.getReviewItem(itemId);

      return reply.status(200).send({
        success: true,
        data: item,
      });
    } catch (error) {
      console.error('Get review item error:', error);
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;

      return reply.status(statusCode).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get review item',
      });
    }
  });

  // Update review decision
  fastify.put('/reviews/:itemId', async (request, reply) => {
    try {
      const { itemId } = request.params as { itemId: string };
      const { reviewerEmail } = request.query as { reviewerEmail?: string };

      if (!reviewerEmail) {
        return reply.status(400).send({
          success: false,
          error: 'reviewerEmail query parameter is required',
        });
      }

      const data = updateDecisionSchema.parse(request.body);
      const updated = await reviewService.updateReviewDecision(itemId, reviewerEmail, data);

      return reply.status(200).send({
        success: true,
        data: updated,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      console.error('Update decision error:', error);
      const statusCode = error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500;

      return reply.status(statusCode).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update decision',
      });
    }
  });

  // Get pending items count for a reviewer
  fastify.get('/reviews/stats/pending', async (request, reply) => {
    try {
      const { reviewerEmail } = request.query as { reviewerEmail?: string };

      if (!reviewerEmail) {
        return reply.status(400).send({
          success: false,
          error: 'reviewerEmail query parameter is required',
        });
      }

      const count = await reviewService.getPendingItemsCount(reviewerEmail);

      return reply.status(200).send({
        success: true,
        data: { count },
      });
    } catch (error) {
      console.error('Get pending count error:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get pending count',
      });
    }
  });
}
