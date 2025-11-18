# Access Review & Certification Center

> **Production-Ready** access governance platform for periodic certification of user permissions across enterprise systems.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)

## 🎯 Overview

The Access Review & Certification Center is a comprehensive governance platform that enables organizations to:

- **Automate Access Reviews**: Schedule periodic campaigns to review and certify user access
- **Centralize Access Requests**: Self-service workflow for requesting and approving access
- **Maintain Audit Trails**: Complete, immutable audit logs for compliance (SOC 2, ISO 27001)
- **Delegate Reviews**: Flexible delegation for out-of-office scenarios
- **Template-Based Workflows**: Reusable templates for different risk levels
- **Integrate Seamlessly**: Adapter pattern for IdP, provisioning, and notification systems

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js UI    │  Review Dashboard, Request Forms
└────────┬────────┘
         │ REST API
┌────────▼────────┐
│  Fastify API    │  Business Logic + Services
├─────────────────┤
│  Adapter Layer  │  IdP, Provisioning, Notifications
└────────┬────────┘
         │ Prisma ORM
┌────────▼────────┐
│   PostgreSQL    │  Complete Audit Trail
└─────────────────┘
```

### Tech Stack

**Backend:**
- Node.js 20+ with TypeScript
- Fastify (high-performance web framework)
- Prisma ORM (type-safe database access)
- PostgreSQL 15+ (relational database)

**Frontend:**
- Next.js 14 (React framework)
- Tailwind CSS (styling)
- TypeScript (type safety)

**Infrastructure:**
- Docker Compose (local development)
- Vitest (testing framework)
- ESLint + Prettier (code quality)

---

## 📊 Domain Model

### Core Entities

```mermaid
graph TD
    SystemResource -->|has many| AccessGrant
    Principal -->|has many| AccessGrant
    AccessGrant -->|reviewed in| ReviewItem
    ReviewCampaign -->|contains| ReviewItem
    ReviewTemplate -->|used by| ReviewCampaign
    AccessRequest -->|creates| AccessGrant
    ReviewItem -->|can be| Delegation
```

**SystemResource**: Protected resources (apps, databases, cloud platforms)
- Risk levels (LOW, MEDIUM, HIGH, CRITICAL)
- Tags and metadata
- Integration configs

**Principal**: Users with access grants
- Organizational hierarchy (managerId)
- Department and title
- Active/inactive status

**AccessGrant**: Permission assignments
- Source tracking (MANUAL, IMPORTED, ACCESS_REQUEST, AUTOMATED)
- Expiration dates
- Rich metadata

**ReviewCampaign**: Time-bound review cycles
- Template-based workflows
- Auto-reminder functionality
- Status tracking (DRAFT, ACTIVE, COMPLETED, ARCHIVED)

**ReviewItem**: Individual review tasks
- Decision tracking (PENDING, KEEP, REVOKE)
- Priority levels
- Delegation support

**AccessRequest**: Self-service access requests
- Justification required
- Urgency levels
- Approval workflow

**ReviewTemplate**: Reusable review configurations
- Custom questions
- Risk-based rules
- Auto-approval logic

**Delegation**: Review task delegation
- Time-bounded delegations
- Reason tracking
- Full audit trail

**AuditLog**: Immutable event log
- All system actions
- IP address and user agent
- Success/failure tracking

**ComplianceReport**: Pre-built reports
- SOC 2, ISO 27001 formats
- Campaign summaries
- Anomaly detection

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)

### Quick Start

```bash
# Clone repository
git clone https://github.com/yourorg/access-review-certification-center
cd access-review-certification-center

# Start services with Docker
docker-compose up -d

# Run migrations
docker exec access-review-backend npx prisma migrate deploy

# Seed database with demo data
docker exec access-review-backend npm run db:seed:comprehensive

# Access the application
open http://localhost:3000
```

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start PostgreSQL
docker-compose up -d postgres

# Backend setup
cd backend
npm install
npx prisma migrate dev
npx prisma generate
npm run db:seed:comprehensive
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://accessreview:accessreview@localhost:5432/accessreview"

# Backend
PORT=3001
NODE_ENV=development

# Email (optional)
EMAIL_ENABLED=false
EMAIL_FROM=noreply@company.com
```

---

## 📚 Example Workflows

### 1. Access Review Campaign

```bash
# Create campaign
curl -X POST http://localhost:3001/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 2025 Access Review",
    "periodStart": "2025-01-01T00:00:00Z",
    "periodEnd": "2025-03-31T23:59:59Z"
  }'

# Generate review items
curl -X POST http://localhost:3001/campaigns/{campaignId}/generate-items

# Reviewer views pending items
open http://localhost:3000/review?email=alice@company.com

# Submit review decision
curl -X PUT http://localhost:3001/reviews/{itemId}?reviewerEmail=alice@company.com \
  -H "Content-Type: application/json" \
  -d '{"decision": "KEEP", "comment": "Still required"}'

# View campaign summary
curl http://localhost:3001/campaigns/{campaignId}/summary
```

