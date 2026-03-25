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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sdk = bizSdk as any;

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
    bidStrategy?: string;
    specialAdCategories?: string[];
  }): Promise<{ id: string }> {
    const fields: Record<string, unknown> = {
      [Campaign.Fields.name]: params.name,
      [Campaign.Fields.objective]: params.objective,
      [Campaign.Fields.status]: params.status || "PAUSED",
      [Campaign.Fields.special_ad_categories]:
        params.specialAdCategories || [],
    };
    if (params.dailyBudget) {
      fields[Campaign.Fields.daily_budget] = params.dailyBudget;
    }
    if (params.bidStrategy) {
      fields[Campaign.Fields.bid_strategy] = params.bidStrategy;
    }
    const result = await this.account.createCampaign([], fields);
    return { id: result.id };
  }

  /** Update a campaign */
  async updateCampaign(
    campaignId: string,
    params: { name?: string; status?: string; bidStrategy?: string },
  ): Promise<void> {
    const campaign = new Campaign(campaignId);
    const updateParams: Record<string, string> = {};
    if (params.name) updateParams[Campaign.Fields.name] = params.name;
    if (params.status) updateParams[Campaign.Fields.status] = params.status;
    if (params.bidStrategy)
      updateParams[Campaign.Fields.bid_strategy] = params.bidStrategy;
    await campaign.update([], updateParams);
  }

  /** Delete a campaign */
  async deleteCampaign(campaignId: string): Promise<void> {
    const campaign = new Campaign(campaignId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (campaign as any).delete([]);
  }

  /** Search targeting options (interests, regions, locales) */
  async searchTargeting(params: {
    type: string;
    query: string;
    countryCode?: string;
    locationTypes?: string[];
    limit?: number;
  }): Promise<Array<Record<string, unknown>>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = (FacebookAdsApi as any).getDefaultApi();
    const apiParams: Record<string, unknown> = {
      type: params.type,
      q: params.query,
      limit: params.limit || 20,
    };
    if (params.countryCode) {
      apiParams.country_code = params.countryCode;
    }
    if (params.locationTypes) {
      apiParams.location_types = JSON.stringify(params.locationTypes);
    }
    const response = await api.call(
      "GET",
      ["search"],
      apiParams,
    );
    return (response?.data || []) as Array<Record<string, unknown>>;
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

  /** Create an ad set */
  async createAdSet(params: {
    campaignId: string;
    name: string;
    optimizationGoal: string;
    billingEvent: string;
    dailyBudget?: string;
    lifetimeBudget?: string;
    bidStrategy?: string;
    bidAmount?: string;
    targeting: Record<string, unknown>;
    status?: string;
    startTime?: string;
    endTime?: string;
    promotedObject?: Record<string, unknown>;
    destinationType?: string;
  }): Promise<{ id: string }> {
    const fields: Record<string, unknown> = {
      [AdSet.Fields.name]: params.name,
      [AdSet.Fields.campaign_id]: params.campaignId,
      [AdSet.Fields.optimization_goal]: params.optimizationGoal,
      [AdSet.Fields.billing_event]: params.billingEvent,
      [AdSet.Fields.targeting]: params.targeting,
      [AdSet.Fields.status]: params.status || "PAUSED",
    };
    if (params.dailyBudget) {
      fields[AdSet.Fields.daily_budget] = params.dailyBudget;
    }
    if (params.lifetimeBudget) {
      fields[AdSet.Fields.lifetime_budget] = params.lifetimeBudget;
    }
    if (params.bidStrategy) {
      fields[AdSet.Fields.bid_strategy] = params.bidStrategy;
    }
    if (params.bidAmount) {
      fields[AdSet.Fields.bid_amount] = params.bidAmount;
    }
    if (params.startTime) {
      fields[AdSet.Fields.start_time] = params.startTime;
    }
    if (params.endTime) {
      fields[AdSet.Fields.end_time] = params.endTime;
    }
    if (params.promotedObject) {
      fields[AdSet.Fields.promoted_object] = params.promotedObject;
    }
    if (params.destinationType) {
      fields[AdSet.Fields.destination_type] = params.destinationType;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const acct = this.account as any;
    const result = await acct.createAdSet([], fields);
    return { id: result.id };
  }

  /** Create an ad */
  async createAd(params: {
    adsetId: string;
    name: string;
    creative: Record<string, unknown>;
    status?: string;
    trackingSpecs?: Record<string, unknown>[];
  }): Promise<{ id: string }> {
    const fields: Record<string, unknown> = {
      [Ad.Fields.name]: params.name,
      [Ad.Fields.adset_id]: params.adsetId,
      [Ad.Fields.creative]: params.creative,
      [Ad.Fields.status]: params.status || "PAUSED",
    };
    if (params.trackingSpecs) {
      fields[Ad.Fields.tracking_specs] = params.trackingSpecs;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const acct = this.account as any;
    const result = await acct.createAd([], fields);
    return { id: result.id };
  }

  /** Upload an ad image and return the image hash */
  async uploadImage(
    filePath: string,
  ): Promise<{ hash: string; url: string; name: string }> {
    const fs = await import("fs");
    const path = await import("path");
    const bytes = fs.readFileSync(filePath);
    const base64 = bytes.toString("base64");
    const fileName = path.basename(filePath);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const acct = this.account as any;
    const result = await acct.createAdImage([], {
      bytes: base64,
      name: fileName,
    });
    const images = result._data?.images || result.images;
    const imageData = images?.[fileName] || Object.values(images || {})[0];
    return {
      hash: imageData?.hash || "",
      url: imageData?.url || "",
      name: fileName,
    };
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
