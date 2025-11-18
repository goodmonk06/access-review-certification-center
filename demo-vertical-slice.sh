#!/bin/bash

# Vertical Slice Demo for Access Review Certification Center
# This script demonstrates the complete flow from import to review

set -e

API_URL="${API_URL:-http://localhost:3001}"
echo "🚀 Access Review Certification Center - Vertical Slice Demo"
echo "API URL: $API_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Wait for API to be ready
echo -e "${BLUE}⏳ Waiting for API to be ready...${NC}"
until curl -s "$API_URL/health" > /dev/null 2>&1; do
  echo "Waiting for API..."
  sleep 2
done
echo -e "${GREEN}✓ API is ready${NC}\n"

# Step 1: Import Access Grants
echo -e "${BLUE}Step 1: Importing access grants...${NC}"
IMPORT_RESPONSE=$(curl -s -X POST "$API_URL/import/access-grants" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "system": {
        "name": "GitHub Enterprise",
        "type": "APP",
        "description": "Source code repository"
      },
      "principal": {
        "externalId": "alice@company.com",
        "name": "Alice Johnson",
        "email": "alice@company.com"
      },
      "role": "Admin",
      "grantedAt": "2024-01-15T00:00:00Z",
      "metadata": {
        "organization": "company",
        "teams": ["platform", "engineering"]
      }
    },
    {
      "system": {
        "name": "GitHub Enterprise",
        "type": "APP"
      },
      "principal": {
        "externalId": "bob@company.com",
        "name": "Bob Smith",
        "email": "bob@company.com"
      },
      "role": "Developer",
      "grantedAt": "2024-02-01T00:00:00Z"
    }
  ]')

echo "$IMPORT_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Access grants imported${NC}\n"

# Step 2: Create Campaign
echo -e "${BLUE}Step 2: Creating review campaign...${NC}"
CAMPAIGN_RESPONSE=$(curl -s -X POST "$API_URL/campaigns" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 2025 Quarterly Access Review",
    "periodStart": "2025-01-01T00:00:00Z",
    "periodEnd": "2025-03-31T23:59:59Z"
  }')

echo "$CAMPAIGN_RESPONSE" | jq '.'
CAMPAIGN_ID=$(echo "$CAMPAIGN_RESPONSE" | jq -r '.data.id')
echo -e "${GREEN}✓ Campaign created with ID: $CAMPAIGN_ID${NC}\n"

# Step 3: Generate Review Items
echo -e "${BLUE}Step 3: Generating review items for campaign...${NC}"
GENERATE_RESPONSE=$(curl -s -X POST "$API_URL/campaigns/$CAMPAIGN_ID/generate-items")

echo "$GENERATE_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Review items generated${NC}\n"

# Step 4: List Pending Reviews
echo -e "${BLUE}Step 4: Listing pending reviews for alice@company.com...${NC}"
REVIEWS_RESPONSE=$(curl -s "$API_URL/reviews?reviewerEmail=alice@company.com")

echo "$REVIEWS_RESPONSE" | jq '.'
FIRST_ITEM_ID=$(echo "$REVIEWS_RESPONSE" | jq -r '.data[0].id')
echo -e "${GREEN}✓ Found review items${NC}\n"

# Step 5: Approve an Access Grant
if [ -n "$FIRST_ITEM_ID" ] && [ "$FIRST_ITEM_ID" != "null" ]; then
  echo -e "${BLUE}Step 5: Approving first review item...${NC}"
  APPROVE_RESPONSE=$(curl -s -X PUT "$API_URL/reviews/$FIRST_ITEM_ID?reviewerEmail=alice@company.com" \
    -H "Content-Type: application/json" \
    -d '{
      "decision": "KEEP",
      "comment": "Access still required for current role"
    }')

  echo "$APPROVE_RESPONSE" | jq '.'
  echo -e "${GREEN}✓ Review item approved${NC}\n"
else
  echo -e "${YELLOW}⚠ No review items found for approval${NC}\n"
fi

# Step 6: Get Campaign Summary
echo -e "${BLUE}Step 6: Getting campaign summary...${NC}"
SUMMARY_RESPONSE=$(curl -s "$API_URL/campaigns/$CAMPAIGN_ID/summary")

echo "$SUMMARY_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Campaign summary retrieved${NC}\n"

echo -e "${GREEN}🎉 Vertical Slice Demo Complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Open the UI: http://localhost:3000"
echo "  2. Login with: alice@company.com, bob@company.com, or carol@company.com"
echo "  3. Review and approve/revoke access grants"
echo "  4. View campaign summary at: $API_URL/campaigns/$CAMPAIGN_ID/summary"
echo ""
