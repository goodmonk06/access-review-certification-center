import { AuditAction } from '@prisma/client';

export interface DomainEvent {
  type: string;
  timestamp: Date;
  actor?: string;
  data: Record<string, unknown>;
}

export interface EventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
}

/**
 * Simple event bus for domain events
 */
class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Register an event handler
   */
  on<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler as EventHandler);
    this.handlers.set(eventType, handlers);
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];

    // Execute handlers in parallel
    await Promise.allSettled(
      handlers.map((handler) => handler.handle(event))
    );
  }

  /**
   * Remove all handlers for an event type
   */
  off(eventType: string): void {
    this.handlers.delete(eventType);
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();

// Domain event types
export const EventTypes = {
  GRANT_CREATED: 'grant.created',
  GRANT_REVOKED: 'grant.revoked',
  CAMPAIGN_CREATED: 'campaign.created',
  CAMPAIGN_COMPLETED: 'campaign.completed',
  REVIEW_SUBMITTED: 'review.submitted',
  REQUEST_CREATED: 'request.created',
  REQUEST_APPROVED: 'request.approved',
  REQUEST_REJECTED: 'request.rejected',
  DELEGATION_CREATED: 'delegation.created',
  TEMPLATE_CREATED: 'template.created',
} as const;

// Specific event interfaces
export interface GrantCreatedEvent extends DomainEvent {
  type: typeof EventTypes.GRANT_CREATED;
  data: {
    grantId: string;
    systemId: string;
    principalId: string;
    role: string;
  };
}

export interface ReviewSubmittedEvent extends DomainEvent {
  type: typeof EventTypes.REVIEW_SUBMITTED;
  data: {
    reviewItemId: string;
    campaignId: string;
    decision: 'KEEP' | 'REVOKE';
    reviewerEmail: string;
  };
}

export interface RequestApprovedEvent extends DomainEvent {
  type: typeof EventTypes.REQUEST_APPROVED;
  data: {
    requestId: string;
    systemId: string;
    requesterId: string;
    role: string;
  };
}
