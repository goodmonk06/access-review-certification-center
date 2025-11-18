import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { importService } from '../services/import.service';

const importGrantSchema = z.object({
  system: z.object({
    name: z.string(),
    type: z.enum(['APP', 'DB', 'OTHER']).optional(),
    description: z.string().optional(),
  }),
  principal: z.object({
    externalId: z.string(),
    name: z.string(),
    email: z.string().email(),
  }),
  role: z.string(),
  grantedAt: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const importRequestSchema = z.array(importGrantSchema);

export async function importRoutes(fastify: FastifyInstance) {
  fastify.post('/import/access-grants', async (request, reply) => {
    try {
      const grants = importRequestSchema.parse(request.body);
      const result = await importService.importAccessGrants(grants);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      console.error('Import error:', error);
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
      });
    }
  });
}
