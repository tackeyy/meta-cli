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
    params: { name?: string; status?: string; dailyBudget?: string; bidStrategy?: string },
  ): Promise<void> {
    const campaign = new Campaign(campaignId);
    const updateParams: Record<string, string> = {};
    if (params.name) updateParams[Campaign.Fields.name] = params.name;
    if (params.status) updateParams[Campaign.Fields.status] = params.status;
    if (params.dailyBudget) updateParams[Campaign.Fields.daily_budget] = params.dailyBudget;
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

  /** Delete an ad set */
  async deleteAdSet(adsetId: string): Promise<void> {
    const adset = new AdSet(adsetId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adset as any).delete([]);
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

  /** Update an ad set */
  async updateAdSet(
    adsetId: string,
    params: { name?: string; status?: string; dailyBudget?: string },
  ): Promise<void> {
    const adset = new AdSet(adsetId);
    const updateParams: Record<string, string> = {};
    if (params.name) updateParams[AdSet.Fields.name] = params.name;
    if (params.status) updateParams[AdSet.Fields.status] = params.status;
    if (params.dailyBudget) updateParams[AdSet.Fields.daily_budget] = params.dailyBudget;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adset as any).update([], updateParams);
  }

  /** Update an ad */
  async updateAd(
    adId: string,
    params: { name?: string; status?: string; creative?: Record<string, unknown> },
  ): Promise<void> {
    const ad = new Ad(adId);
    const updateParams: Record<string, unknown> = {};
    if (params.name) updateParams[Ad.Fields.name] = params.name;
    if (params.status) updateParams[Ad.Fields.status] = params.status;
    if (params.creative) updateParams[Ad.Fields.creative] = params.creative;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (ad as any).update([], updateParams);
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

  /** Get creative details for an ad (returns object_story_spec and creative ID) */
  async getAdCreativeDetails(adId: string): Promise<{
    creativeId: string;
    objectStorySpec: Record<string, unknown>;
    title?: string;
    body?: string;
  }> {
    const ad = new Ad(adId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adData = await (ad as any).read(["creative"]);
    const creativeId = (adData.creative as Record<string, unknown>)?.id as string;
    if (!creativeId) throw new Error(`No creative found for ad ${adId}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AdCreative = sdk.AdCreative as any;
    const creative = new AdCreative(creativeId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const creativeData = await (creative as any).read([
      "object_story_spec",
      "title",
      "body",
      "name",
    ]);

    return {
      creativeId,
      objectStorySpec: creativeData.object_story_spec as Record<string, unknown>,
      title: creativeData.title as string | undefined,
      body: creativeData.body as string | undefined,
    };
  }

  /** Create a new AdCreative */
  async createAdCreative(params: {
    objectStorySpec: Record<string, unknown>;
    title?: string;
    body?: string;
  }): Promise<{ id: string }> {
    const fields: Record<string, unknown> = {
      object_story_spec: params.objectStorySpec,
    };
    if (params.title) fields.title = params.title;
    if (params.body) fields.body = params.body;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const acct = this.account as any;
    const result = await acct.createAdCreative([], fields);
    return { id: result.id };
  }

  /** Update the destination URL of an ad by creating a new creative with the new URL */
  async updateAdUrl(adId: string, newUrl: string): Promise<{ newCreativeId: string }> {
    // 1. Get current creative spec
    const details = await this.getAdCreativeDetails(adId);
    if (!details.objectStorySpec) throw new Error("Could not retrieve object_story_spec from creative");

    // 2. Deep-clone and update the URL
    const spec = JSON.parse(JSON.stringify(details.objectStorySpec)) as Record<string, unknown>;
    const linkData = spec.link_data as Record<string, unknown> | undefined;
    if (linkData) {
      linkData.link = newUrl;
    } else {
      // Video ads or other formats — attempt to update call_to_action link
      const videoData = spec.video_data as Record<string, unknown> | undefined;
      const cta = videoData?.call_to_action as Record<string, unknown> | undefined;
      const ctaValue = cta?.value as Record<string, unknown> | undefined;
      if (ctaValue) {
        ctaValue.link = newUrl;
      } else {
        throw new Error("Could not find link URL in creative spec to update. Unsupported creative format.");
      }
    }

    // 3. Create new creative with updated URL
    const newCreative = await this.createAdCreative({
      objectStorySpec: spec,
      title: details.title,
      body: details.body,
    });

    // 4. Update ad to use new creative
    await this.updateAd(adId, { creative: { creative_id: newCreative.id } });

    return { newCreativeId: newCreative.id };
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
    breakdown?: string;
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

    const breakdownKeys = (params.breakdown || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (breakdownKeys.length > 0) {
      apiParams.breakdowns = breakdownKeys.join(",");
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
      breakdowns:
        breakdownKeys.length > 0
          ? Object.fromEntries(
              breakdownKeys
                .map((key) => [key, row[key]])
                .filter((entry): entry is [string, string] =>
                  typeof entry[1] === "string",
                ),
            )
          : undefined,
      actions: row.actions as
        | Array<{ actionType: string; value: string }>
        | undefined,
    }));
  }

  /** Get account recommendations and optimization score */
  async getRecommendations(): Promise<{
    recommendations: Array<Record<string, unknown>>;
  }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = (FacebookAdsApi as any).getDefaultApi();
    const response = await api.call(
      "GET",
      [this.config.accountId, "recommendations"],
      {
        fields: [
          "score",
          "title",
          "message",
          "importance",
          "recommended_actions",
          "type",
        ].join(","),
        limit: 100,
      },
    );
    return {
      recommendations: (response?.data || []) as Array<Record<string, unknown>>,
    };
  }
}
