export interface ProvisioningRequest {
  systemId: string;
  userId: string;
  role: string;
  action: 'provision' | 'deprovision';
}

export interface ProvisioningResult {
  success: boolean;
  message?: string;
  externalId?: string;
}

export interface IProvisioningAdapter {
  provision(request: ProvisioningRequest): Promise<ProvisioningResult>;
  deprovision(request: ProvisioningRequest): Promise<ProvisioningResult>;
  checkAccess(systemId: string, userId: string, role: string): Promise<boolean>;
}

/**
 * Mock provisioning adapter for development
 */
export class MockProvisioningAdapter implements IProvisioningAdapter {
  async provision(request: ProvisioningRequest): Promise<ProvisioningResult> {
    console.log('[PROVISION]', request.action, request.userId, 'to', request.systemId);
    return {
      success: true,
      message: `Successfully ${request.action}ed ${request.role} for ${request.userId}`,
      externalId: `mock-${Date.now()}`,
    };
  }

  async deprovision(request: ProvisioningRequest): Promise<ProvisioningResult> {
    return this.provision({ ...request, action: 'deprovision' });
  }

  async checkAccess(systemId: string, userId: string, role: string): Promise<boolean> {
    // Mock implementation - always returns true
    return true;
  }
}
