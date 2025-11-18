import { prisma } from '../db';
import { RiskLevel } from '@prisma/client';
import { logger } from '../lib/logger';
import { auditService } from './audit.service';
import { NotFoundError, ConflictError } from '../lib/errors';

export interface CreateTemplateData {
  name: string;
  description?: string;
  questions?: Record<string, unknown>;
  rules?: Record<string, unknown>;
  targetSystems?: string[];
  targetRoles?: string[];
  riskLevel?: RiskLevel;
  autoApprove?: boolean;
  requireComment?: boolean;
}

export class TemplateService {
  async createTemplate(data: CreateTemplateData, createdBy: string) {
    // Check for duplicate name
    const existing = await prisma.reviewTemplate.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictError('Template with this name already exists');
    }

    const template = await prisma.reviewTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        questions: data.questions || {},
        rules: data.rules || {},
        targetSystems: data.targetSystems || [],
        targetRoles: data.targetRoles || [],
        riskLevel: data.riskLevel,
        autoApprove: data.autoApprove || false,
        requireComment: data.requireComment || false,
      },
    });

    await auditService.log({
      actor: createdBy,
      action: 'TEMPLATE_CREATED',
      target: template.id,
      targetType: 'ReviewTemplate',
      details: {
        name: template.name,
        riskLevel: template.riskLevel,
      },
    });

    logger.info('Review template created', {
      templateId: template.id,
      name: template.name,
    });

    return template;
  }

  async updateTemplate(
    templateId: string,
    data: Partial<CreateTemplateData>,
    updatedBy: string,
  ) {
    const template = await prisma.reviewTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    const updated = await prisma.reviewTemplate.update({
      where: { id: templateId },
      data,
    });

    await auditService.log({
      actor: updatedBy,
      action: 'TEMPLATE_CREATED', // Could add TEMPLATE_UPDATED action
      target: templateId,
      targetType: 'ReviewTemplate',
      details: data,
    });

    return updated;
  }

  async getTemplate(templateId: string) {
    const template = await prisma.reviewTemplate.findUnique({
      where: { id: templateId },
      include: {
        campaigns: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    return template;
  }

  async listTemplates(filters?: {
    isActive?: boolean;
    riskLevel?: RiskLevel;
  }) {
    return prisma.reviewTemplate.findMany({
      where: {
        isActive: filters?.isActive,
        riskLevel: filters?.riskLevel,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivateTemplate(templateId: string, deactivatedBy: string) {
    const template = await prisma.reviewTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
    });

    await auditService.log({
      actor: deactivatedBy,
      action: 'TEMPLATE_CREATED', // Could add TEMPLATE_DEACTIVATED action
      target: templateId,
      targetType: 'ReviewTemplate',
      details: { isActive: false },
    });

    return template;
  }

  /**
   * Get matching templates for a campaign based on systems and roles
   */
  async getMatchingTemplates(systemIds: string[], roles: string[]) {
    const templates = await prisma.reviewTemplate.findMany({
      where: {
        isActive: true,
        OR: [
          { targetSystems: { hasSome: systemIds } },
          { targetRoles: { hasSome: roles } },
        ],
      },
    });

    return templates;
  }

  /**
   * Apply template questions to a review item
   */
  applyTemplate(template: { questions?: unknown; requireComment?: boolean }) {
    return {
      questions: template.questions || {},
      requireComment: template.requireComment || false,
    };
  }
}

export const templateService = new TemplateService();
