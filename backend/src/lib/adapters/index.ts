import { INotificationAdapter, ConsoleNotificationAdapter } from './notification.adapter';
import { IIdentityProviderAdapter, MockIdPAdapter } from './identity-provider.adapter';
import { IProvisioningAdapter, MockProvisioningAdapter } from './provisioning.adapter';

/**
 * Adapter registry - allows runtime swapping of implementations
 */
class AdapterRegistry {
  private adapters: Map<string, unknown> = new Map();

  register<T>(key: string, adapter: T): void {
    this.adapters.set(key, adapter);
  }

  get<T>(key: string): T {
    const adapter = this.adapters.get(key);
    if (!adapter) {
      throw new Error(`Adapter '${key}' not registered`);
    }
    return adapter as T;
  }

  has(key: string): boolean {
    return this.adapters.has(key);
  }
}

export const registry = new AdapterRegistry();

// Register default adapters
registry.register<INotificationAdapter>('notification', new ConsoleNotificationAdapter());
registry.register<IIdentityProviderAdapter>('idp', new MockIdPAdapter());
registry.register<IProvisioningAdapter>('provisioning', new MockProvisioningAdapter());

// Export adapter interfaces and implementations
export * from './notification.adapter';
export * from './identity-provider.adapter';
export * from './provisioning.adapter';
