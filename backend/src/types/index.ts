import { ResourceType, CampaignStatus, ReviewDecision } from '@prisma/client';

export interface ImportAccessGrantRequest {
  system: {
    name: string;
    type?: ResourceType;
    description?: string;
  };
  principal: {
    externalId: string;
    name: string;
    email: string;
  };
  role: string;
  grantedAt?: string;
  metadata?: Record<string, any>;
}

export interface CreateCampaignRequest {
  name: string;
  periodStart: string;
  periodEnd: string;
}

export interface UpdateReviewItemRequest {
  decision: ReviewDecision;
  comment?: string;
}

export interface CampaignSummary {
  campaign: {
    id: string;
    name: string;
    status: CampaignStatus;
    periodStart: Date;
    periodEnd: Date;
  };
  stats: {
    total: number;
    pending: number;
    keep: number;
    revoke: number;
  };
}
