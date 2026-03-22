import bizSdk from "facebook-nodejs-business-sdk";
import type {
  MacConfig,
  AccountInfo,
  CampaignInfo,
  AdSetInfo,
  AdInfo,
  InsightRow,
  InsightLevel,
} from "./types.js";

const { FacebookAdsApi, AdAccount, Campaign, AdSet, Ad } = bizSdk;

export class MacClient {
  private config: MacConfig;
  private account: InstanceType<typeof AdAccount>;

  constructor(config: MacConfig) {
    this.config = config;
    FacebookAdsApi.init(config.accessToken);
    this.account = new AdAccount(config.accountId);
  }

  /** Test authentication by reading account info */
  async authTest(): Promise<{ id: string; name: string }> {
    const account = await this.account.read([
      AdAccount.Fields.id,
      AdAccount.Fields.name,
    ]);
    return {
      id: account.id as string,
      name: account.name as string,
    };
  }

  /** Get detailed account info */
  async getAccountInfo(): Promise<AccountInfo> {
    const account = await this.account.read([
      AdAccount.Fields.id,
      AdAccount.Fields.name,
      AdAccount.Fields.account_status,
      AdAccount.Fields.currency,
      AdAccount.Fields.timezone_name,
      AdAccount.Fields.amount_spent,
    ]);
    return {
      id: account.id as string,
      name: account.name as string,
      accountStatus: account.account_status as number,
      currency: account.currency as string,
      timezone: account.timezone_name as string,
      amountSpent: account.amount_spent as string,
    };
  }

  /** List campaigns */
  async listCampaigns(limit = 50): Promise<CampaignInfo[]> {
    const campaigns = await this.account.getCampaigns(
      [
        Campaign.Fields.id,
        Campaign.Fields.name,
        Campaign.Fields.objective,
        Campaign.Fields.status,
        Campaign.Fields.daily_budget,
        Campaign.Fields.lifetime_budget,
        Campaign.Fields.start_time,
        Campaign.Fields.stop_time,
      ],
      { limit },
    );
    return campaigns.map((c: Record<string, unknown>) => ({
      id: c.id as string,
      name: c.name as string,
      objective: c.objective as string,
      status: c.status as string,
      dailyBudget: c.daily_budget as string | undefined,
      lifetimeBudget: c.lifetime_budget as string | undefined,
      startTime: c.start_time as string | undefined,
      stopTime: c.stop_time as string | undefined,
    }));
  }

  /** Create a campaign */
  async createCampaign(params: {
    name: string;
    objective: string;
    status?: string;
    dailyBudget?: string;
    specialAdCategories?: string[];
  }): Promise<{ id: string }> {
    const result = await this.account.createCampaign([], {
      [Campaign.Fields.name]: params.name,
      [Campaign.Fields.objective]: params.objective,
      [Campaign.Fields.status]: params.status || "PAUSED",
      [Campaign.Fields.special_ad_categories]:
        params.specialAdCategories || [],
      ...(params.dailyBudget
        ? { [Campaign.Fields.daily_budget]: params.dailyBudget }
        : {}),
    });
    return { id: result.id };
  }

  /** Update a campaign */
  async updateCampaign(
    campaignId: string,
    params: { name?: string; status?: string },
  ): Promise<void> {
    const campaign = new Campaign(campaignId);
    const updateParams: Record<string, string> = {};
    if (params.name) updateParams[Campaign.Fields.name] = params.name;
    if (params.status) updateParams[Campaign.Fields.status] = params.status;
    await campaign.update([], updateParams);
  }

  /** List ad sets */
  async listAdSets(campaignId?: string, limit = 50): Promise<AdSetInfo[]> {
    let adsets;
    if (campaignId) {
      const campaign = new Campaign(campaignId);
      adsets = await campaign.getAdSets(
        [
          AdSet.Fields.id,
          AdSet.Fields.name,
          AdSet.Fields.campaign_id,
          AdSet.Fields.status,
          AdSet.Fields.daily_budget,
          AdSet.Fields.start_time,
          AdSet.Fields.end_time,
        ],
        { limit },
      );
    } else {
      adsets = await this.account.getAdSets(
        [
          AdSet.Fields.id,
          AdSet.Fields.name,
          AdSet.Fields.campaign_id,
          AdSet.Fields.status,
          AdSet.Fields.daily_budget,
          AdSet.Fields.start_time,
          AdSet.Fields.end_time,
        ],
        { limit },
      );
    }
    return adsets.map((a: Record<string, unknown>) => ({
      id: a.id as string,
      name: a.name as string,
      campaignId: a.campaign_id as string,
      status: a.status as string,
      dailyBudget: a.daily_budget as string | undefined,
      startTime: a.start_time as string | undefined,
      endTime: a.end_time as string | undefined,
    }));
  }

  /** List ads */
  async listAds(adsetId?: string, limit = 50): Promise<AdInfo[]> {
    let ads;
    if (adsetId) {
      const adset = new AdSet(adsetId);
      ads = await adset.getAds(
        [Ad.Fields.id, Ad.Fields.name, Ad.Fields.adset_id, Ad.Fields.status],
        { limit },
      );
    } else {
      ads = await this.account.getAds(
        [Ad.Fields.id, Ad.Fields.name, Ad.Fields.adset_id, Ad.Fields.status],
        { limit },
      );
    }
    return ads.map((a: Record<string, unknown>) => ({
      id: a.id as string,
      name: a.name as string,
      adsetId: a.adset_id as string,
      status: a.status as string,
    }));
  }

  /** Get insights/performance report */
  async getInsights(params: {
    level?: InsightLevel;
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<InsightRow[]> {
    const fields = [
      "impressions",
      "clicks",
      "spend",
      "cpc",
      "ctr",
      "cpm",
      "actions",
      "campaign_id",
      "campaign_name",
      "adset_id",
      "adset_name",
      "ad_id",
      "ad_name",
    ];

    const apiParams: Record<string, unknown> = {
      limit: params.limit || 100,
    };

    if (params.level) {
      apiParams.level = params.level;
    }

    if (params.from || params.to) {
      apiParams.time_range = {
        since: params.from || "2020-01-01",
        until: params.to || new Date().toISOString().split("T")[0],
      };
    }

    const insights = await this.account.getInsights(fields, apiParams);

    return insights.map((row: Record<string, unknown>) => ({
      dateStart: (row.date_start as string) || "",
      dateStop: (row.date_stop as string) || "",
      campaignId: row.campaign_id as string | undefined,
      campaignName: row.campaign_name as string | undefined,
      adsetId: row.adset_id as string | undefined,
      adsetName: row.adset_name as string | undefined,
      adId: row.ad_id as string | undefined,
      adName: row.ad_name as string | undefined,
      impressions: Number(row.impressions) || 0,
      clicks: Number(row.clicks) || 0,
      spend: Number(row.spend) || 0,
      cpc: Number(row.cpc) || 0,
      ctr: Number(row.ctr) || 0,
      cpm: Number(row.cpm) || 0,
      actions: row.actions as
        | Array<{ actionType: string; value: string }>
        | undefined,
    }));
  }
}
