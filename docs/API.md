# API Reference

Complete API documentation for the Access Review & Certification Center.

## Base URL

```
http://localhost:3001
```

## Authentication

Currently using simple email-based identification. In production, integrate with SSO/OAuth.

## Common Response Format

All API endpoints return responses in this format:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

---

## Campaigns

### Create Campaign

```http
POST /campaigns
```

**Request Body:**
```json
{
  "name": "Q1 2025 Access Review",
  "description": "Quarterly review",
  "periodStart": "2025-01-01T00:00:00Z",
  "periodEnd": "2025-03-31T23:59:59Z"
}
```

### List Campaigns

```http
GET /campaigns
```

### Get Campaign Summary

```http
GET /campaigns/:campaignId/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "...",
      "name": "Q1 2025 Access Review",
      "status": "ACTIVE"
    },
    "stats": {
      "total": 100,
      "pending": 45,
      "keep": 40,
      "revoke": 15
    }
  }
}
```

### Generate Review Items

```http
POST /campaigns/:campaignId/generate-items
```

---

## Reviews

### Get Review Items

```http
GET /reviews?reviewerEmail=alice@company.com&campaignId=xxx
```

**Query Parameters:**
- `reviewerEmail` (required): Email of the reviewer
- `campaignId` (optional): Filter by specific campaign

### Update Review Decision

```http
PUT /reviews/:itemId?reviewerEmail=alice@company.com
```

**Request Body:**
```json
{
  "decision": "KEEP",
  "comment": "Access still required for current role"
}
```

---

## Access Requests

### Create Access Request

```http
POST /access-requests
```

**Request Body:**
```json
{
  "systemId": "system-123",
  "requesterId": "user-456",
  "role": "Analyst",
  "justification": "Need access to analytics data for dashboard development",
  "urgency": "HIGH",
  "expiresAt": "2025-12-31T00:00:00Z"
}
```

### Get Pending Requests

```http
GET /access-requests/pending?reviewerId=alice@company.com
```

### Review Access Request

```http
POST /access-requests/:requestId/review
```

**Request Body:**
```json
{
  "reviewerId": "reviewer-123",
  "status": "APPROVED",
  "comment": "Approved for 90 days"
}
```

### Get User's Requests

```http
GET /access-requests/user/:userId
```

---

## Delegations

### Create Delegation

```http
POST /delegations
```

**Request Body:**
```json
{
  "reviewItemId": "item-123",
  "delegatorId": "user-456",
  "delegateeId": "user-789",
  "reason": "Out of office",
  "endsAt": "2025-02-01T00:00:00Z"
}
```

### Get User's Delegations

```http
GET /delegations/user/:userId
```

### Revoke Delegation

```http
POST /delegations/:delegationId/revoke
```

**Request Body:**
```json
{
  "actorId": "user-456"
}
```

---

## Templates

### Create Template

```http
POST /templates
```

**Request Body:**
```json
{
  "name": "Critical Systems Review",
  "description": "Enhanced review for critical systems",
  "questions": {
    "businessJustification": "Why is this access still required?",
    "alternateAccess": "Could this user perform duties with reduced access?"
  },
  "riskLevel": "CRITICAL",
  "requireComment": true,
  "createdBy": "admin@company.com"
}
```

### List Templates

```http
GET /templates?isActive=true&riskLevel=CRITICAL
```

### Get Template

```http
GET /templates/:templateId
```

### Update Template

```http
PUT /templates/:templateId
```

### Deactivate Template

```http
POST /templates/:templateId/deactivate
```

---

## Audit Logs

### Get Audit Logs

```http
GET /audit-logs?actor=alice@company.com&action=REVIEW_SUBMITTED&limit=100
```

**Query Parameters:**
- `actor`: Filter by user
- `action`: Filter by action type
- `targetType`: Filter by target type
- `startDate`: Start date (ISO 8601)
- `endDate`: End date (ISO 8601)
- `limit`: Max results (default: 100)

### Get Actions Summary

```http
GET /audit-logs/summary?startDate=2025-01-01&endDate=2025-01-31
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "action": "REVIEW_SUBMITTED",
      "count": 45
    },
    {
      "action": "REQUEST_APPROVED",
      "count": 12
    }
  ]
}
```

### Get User Activity

```http
GET /audit-logs/user/:userId?limit=50
```

---

## Import

### Import Access Grants

```http
POST /import/access-grants
```

**Request Body:**
```json
[
  {
    "system": {
      "name": "Salesforce CRM",
      "type": "APP",
      "description": "CRM system"
    },
    "principal": {
      "externalId": "alice@company.com",
      "name": "Alice Johnson",
      "email": "alice@company.com"
    },
    "role": "Admin",
    "grantedAt": "2024-01-15T00:00:00Z",
    "metadata": {
      "department": "Sales"
    }
  }
]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 1,
    "updated": 0,
    "errors": []
  }
}
```

---

## Health Check

### Get API Health

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-18T10:30:00.000Z"
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 403 | Not authorized |
| `CONFLICT` | 409 | Resource conflict |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

## Rate Limiting

Future implementation will include:
- 1000 requests per hour per IP
- 100 requests per minute per user
- Burst allowance of 50 requests

---

## Webhooks (Future)

Register webhooks to receive events:

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["review.submitted", "request.approved"],
  "secret": "webhook-secret"
}
```

Event payload:
```json
{
  "event": "review.submitted",
  "timestamp": "2025-01-18T10:30:00.000Z",
  "data": { ... }
}
```
