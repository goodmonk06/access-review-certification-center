# Access Review & Certification Center

A comprehensive access review and certification system for periodic audits of user permissions and roles across multiple systems.

## Overview

This system enables organizations to:
- Import access grants from external systems (apps, databases, cloud resources)
- Create periodic review campaigns
- Distribute review tasks to managers/reviewers
- Track approval and revocation decisions
- Maintain an audit trail of access certifications

## Architecture

### Tech Stack

- **Backend**: Node.js, Fastify, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Email**: Stub integration (console logging, ready for production email service)
- **Deployment**: Docker Compose

### Domain Model

```
SystemResource (apps, databases, cloud resources)
  ├── id, name, type, description

Principal (users who have access)
  ├── id, externalId, name, email

AccessGrant (who has what access)
  ├── id, systemId, principalId, role, grantedAt, metaJson

ReviewCampaign (periodic review cycles)
  ├── id, name, periodStart, periodEnd, status

ReviewItem (individual review tasks)
  ├── id, campaignId, accessGrantId, reviewerEmail
  ├── decision (PENDING, KEEP, REVOKE), decidedAt, comment
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL 15+ (or use Docker)

### Option 1: Docker Compose (Recommended)

1. **Clone and setup**
   ```bash
   cd access-review-certification-center
   cp .env.example .env
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Run migrations and seed data**
   ```bash
   docker exec access-review-backend npx prisma migrate deploy
   docker exec access-review-backend npm run db:seed
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Health: http://localhost:3001/health

### Option 2: Local Development

1. **Start PostgreSQL**
   ```bash
   docker-compose up -d postgres
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   npx prisma migrate dev
   npx prisma generate
   npm run db:seed
   npm run dev
   ```

3. **Setup Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## API Endpoints

### Import API

```bash
POST /import/access-grants
```

Import access grants from external systems. Supports batch upsert of principals and grants.

**Request Body:**
```json
[
  {
    "system": {
      "name": "Salesforce CRM",
      "type": "APP",
      "description": "Customer relationship management"
    },
    "principal": {
      "externalId": "alice@company.com",
      "name": "Alice Johnson",
      "email": "alice@company.com"
    },
    "role": "Sales Manager",
    "grantedAt": "2024-01-15T00:00:00Z",
    "metadata": {
      "department": "Sales",
      "team": "Enterprise"
    }
  }
]
```

### Campaign API

```bash
# Create campaign
POST /campaigns
{
  "name": "Q1 2025 Access Review",
  "periodStart": "2025-01-01T00:00:00Z",
  "periodEnd": "2025-03-31T23:59:59Z"
}

# List campaigns
GET /campaigns

# Generate review items for campaign
POST /campaigns/{campaignId}/generate-items

# Get campaign summary
GET /campaigns/{campaignId}/summary
```

### Review API

```bash
# Get review items for a reviewer
GET /reviews?reviewerEmail=alice@company.com

# Get specific review item
GET /reviews/{itemId}

# Update review decision
PUT /reviews/{itemId}?reviewerEmail=alice@company.com
{
  "decision": "KEEP",  // or "REVOKE"
  "comment": "Access still required for current role"
}

# Get pending count
GET /reviews/stats/pending?reviewerEmail=alice@company.com
```

## Vertical Slice Demo

Run the complete demo workflow:

```bash
chmod +x demo-vertical-slice.sh
./demo-vertical-slice.sh
```

This script demonstrates:
1. Importing access grants
2. Creating a review campaign
3. Generating review items
4. Listing pending reviews
5. Making approval decisions
6. Viewing campaign summary

## Database Management

### Migrations

```bash
cd backend

# Create a new migration
npx prisma migrate dev --name description_of_change

# Apply migrations in production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Prisma Studio

Explore the database with a GUI:

```bash
cd backend
npx prisma studio
```

Opens at http://localhost:5555

## Frontend Usage

### Login

1. Navigate to http://localhost:3000
2. Enter your reviewer email or use quick login buttons
3. Demo users: alice@company.com, bob@company.com, carol@company.com

### Review Dashboard

- View all assigned review items
- Filter by status (All, Pending, Decided)
- See statistics (Total, Pending, Approved, Revoked)

### Review Actions

For each access grant:
- **Approve**: Keep the access grant active
- **Revoke**: Remove the access grant
- **Add Comment**: Provide justification for your decision

## Email Notifications

Currently configured as a stub that logs to console. To enable real emails:

1. Set `EMAIL_ENABLED=true` in `.env`
2. Configure your email service in `backend/src/services/email.service.ts`
3. Supported services: SendGrid, AWS SES, SMTP, etc.

Email notifications are sent when:
- Review items are generated for a campaign
- Reviewers are assigned new items

