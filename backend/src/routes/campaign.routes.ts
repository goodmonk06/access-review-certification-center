import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { campaignService } from '../services/campaign.service';

const createCampaignSchema = z.object({
  name: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
});

export async function campaignRoutes(fastify: FastifyInstance) {
  // Create a new campaign
  fastify.post('/campaigns', async (request, reply) => {
    try {
      const data = createCampaignSchema.parse(request.body);
      const campaign = await campaignService.createCampaign(data);

      return reply.status(201).send({
        success: true,
        data: campaign,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      console.error('Campaign creation error:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Campaign creation failed',
      });
    }
  });

  // List all campaigns
  fastify.get('/campaigns', async (request, reply) => {
    try {
      const campaigns = await campaignService.listCampaigns();

      return reply.status(200).send({
        success: true,
        data: campaigns,
      });
    } catch (error) {
      console.error('List campaigns error:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list campaigns',
      });
    }
  });

  // Generate review items for a campaign
  fastify.post('/campaigns/:campaignId/generate-items', async (request, reply) => {
    try {
      const { campaignId } = request.params as { campaignId: string };
      const result = await campaignService.generateReviewItems(campaignId);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Generate items error:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate items',
      });
    }
  });

  // Get campaign summary
  fastify.get('/campaigns/:campaignId/summary', async (request, reply) => {
    try {
      const { campaignId } = request.params as { campaignId: string };
      const summary = await campaignService.getCampaignSummary(campaignId);

      return reply.status(200).send({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error('Campaign summary error:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get campaign summary',
      });
    }
  });
}
