import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { templateService } from '../services/template.service';

const createTemplateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  questions: z.record(z.unknown()).optional(),
  rules: z.record(z.unknown()).optional(),
  targetSystems: z.array(z.string()).optional(),
  targetRoles: z.array(z.string()).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  autoApprove: z.boolean().optional(),
  requireComment: z.boolean().optional(),
  createdBy: z.string(),
});

export async function templateRoutes(fastify: FastifyInstance) {
  // Create template
  fastify.post('/templates', async (request, reply) => {
    try {
      const data = createTemplateSchema.parse(request.body);
      const { createdBy, ...templateData } = data;

      const template = await templateService.createTemplate(templateData, createdBy);

      return reply.status(201).send({
        success: true,
        data: template,
      });
    } catch (error) {
      throw error;
    }
  });

  // List templates
  fastify.get('/templates', async (request, reply) => {
    try {
      const { isActive, riskLevel } = request.query as {
        isActive?: string;
        riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      };

      const templates = await templateService.listTemplates({
        isActive: isActive ? isActive === 'true' : undefined,
        riskLevel,
      });

      return reply.status(200).send({
        success: true,
        data: templates,
      });
    } catch (error) {
      throw error;
    }
  });

  // Get template by ID
  fastify.get('/templates/:templateId', async (request, reply) => {
    try {
      const { templateId } = request.params as { templateId: string };

      const template = await templateService.getTemplate(templateId);

      return reply.status(200).send({
        success: true,
        data: template,
      });
    } catch (error) {
      throw error;
    }
  });

  // Update template
  fastify.put('/templates/:templateId', async (request, reply) => {
    try {
      const { templateId } = request.params as { templateId: string };
      const body = request.body as Record<string, unknown> & { updatedBy: string };
      const { updatedBy, ...data } = body;

      const template = await templateService.updateTemplate(templateId, data, updatedBy);

      return reply.status(200).send({
        success: true,
        data: template,
      });
    } catch (error) {
      throw error;
    }
  });

  // Deactivate template
  fastify.post('/templates/:templateId/deactivate', async (request, reply) => {
    try {
      const { templateId } = request.params as { templateId: string };
      const { deactivatedBy } = request.body as { deactivatedBy: string };

      if (!deactivatedBy) {
        return reply.status(400).send({
          success: false,
          error: 'deactivatedBy is required',
        });
      }

      const template = await templateService.deactivateTemplate(templateId, deactivatedBy);

      return reply.status(200).send({
        success: true,
        data: template,
      });
    } catch (error) {
      throw error;
    }
  });
}
