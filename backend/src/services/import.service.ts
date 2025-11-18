import { prisma } from '../db';
import { ImportAccessGrantRequest } from '../types';

export class ImportService {
  async importAccessGrants(grants: ImportAccessGrantRequest[]) {
    const results = {
      imported: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (const grant of grants) {
      try {
        // Upsert SystemResource
        const system = await prisma.systemResource.upsert({
          where: { name: grant.system.name },
          create: {
            name: grant.system.name,
            type: grant.system.type || 'APP',
            description: grant.system.description,
          },
          update: {
            type: grant.system.type || 'APP',
            description: grant.system.description,
          },
        });

        // Upsert Principal
        const principal = await prisma.principal.upsert({
          where: { externalId: grant.principal.externalId },
          create: {
            externalId: grant.principal.externalId,
            name: grant.principal.name,
            email: grant.principal.email,
          },
          update: {
            name: grant.principal.name,
            email: grant.principal.email,
          },
        });

        // Upsert AccessGrant
        const grantedAt = grant.grantedAt ? new Date(grant.grantedAt) : new Date();

        const existingGrant = await prisma.accessGrant.findUnique({
          where: {
            systemId_principalId_role: {
              systemId: system.id,
              principalId: principal.id,
              role: grant.role,
            },
          },
        });

        if (existingGrant) {
          await prisma.accessGrant.update({
            where: { id: existingGrant.id },
            data: {
              grantedAt,
              metaJson: grant.metadata || null,
            },
          });
          results.updated++;
        } else {
          await prisma.accessGrant.create({
            data: {
              systemId: system.id,
              principalId: principal.id,
              role: grant.role,
              grantedAt,
              metaJson: grant.metadata || null,
            },
          });
          results.imported++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Failed to import grant for ${grant.principal.email}: ${errorMsg}`);
      }
    }

    return results;
  }
}

export const importService = new ImportService();
