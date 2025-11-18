export interface SystemResource {
  id: string;
  name: string;
  type: 'APP' | 'DB' | 'OTHER';
  description?: string;
}

export interface Principal {
  id: string;
  externalId: string;
  name: string;
  email: string;
}

export interface AccessGrant {
  id: string;
  systemId: string;
  principalId: string;
  role: string;
  grantedAt: string;
  metaJson?: any;
  system?: SystemResource;
  principal?: Principal;
}

export interface ReviewCampaign {
  id: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
}

export interface ReviewItem {
  id: string;
  campaignId: string;
  accessGrantId: string;
  reviewerEmail: string;
  decision: 'PENDING' | 'KEEP' | 'REVOKE';
  decidedAt?: string;
  comment?: string;
  campaign: ReviewCampaign;
  accessGrant: AccessGrant;
}

export interface CampaignSummary {
  campaign: ReviewCampaign;
  stats: {
    total: number;
    pending: number;
    keep: number;
    revoke: number;
  };
}