## Future Integration with IdP

The system is designed to integrate with identity providers like `universal-auth-idp`:

### Recommended Integration Points

1. **Principal Import**
   - Sync users from IdP to `Principal` table
   - Use IdP's unique user ID as `externalId`
   - Keep name and email synchronized

2. **Access Grant Import**
   - Query IdP for current role/permission assignments
   - Use import API to bulk sync access grants
   - Schedule regular sync jobs

3. **Reviewer Assignment**
   - Query IdP for organizational hierarchy
   - Assign review items to managers based on reporting structure
   - Currently uses placeholder logic (principal's email)

4. **Authentication**
   - Replace simple email login with IdP SSO/OAuth
   - Use IdP session for reviewer identity
   - Implement RBAC for campaign management

### Sample Integration Script

```typescript
// Example: Sync from IdP
async function syncFromIdP() {
  const users = await idp.getUsers();
  const roles = await idp.getRoleAssignments();

  const grants = roles.map(role => ({
    system: {
      name: role.application,
      type: 'APP'
    },
    principal: {
      externalId: role.userId,
      name: users[role.userId].name,
      email: users[role.userId].email
    },
    role: role.roleName,
    grantedAt: role.assignedAt
  }));

  await fetch('http://localhost:3001/import/access-grants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(grants)
  });
}
```

## Project Structure

```
access-review-certification-center/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── routes/                # API endpoints
│   │   │   ├── import.routes.ts
│   │   │   ├── campaign.routes.ts
│   │   │   └── review.routes.ts
│   │   ├── services/              # Business logic
│   │   │   ├── import.service.ts
│   │   │   ├── campaign.service.ts
│   │   │   ├── review.service.ts
│   │   │   └── email.service.ts
│   │   ├── types/                 # TypeScript types
│   │   ├── db.ts                  # Prisma client
│   │   ├── index.ts               # Server entry
│   │   └── seed.ts                # Database seeding
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Login page
│   │   │   ├── review/
│   │   │   │   └── page.tsx       # Review dashboard
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   └── ReviewItemCard.tsx # Review item component
│   │   └── lib/
│   │       ├── api.ts             # API client
│   │       └── types.ts           # TypeScript types
│   └── package.json
├── docker-compose.yml
├── demo-vertical-slice.sh
└── README.md
```

## Development Workflow

### Adding New Features

1. **Update Prisma Schema** (if needed)
   ```bash
   cd backend
   # Edit prisma/schema.prisma
   npx prisma migrate dev --name feature_name
   ```

2. **Add Backend Logic**
   - Create/update services in `backend/src/services/`
   - Create/update routes in `backend/src/routes/`
   - Register routes in `backend/src/index.ts`

3. **Add Frontend UI**
   - Update API client in `frontend/src/lib/api.ts`
   - Create/update components in `frontend/src/components/`
   - Create/update pages in `frontend/src/app/`

4. **Test**
   - Use Prisma Studio to verify database changes
   - Test API endpoints with curl or Postman
   - Test UI in browser

### Running Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Reset database connection
docker-compose restart postgres
```

### Migration Issues

```bash
# Check migration status
cd backend
npx prisma migrate status

# Reset and reapply all migrations
npx prisma migrate reset
```

### Port Conflicts

If ports 3000, 3001, or 5432 are in use:

1. Edit `docker-compose.yml` and `.env` files
2. Change port mappings
3. Update `NEXT_PUBLIC_API_URL` in frontend

## Production Deployment

### Environment Variables

Required for production:

```bash
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/dbname
NODE_ENV=production
PORT=3001
EMAIL_ENABLED=true
EMAIL_FROM=noreply@yourdomain.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Security Considerations

1. **Authentication**: Implement proper IdP/SSO integration
2. **Authorization**: Add RBAC for campaign management
3. **HTTPS**: Use TLS for all connections
4. **Secrets**: Use secret management (AWS Secrets Manager, etc.)
5. **Database**: Enable SSL connections, use strong passwords
6. **Rate Limiting**: Add rate limiting to API endpoints
7. **Audit Logging**: Log all review decisions and changes

### Deployment Options

- **Docker**: Use provided docker-compose.yml
- **Kubernetes**: Create deployment manifests
- **Serverless**: Deploy API as Lambda/Cloud Functions
- **Platform**: Deploy to Vercel (frontend) + Railway/Render (backend)

## Contributing

1. Create feature branch from main
2. Make changes with clear commit messages
3. Test thoroughly
4. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Documentation: This README
- API Documentation: See API Endpoints section above

---

**Built with**: Node.js • TypeScript • Fastify • Prisma • PostgreSQL • Next.js • Tailwind CSS
