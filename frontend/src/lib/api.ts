import { ReviewItem, CampaignSummary, ReviewCampaign } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data: ApiResponse<T> = await response.json();

    if (!data.success || !response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data as T;
  }

  // Review endpoints
  async getReviewItems(reviewerEmail: string, campaignId?: string): Promise<ReviewItem[]> {
    const params = new URLSearchParams({ reviewerEmail });
    if (campaignId) params.append('campaignId', campaignId);

    return this.request<ReviewItem[]>(`/reviews?${params.toString()}`);
  }

  async updateReviewDecision(
    itemId: string,
    reviewerEmail: string,
    decision: 'KEEP' | 'REVOKE',
    comment?: string
  ): Promise<ReviewItem> {
    const params = new URLSearchParams({ reviewerEmail });

    return this.request<ReviewItem>(`/reviews/${itemId}?${params.toString()}`, {
      method: 'PUT',
      body: JSON.stringify({ decision, comment }),
    });
  }

  async getPendingCount(reviewerEmail: string): Promise<number> {
    const params = new URLSearchParams({ reviewerEmail });
    const result = await this.request<{ count: number }>(`/reviews/stats/pending?${params.toString()}`);
    return result.count;
  }

  // Campaign endpoints
  async getCampaigns(): Promise<ReviewCampaign[]> {
    return this.request<ReviewCampaign[]>('/campaigns');
  }

  async getCampaignSummary(campaignId: string): Promise<CampaignSummary> {
    return this.request<CampaignSummary>(`/campaigns/${campaignId}/summary`);
  }

  async createCampaign(name: string, periodStart: string, periodEnd: string): Promise<ReviewCampaign> {
    return this.request<ReviewCampaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify({ name, periodStart, periodEnd }),
    });
  }

  async generateReviewItems(campaignId: string): Promise<any> {
    return this.request<any>(`/campaigns/${campaignId}/generate-items`, {
      method: 'POST',
    });
  }
}

export const api = new ApiClient(API_URL);
