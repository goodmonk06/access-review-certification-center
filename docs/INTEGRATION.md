# Integration Guide

How to integrate the Access Review & Certification Center with your existing systems.

## Table of Contents

1. [Identity Provider Integration](#identity-provider-integration)
2. [Access Grant Import](#access-grant-import)
3. [Provisioning Integration](#provisioning-integration)
4. [Notification Integration](#notification-integration)
5. [Event-Driven Integration](#event-driven-integration)

---

## Identity Provider Integration

### Overview

Sync users and organizational hierarchy from your IdP.

### Supported Providers

- **Okta** (planned)
- **Azure AD** (planned)
- **Google Workspace** (planned)
- **Custom SAML/OIDC** (adapter pattern)

### Implementation

#### 1. Create Custom Adapter

```typescript
import { IIdentityProviderAdapter, IdPUser } from './lib/adapters';

export class MyIdPAdapter implements IIdentityProviderAdapter {
  async syncUsers(): Promise<IdPUser[]> {
    // Fetch users from your IdP
    const response = await fetch('https://your-idp.com/api/users');
    const users = await response.json();

    return users.map(user => ({
      externalId: user.id,
      name: user.displayName,
      email: user.email,
      department: user.department,
      title: user.jobTitle,
      managerId: user.managerId,
      isActive: user.status === 'active',
    }));
  }

  async syncRoleAssignments(): Promise<IdPRoleAssignment[]> {
    // Fetch role assignments from your IdP
    // ...
  }
}
```

#### 2. Register Adapter

```typescript
import { registry } from './lib/adapters';

registry.register('idp', new MyIdPAdapter(config));
```

#### 3. Sync Schedule

Set up a cron job to sync users periodically:

```typescript
import { registry } from './lib/adapters';

async function syncFromIdP() {
  const idp = registry.get<IIdentityProviderAdapter>('idp');

  const users = await idp.syncUsers();

  for (const user of users) {
    await prisma.principal.upsert({
      where: { externalId: user.externalId },
      create: user,
      update: user,
    });
  }
}

// Run daily at 2 AM
schedule('0 2 * * *', syncFromIdP);
```

---

## Access Grant Import

### Batch Import

Use the import API to bulk sync access grants from external systems:

```typescript
const grants = await fetchGrantsFromSystem('salesforce');

await fetch('http://localhost:3001/import/access-grants', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(grants.map(g => ({
    system: {
      name: 'Salesforce CRM',
      type: 'APP',
    },
    principal: {
      externalId: g.userId,
      name: g.userName,
      email: g.userEmail,
    },
    role: g.roleName,
    grantedAt: g.assignedAt,
    metadata: g.customFields,
  }))),
});
```

### Real-Time Sync

Listen to IdP events and sync in real-time:

```typescript
idp.on('role.assigned', async (event) => {
  await fetch('http://localhost:3001/import/access-grants', {
    method: 'POST',
    body: JSON.stringify([{
      system: { name: event.application },
      principal: { externalId: event.userId, ... },
      role: event.roleName,
    }]),
  });
});
```

---

## Provisioning Integration

### Overview

Automatically provision/deprovision access when decisions are made.

### Implementation

#### 1. Create Provisioning Adapter

```typescript
import { IProvisioningAdapter, ProvisioningRequest } from './lib/adapters';

export class SalesforceProvisioningAdapter implements IProvisioningAdapter {
  async provision(request: ProvisioningRequest): Promise<ProvisioningResult> {
    // Call Salesforce API to grant access
    const response = await salesforceAPI.assignPermissionSet({
      userId: request.userId,
      permissionSet: request.role,
    });

    return {
      success: true,
      externalId: response.id,
    };
  }

  async deprovision(request: ProvisioningRequest): Promise<ProvisioningResult> {
    // Call Salesforce API to revoke access
    await salesforceAPI.revokePermissionSet({
      userId: request.userId,
      permissionSet: request.role,
    });

    return { success: true };
  }
}
```

#### 2. Listen to Review Events

```typescript
import { eventBus, EventTypes } from './lib/events';

eventBus.on(EventTypes.REVIEW_SUBMITTED, async (event) => {
  if (event.data.decision === 'REVOKE') {
    const provisioning = registry.get<IProvisioningAdapter>('provisioning');

    await provisioning.deprovision({
      systemId: event.data.systemId,
      userId: event.data.userId,
      role: event.data.role,
      action: 'deprovision',
    });
  }
});
```

---

## Notification Integration

### Email Notifications

#### SendGrid

```typescript
import { EmailNotificationAdapter } from './lib/adapters';

class SendGridAdapter extends EmailNotificationAdapter {
  async send(message: NotificationMessage): Promise<void> {
    await sgMail.send({
      to: message.recipient,
      from: 'noreply@company.com',
      subject: message.subject,
      html: message.body,
    });
  }
}

registry.register('notification', new SendGridAdapter());
```

### Slack Notifications

```typescript
class SlackAdapter implements INotificationAdapter {
  async send(message: NotificationMessage): Promise<void> {
    await slackClient.chat.postMessage({
      channel: message.recipient,
      text: message.body,
      blocks: this.formatBlocks(message),
    });
  }

  private formatBlocks(message: NotificationMessage) {
    return [
      {
        type: 'header',
        text: { type: 'plain_text', text: message.subject },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: message.body },
      },
    ];
  }
}
```

---

## Event-Driven Integration

### Webhook Integration

#### Setup Webhook Consumer

```typescript
app.post('/webhooks/access-review', async (req, res) => {
  const event = req.body;

  switch (event.type) {
    case 'review.submitted':
      await handleReviewSubmitted(event.data);
      break;

    case 'request.approved':
      await handleRequestApproved(event.data);
      break;

    case 'campaign.completed':
      await handleCampaignCompleted(event.data);
      break;
  }

  res.json({ received: true });
});
```

#### Event Types

| Event Type | Description | Data |
|-----------|-------------|------|
| `review.submitted` | Review decision made | reviewItemId, decision, reviewerEmail |
| `request.approved` | Access request approved | requestId, systemId, userId |
| `request.rejected` | Access request rejected | requestId, systemId, userId |
| `campaign.completed` | Campaign finished | campaignId, stats |
| `delegation.created` | Task delegated | delegationId, delegatorId, delegateeId |

### Message Queue Integration

For high-volume environments, use a message queue:

```typescript
import { eventBus } from './lib/events';
import { publishToSQS } from './integrations/aws-sqs';

eventBus.on('*', async (event) => {
  await publishToSQS({
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify(event),
  });
});
```

---

## Best Practices

### 1. Idempotency

Always design integrations to be idempotent:

```typescript
await prisma.accessGrant.upsert({
  where: { systemId_principalId_role: { ... } },
  create: { ... },
  update: { ... },
});
```

### 2. Error Handling

Implement retry logic with exponential backoff:

```typescript
async function syncWithRetry(fn: () => Promise<void>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fn();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

### 3. Monitoring

Track integration health:

```typescript
import { metrics } from './lib/metrics';

metrics.incrementCounter('idp_sync_total');
metrics.setGauge('idp_sync_duration_ms', duration);
```

### 4. Security

- Store credentials in secrets manager
- Use API keys/OAuth tokens
- Rotate credentials regularly
- Encrypt sensitive data at rest

---

## Example: Complete Okta Integration

```typescript
class OktaIntegration {
  private idp: OktaIdPAdapter;
  private provisioning: OktaProvisioningAdapter;

  constructor() {
    this.idp = new OktaIdPAdapter(process.env.OKTA_API_TOKEN, process.env.OKTA_DOMAIN);
    this.provisioning = new OktaProvisioningAdapter(/* ... */);

    registry.register('idp', this.idp);
    registry.register('provisioning', this.provisioning);
  }

  async setup() {
    // Initial sync
    await this.syncUsers();
    await this.syncGrants();

    // Schedule periodic syncs
    schedule('0 */6 * * *', () => this.syncUsers()); // Every 6 hours
    schedule('0 */2 * * *', () => this.syncGrants()); // Every 2 hours

    // Listen to events for provisioning
    eventBus.on(EventTypes.REQUEST_APPROVED, async (event) => {
      await this.provisioning.provision({
        systemId: event.data.systemId,
        userId: event.data.userId,
        role: event.data.role,
        action: 'provision',
      });
    });
  }

  async syncUsers() {
    const users = await this.idp.syncUsers();
    // Upsert to database
  }

  async syncGrants() {
    const grants = await this.idp.syncRoleAssignments();
    // Import grants
  }
}

// Bootstrap
const okta = new OktaIntegration();
await okta.setup();
```

---

## Troubleshooting

### Common Issues

**Issue: Import fails with validation errors**

Solution: Check that all required fields are provided and data types match schema.

**Issue: Provisioning doesn't execute**

Solution: Verify event handlers are registered and adapter is configured correctly.

**Issue: Duplicate entries created**

Solution: Ensure you're using unique constraints and upsert operations.

### Debug Mode

Enable debug logging:

```typescript
process.env.NODE_ENV = 'development';
process.env.LOG_LEVEL = 'debug';
```

### Health Checks

Verify integrations are healthy:

```typescript
GET /integrations/health

{
  "idp": { "status": "healthy", "lastSync": "2025-01-18T10:00:00Z" },
  "provisioning": { "status": "healthy" },
  "notifications": { "status": "healthy", "queueSize": 5 }
}
```
