declare module "facebook-nodejs-business-sdk" {
  class FacebookAdsApi {
    static init(accessToken: string): FacebookAdsApi;
  }

  class AdAccount {
    constructor(id: string);
    static Fields: Record<string, string>;
    read(fields: string[]): Promise<Record<string, unknown>>;
    getCampaigns(
      fields: string[],
      params?: Record<string, unknown>,
    ): Promise<Record<string, unknown>[]>;
    getAdSets(
      fields: string[],
      params?: Record<string, unknown>,
    ): Promise<Record<string, unknown>[]>;
    getAds(
      fields: string[],
      params?: Record<string, unknown>,
    ): Promise<Record<string, unknown>[]>;
    getInsights(
      fields: string[],
      params?: Record<string, unknown>,
    ): Promise<Record<string, unknown>[]>;
    createCampaign(
      fields: string[],
      params: Record<string, unknown>,
    ): Promise<{ id: string }>;
  }

  class Campaign {
    constructor(id: string);
    static Fields: Record<string, string>;
    update(
      fields: string[],
      params: Record<string, unknown>,
    ): Promise<unknown>;
    getAdSets(
      fields: string[],
      params?: Record<string, unknown>,
    ): Promise<Record<string, unknown>[]>;
  }

  class AdSet {
    constructor(id: string);
    static Fields: Record<string, string>;
    getAds(
      fields: string[],
      params?: Record<string, unknown>,
    ): Promise<Record<string, unknown>[]>;
  }

  class Ad {
    constructor(id: string);
    static Fields: Record<string, string>;
  }

  const _default: {
    FacebookAdsApi: typeof FacebookAdsApi;
    AdAccount: typeof AdAccount;
    Campaign: typeof Campaign;
    AdSet: typeof AdSet;
    Ad: typeof Ad;
  };
  export default _default;
}
