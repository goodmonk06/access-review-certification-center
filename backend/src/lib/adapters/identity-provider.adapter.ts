export interface IdPUser {
  externalId: string;
  name: string;
  email: string;
  department?: string;
  title?: string;
  managerId?: string;
  isActive: boolean;
}

export interface IdPRoleAssignment {
  userId: string;
  systemId: string;
  systemName: string;
  role: string;
  grantedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface IIdentityProviderAdapter {
  syncUsers(): Promise<IdPUser[]>;
  syncRoleAssignments(): Promise<IdPRoleAssignment[]>;
  getUser(userId: string): Promise<IdPUser | null>;
  getReportingChain(userId: string): Promise<IdPUser[]>;
}

/**
 * Mock IdP adapter for development/testing
 */
export class MockIdPAdapter implements IIdentityProviderAdapter {
  async syncUsers(): Promise<IdPUser[]> {
    // Return mock users
    return [
      {
        externalId: 'alice@company.com',
        name: 'Alice Johnson',
        email: 'alice@company.com',
        department: 'Sales',
        title: 'Sales Manager',
        isActive: true,
      },
      {
        externalId: 'bob@company.com',
        name: 'Bob Smith',
        email: 'bob@company.com',
        department: 'Engineering',
        title: 'Software Engineer',
        managerId: 'carol@company.com',
        isActive: true,
      },
    ];
  }

  async syncRoleAssignments(): Promise<IdPRoleAssignment[]> {
    return [];
  }

  async getUser(userId: string): Promise<IdPUser | null> {
    const users = await this.syncUsers();
    return users.find((u) => u.externalId === userId) || null;
  }

  async getReportingChain(userId: string): Promise<IdPUser[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const chain: IdPUser[] = [user];
    let currentUser = user;

    while (currentUser.managerId) {
      const manager = await this.getUser(currentUser.managerId);
      if (!manager) break;
      chain.push(manager);
      currentUser = manager;
    }

    return chain;
  }
}

/**
 * Okta adapter (stub)
 */
export class OktaIdPAdapter implements IIdentityProviderAdapter {
  constructor(private apiToken: string, private domain: string) {}

  async syncUsers(): Promise<IdPUser[]> {
    // TODO: Implement Okta API integration
    throw new Error('Not implemented');
  }

  async syncRoleAssignments(): Promise<IdPRoleAssignment[]> {
    // TODO: Implement Okta API integration
    throw new Error('Not implemented');
  }

  async getUser(userId: string): Promise<IdPUser | null> {
    // TODO: Implement Okta API integration
    throw new Error('Not implemented');
  }

  async getReportingChain(userId: string): Promise<IdPUser[]> {
    // TODO: Implement Okta API integration
    throw new Error('Not implemented');
  }
}