### 2. Access Request Workflow

```bash
# User requests access
curl -X POST http://localhost:3001/access-requests \
  -H "Content-Type: application/json" \
  -d '{
    "systemId": "...",
    "requesterId": "...",
    "role": "Analyst",
    "justification": "Need access for Q1 analytics project",
    "urgency": "HIGH"
  }'

# Manager reviews pending requests
curl http://localhost:3001/access-requests/pending?reviewerId=alice@company.com

# Approve request
curl -X POST http://localhost:3001/access-requests/{requestId}/review \
  -H "Content-Type: application/json" \
  -d '{
    "reviewerId": "...",
    "status": "APPROVED",
    "comment": "Approved for 90 days"
  }'

# System automatically creates AccessGrant
```

### 3. Delegation Workflow

```bash
# Delegate review items
curl -X POST http://localhost:3001/delegations \
  -H "Content-Type: application/json" \
  -d '{
    "reviewItemId": "...",
    "delegatorId": "...",
    "delegateeId": "...",
    "reason": "Out of office",
    "endsAt": "2025-02-01T00:00:00Z"
  }'

# Delegatee views delegated items
curl http://localhost:3001/delegations/user/{userId}

# Revoke delegation
curl -X POST http://localhost:3001/delegations/{delegationId}/revoke \
  -d '{"actorId": "..."}'
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

---

## 📖 Documentation

- **[API Reference](docs/API.md)**: Complete API documentation
- **[Integration Guide](docs/INTEGRATION.md)**: IdP, provisioning, notifications
- **[Architecture](ARCHITECTURE.md)**: System design and components
- **[Phase 3 Overview](docs/PHASE3_OVERVIEW.md)**: Feature roadmap

---

## 🔌 Integration Examples

### Okta Identity Provider

```typescript
import { OktaIdPAdapter } from './lib/adapters';

const okta = new OktaIdPAdapter(apiToken, domain);
registry.register('idp', okta);

// Sync users every 6 hours
schedule('0 */6 * * *', async () => {
  const users = await okta.syncUsers();
  // Upsert to database
});
```

### Salesforce Provisioning

```typescript
eventBus.on(EventTypes.REVIEW_SUBMITTED, async (event) => {
  if (event.data.decision === 'REVOKE') {
    await salesforceAPI.revokePermissionSet({
      userId: event.data.userId,
      permissionSet: event.data.role,
    });
  }
});
```

### Slack Notifications

```typescript
import { SlackNotificationAdapter } from './lib/adapters';

registry.register('notification', new SlackNotificationAdapter(webhookUrl));

// Notifications sent automatically for:
// - New review items assigned
// - Access requests awaiting approval
// - Campaign deadlines approaching
```

---

## 🔒 Security

### Authentication

- Email-based (development)
- SSO/SAML integration ready
- OAuth 2.0 / OIDC support planned

### Authorization

- Role-based access control (RBAC)
- Reviewer validation
- Delegation authorization

### Data Protection

- Encrypted credentials storage
- Audit trail immutability
- GDPR/CCPA compliance support

### Best Practices

- ✅ Input validation (Zod schemas)
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection
- ✅ HTTPS enforcement (production)
- ✅ Rate limiting (planned)
- ✅ Security headers

---

## 📊 Observability

### Logging

Structured JSON logging with correlation IDs:

```typescript
import { logger } from './lib/logger';

logger.info('Campaign created', {
  campaignId: campaign.id,
  reviewItems: count,
});
```

### Metrics

Built-in metrics collection:

```typescript
import { metrics, METRICS } from './lib/metrics';

metrics.incrementCounter(METRICS.REVIEWS_SUBMITTED, 1, {
  decision: 'KEEP',
  campaign: campaignId,
});
```

### Audit Logs

Every action is logged:

```typescript
await auditService.log({
  actor: 'alice@company.com',
  action: 'REVIEW_SUBMITTED',
  target: reviewItemId,
  details: { decision: 'KEEP' },
});
```

---

## 🎯 Roadmap

### Phase 4 (Planned)

- [ ] Multi-tenancy support
- [ ] Advanced analytics dashboard
- [ ] Machine learning for anomaly detection
- [ ] Mobile app (React Native)
- [ ] Advanced reporting (PDF, Excel)
- [ ] Integration marketplace
- [ ] GraphQL API
- [ ] Real-time collaboration
- [ ] Advanced workflow engine
- [ ] Compliance automation (GDPR, SOX)

### Integrations

- [ ] Okta
- [ ] Azure AD
- [ ] Google Workspace
- [ ] AWS IAM
- [ ] GitHub
- [ ] Salesforce
- [ ] ServiceNow
- [ ] Jira

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with:
- [Fastify](https://www.fastify.io/) - Fast and low overhead web framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Next.js](https://nextjs.org/) - React framework
- [Vitest](https://vitest.dev/) - Testing framework

---

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourorg/access-review-certification-center/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourorg/access-review-certification-center/discussions)

---

**Built for enterprise access governance. Production-ready. Extensible. Open source.**
