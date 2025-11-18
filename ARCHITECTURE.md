# System Architecture

## Overview

The Access Review & Certification Center is built as a modern, scalable web application with a clear separation between backend and frontend concerns.

## High-Level Architecture

```
┌─────────────────┐
│   Next.js UI    │ (Port 3000)
│   (Frontend)    │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Fastify API    │ (Port 3001)
│   (Backend)     │
└────────┬────────┘
         │ Prisma ORM
         ▼
┌─────────────────┐
│   PostgreSQL    │ (Port 5432)
│   (Database)    │
└─────────────────┘
```

## Backend Architecture

### Layers

1. **Routes Layer** (`src/routes/`)
   - HTTP endpoint definitions
   - Request validation using Zod
   - Response formatting
   - Error handling

2. **Service Layer** (`src/services/`)
   - Business logic
   - Data transformations
   - Integration orchestration
   - Transaction management

3. **Data Layer** (`src/db.ts` + Prisma)
   - Database connection
   - ORM queries
   - Migration management

### Key Services

#### Import Service
- Upserts SystemResource, Principal, and AccessGrant
- Handles batch imports
- Error collection and reporting

#### Campaign Service
- Creates review campaigns
- Generates review items from access grants
- Calculates campaign statistics
- Triggers email notifications

#### Review Service
- Retrieves review items for reviewers
- Updates review decisions
- Validates reviewer authorization
- Tracks decision history

#### Email Service (Stub)
- Currently logs to console
- Ready for production email provider integration
- Sends review notifications

## Frontend Architecture

### Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── page.tsx           # Login/reviewer selection
│   ├── review/
│   │   └── page.tsx       # Review dashboard
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   └── ReviewItemCard.tsx # Review item display
└── lib/
    ├── api.ts             # Backend API client
    └── types.ts           # TypeScript types
```

### Key Components

#### API Client
- Centralized HTTP client
- Type-safe API calls
- Error handling
- Response parsing

#### ReviewItemCard
- Displays access grant details
- Approve/Revoke actions
- Comment functionality
- Status badges

## Database Schema

### Entity Relationships

```
SystemResource (1) ──< (N) AccessGrant (N) >── (1) Principal
                                │
                                │ (1)
                                │
                                ▼ (N)
                          ReviewItem
                                │
                                │ (N)
                                │
                                ▼ (1)
                        ReviewCampaign
```

### Key Constraints

- **Unique Constraint**: (systemId, principalId, role) for AccessGrant
- **Unique Constraint**: (campaignId, accessGrantId) for ReviewItem
- **Cascade Deletes**: Maintains referential integrity

## API Design

### RESTful Principles

- Resource-based URLs
- HTTP verbs for actions (GET, POST, PUT, DELETE)
- JSON request/response bodies
- Proper status codes

### Response Format

```json
{
  "success": boolean,
  "data": object | array,
  "error": string (optional)
}
```

## Security Considerations

### Current Implementation

- Simple email-based reviewer identification
- No authentication/authorization
- Suitable for internal demo/PoC

### Production Requirements

1. **Authentication**
   - SSO/SAML integration
   - OAuth 2.0 / OIDC
   - Session management

2. **Authorization**
   - RBAC for campaign management
   - Reviewer-item validation
   - Admin vs. reviewer roles

3. **Data Protection**
   - HTTPS/TLS encryption
   - Database encryption at rest
   - Secrets management

4. **Audit Trail**
   - Log all decisions
   - Track changes
   - Compliance reporting

## Scalability Considerations

### Current Design

- Synchronous request processing
- Single database instance
- Suitable for small-medium deployments

### Scaling Options

1. **Horizontal Scaling**
   - Stateless API servers
   - Load balancer distribution
   - Read replicas for database

2. **Performance Optimization**
   - Database indexing (already on reviewerEmail)
   - Query optimization
   - Caching layer (Redis)
   - CDN for frontend assets

3. **Async Processing**
   - Job queue for large imports
   - Background campaign generation
   - Batch email sending

## Integration Points

### Identity Provider (IdP)

```typescript
interface IdPIntegration {
  // Sync users from IdP
  syncPrincipals(): Promise<Principal[]>

  // Get organizational hierarchy
  getReportingStructure(principalId: string): Promise<Principal>

  // Authenticate reviewer
  authenticateReviewer(token: string): Promise<Principal>

  // Query role assignments
  getRoleAssignments(): Promise<AccessGrant[]>
}
```

### Email Service

```typescript
interface EmailProvider {
  send(options: EmailOptions): Promise<void>
  sendBulk(messages: EmailMessage[]): Promise<void>
}

// Supported: SendGrid, AWS SES, SMTP, etc.
```

### Webhook Notifications

Future support for:
- Slack/Teams notifications
- Webhook callbacks on decisions
- Real-time dashboard updates

## Development Workflow

### Local Development

1. Start PostgreSQL
2. Run migrations
3. Start backend (dev mode with hot reload)
4. Start frontend (dev mode with fast refresh)

### Docker Development

1. `docker-compose up`
2. All services start together
3. Automatic restart on code changes (with volumes)

### Testing Strategy

1. **Unit Tests**
   - Service layer logic
   - Validation functions
   - Business rules

2. **Integration Tests**
   - API endpoint testing
   - Database operations
   - Complete workflows

3. **E2E Tests**
   - User flows
   - UI interactions
   - Full stack integration

## Deployment Architecture

### Production Deployment

```
┌─────────────────┐
│   CloudFront    │ CDN
│   or Vercel    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Next.js App   │ Serverless or Container
└─────────────────┘

┌─────────────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ API-1  │ │ API-2  │ Containers
└────┬───┘ └────┬───┘
     │          │
     └────┬─────┘
          ▼
┌─────────────────┐
│  PostgreSQL RDS │ Managed Database
│  (Multi-AZ)     │
└─────────────────┘
```

### Infrastructure as Code

Recommended tools:
- Terraform for cloud resources
- Kubernetes manifests for container orchestration
- Docker Compose for local development

## Monitoring & Observability

### Recommended Tools

1. **Logging**
   - Structured logging (JSON)
   - Log aggregation (ELK, CloudWatch)
   - Error tracking (Sentry)

2. **Metrics**
   - Application metrics (Prometheus)
   - Database metrics (pg_stat_statements)
   - Business metrics (review completion rate)

3. **Tracing**
   - Distributed tracing (OpenTelemetry)
   - Request flow visualization
   - Performance bottleneck identification

## Future Enhancements

### Phase 2 Features

1. **Multi-tenant Support**
   - Organization isolation
   - Separate data partitions
   - Per-tenant configuration

2. **Advanced Workflows**
   - Escalation rules
   - Approval chains
   - Automated revocations

3. **Analytics Dashboard**
   - Campaign metrics
   - Compliance reporting
   - Trend analysis

4. **Bulk Operations**
   - Bulk approve/revoke
   - Delegation
   - Comments templates

5. **Mobile App**
   - React Native app
   - Push notifications
   - Offline support

## Conclusion

This architecture provides a solid foundation for an access review system that can scale from a small PoC to a production-grade enterprise application. The clear separation of concerns, type safety, and modern tech stack enable rapid development while maintaining code quality and reliability.
