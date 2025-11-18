import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { ImportService } from './import.service';
import { testPrisma, cleanDatabase, disconnectDatabase } from '../test/helpers/db.helper';
import { ImportAccessGrantRequest } from '../types';

describe('ImportService', () => {
  const importService = new ImportService();

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('importAccessGrants', () => {
    it('should import new access grants successfully', async () => {
      const grants: ImportAccessGrantRequest[] = [
        {
          system: {
            name: 'Test System',
            type: 'APP',
            description: 'Test description',
          },
          principal: {
            externalId: 'user1@test.com',
            name: 'Test User',
            email: 'user1@test.com',
          },
          role: 'Admin',
          grantedAt: '2024-01-01T00:00:00Z',
        },
      ];

      const result = await importService.importAccessGrants(grants);

      expect(result.imported).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify data in database
      const system = await testPrisma.systemResource.findUnique({
        where: { name: 'Test System' },
      });
      expect(system).toBeTruthy();
      expect(system?.type).toBe('APP');

      const principal = await testPrisma.principal.findUnique({
        where: { externalId: 'user1@test.com' },
      });
      expect(principal).toBeTruthy();
      expect(principal?.name).toBe('Test User');

      const grant = await testPrisma.accessGrant.findFirst({
        where: { role: 'Admin' },
      });
      expect(grant).toBeTruthy();
    });

    it('should update existing grants on re-import', async () => {
      const grants: ImportAccessGrantRequest[] = [
        {
          system: { name: 'System A', type: 'APP' },
          principal: {
            externalId: 'user1@test.com',
            name: 'Test User',
            email: 'user1@test.com',
          },
          role: 'Admin',
          grantedAt: '2024-01-01T00:00:00Z',
        },
      ];

      // First import
      await importService.importAccessGrants(grants);

      // Second import with updated grant date
      grants[0].grantedAt = '2024-02-01T00:00:00Z';
      const result = await importService.importAccessGrants(grants);

      expect(result.imported).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle multiple grants in batch', async () => {
      const grants: ImportAccessGrantRequest[] = [
        {
          system: { name: 'System A', type: 'APP' },
          principal: {
            externalId: 'user1@test.com',
            name: 'User 1',
            email: 'user1@test.com',
          },
          role: 'Admin',
        },
        {
          system: { name: 'System B', type: 'DB' },
          principal: {
            externalId: 'user2@test.com',
            name: 'User 2',
            email: 'user2@test.com',
          },
          role: 'Analyst',
        },
        {
          system: { name: 'System A', type: 'APP' },
          principal: {
            externalId: 'user2@test.com',
            name: 'User 2',
            email: 'user2@test.com',
          },
          role: 'Viewer',
        },
      ];

      const result = await importService.importAccessGrants(grants);

      expect(result.imported).toBe(3);
      expect(result.errors).toHaveLength(0);

      const totalGrants = await testPrisma.accessGrant.count();
      expect(totalGrants).toBe(3);
    });

    it('should handle errors gracefully and continue processing', async () => {
      const grants: ImportAccessGrantRequest[] = [
        {
          system: { name: 'Valid System', type: 'APP' },
          principal: {
            externalId: 'valid@test.com',
            name: 'Valid User',
            email: 'valid@test.com',
          },
          role: 'Admin',
        },
        // This will cause an error due to invalid email
        {
          system: { name: 'System X', type: 'APP' },
          principal: {
            externalId: 'invalid',
            name: 'Invalid User',
            email: '', // Invalid email
          },
          role: 'Admin',
        } as ImportAccessGrantRequest,
      ];

      const result = await importService.importAccessGrants(grants);

      // Should have processed at least one successfully
      expect(result.imported).toBeGreaterThan(0);
    });

    it('should upsert system resources correctly', async () => {
      const grants: ImportAccessGrantRequest[] = [
        {
          system: { name: 'Shared System', type: 'APP', description: 'First description' },
          principal: {
            externalId: 'user1@test.com',
            name: 'User 1',
            email: 'user1@test.com',
          },
          role: 'Role A',
        },
        {
          system: { name: 'Shared System', type: 'DB', description: 'Updated description' },
          principal: {
            externalId: 'user2@test.com',
            name: 'User 2',
            email: 'user2@test.com',
          },
          role: 'Role B',
        },
      ];

      await importService.importAccessGrants(grants);

      const systems = await testPrisma.systemResource.findMany({
        where: { name: 'Shared System' },
      });

      // Should only have one system resource with the updated description
      expect(systems).toHaveLength(1);
      expect(systems[0].description).toBe('Updated description');
    });
  });
});
