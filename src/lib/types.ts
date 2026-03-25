export type OutputMode = "json" | "plain" | "human";

export interface MacConfig {
  accessToken: string;
  accountId: string; // act_XXXXX format
}

export interface CampaignInfo {
  id: string;
  name: string;
  objective: string;
  status: string;
  dailyBudget?: string;
  lifetimeBudget?: string;
  startTime?: string;
  stopTime?: string;
}

export interface AdSetInfo {
  id: string;
  name: string;
  campaignId: string;
  status: string;
  dailyBudget?: string;
  startTime?: string;
  endTime?: string;
}

export interface AdInfo {
  id: string;
  name: string;
  adsetId: string;
  status: string;
  creativeId?: string;
}

export interface InsightRow {
  dateStart: string;
  dateStop: string;
  campaignId?: string;
  campaignName?: string;
  adsetId?: string;
  adsetName?: string;
  adId?: string;
  adName?: string;
  impressions: number;
  clicks: number;
  spend: number;
  cpc: number;
  ctr: number;
  cpm: number;
  actions?: Array<{ actionType: string; value: string }>;
}

export interface AccountInfo {
  id: string;
  name: string;
  accountStatus: number;
  currency: string;
  timezone: string;
  amountSpent: string;
}

export type InsightLevel = "campaign" | "adset" | "ad";

// --- Pages ---

export interface PagePostResult {
  id: string;
}

export interface PagePhotoPostResult {
  id: string;
  postId: string;
}

export interface PagePost {
  id: string;
  message: string;
  createdTime: string;
  type: string;
}

export interface PageInsight {
  name: string;
  period: string;
  title: string;
  values: Array<{ value: number; endTime: string }>;
}

export interface CreatePagePostArgs {
  message: string;
  link?: string;
  imagePath?: string;
}

export interface ListPagePostsOptions {
  limit?: number;
}

export interface PageInsightsOptions {
  since: string;
  until: string;
  metrics?: string[];
}

export interface PageAuthResult {
  pageId: string;
  pageName: string;
  category: string;
}
