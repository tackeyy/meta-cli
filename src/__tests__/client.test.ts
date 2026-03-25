import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the facebook-nodejs-business-sdk module
vi.mock("facebook-nodejs-business-sdk", () => {
  const mockRead = vi.fn();
  const mockGetCampaigns = vi.fn();
  const mockGetAdSets = vi.fn();
  const mockGetAds = vi.fn();
  const mockGetInsights = vi.fn();
  const mockCreateCampaign = vi.fn();

  return {
    default: {
      FacebookAdsApi: {
        init: vi.fn(),
      },
      AdAccount: Object.assign(
        vi.fn().mockImplementation(() => ({
          read: mockRead,
          getCampaigns: mockGetCampaigns,
          getAdSets: mockGetAdSets,
          getAds: mockGetAds,
          getInsights: mockGetInsights,
          createCampaign: mockCreateCampaign,
        })),
        {
          Fields: {
            id: "id",
            name: "name",
            account_status: "account_status",
            currency: "currency",
            timezone_name: "timezone_name",
            amount_spent: "amount_spent",
          },
        },
      ),
      Campaign: Object.assign(vi.fn(), {
        Fields: {
          id: "id",
          name: "name",
          objective: "objective",
          status: "status",
          daily_budget: "daily_budget",
          lifetime_budget: "lifetime_budget",
          start_time: "start_time",
          stop_time: "stop_time",
          special_ad_categories: "special_ad_categories",
          bid_strategy: "bid_strategy",
        },
      }),
      AdSet: Object.assign(vi.fn(), {
        Fields: {
          id: "id",
          name: "name",
          campaign_id: "campaign_id",
          status: "status",
          daily_budget: "daily_budget",
          start_time: "start_time",
          end_time: "end_time",
          optimization_goal: "optimization_goal",
          billing_event: "billing_event",
          targeting: "targeting",
          lifetime_budget: "lifetime_budget",
          bid_strategy: "bid_strategy",
          bid_amount: "bid_amount",
          promoted_object: "promoted_object",
          destination_type: "destination_type",
        },
      }),
      Ad: Object.assign(vi.fn(), {
        Fields: {
          id: "id",
          name: "name",
          adset_id: "adset_id",
          status: "status",
          creative: "creative",
          tracking_specs: "tracking_specs",
        },
      }),
    },
  };
});

import { MacClient } from "../lib/client.js";
import type { MacConfig } from "../lib/types.js";
import bizSdk from "facebook-nodejs-business-sdk";

describe("MacClient", () => {
  let client: MacClient;
  let mockAccount: ReturnType<typeof bizSdk.AdAccount>;
  const config: MacConfig = {
    accessToken: "test-token",
    accountId: "act_123456",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    client = new MacClient(config);
    // Get the mock account instance created during construction
    mockAccount = (bizSdk.AdAccount as unknown as ReturnType<typeof vi.fn>).mock
      .results[0].value;
  });

  describe("authTest", () => {
    it("should return account id and name on success", async () => {
      mockAccount.read.mockResolvedValueOnce({
        id: "act_123456",
        name: "Test Account",
      });

      const result = await client.authTest();
      expect(result).toEqual({ id: "act_123456", name: "Test Account" });
    });

    it("should propagate errors from the SDK", async () => {
      mockAccount.read.mockRejectedValueOnce(new Error("Invalid token"));

      await expect(client.authTest()).rejects.toThrow("Invalid token");
    });
  });

  describe("getAccountInfo", () => {
    it("should return full account info", async () => {
      mockAccount.read.mockResolvedValueOnce({
        id: "act_123456",
        name: "Test Account",
        account_status: 1,
        currency: "JPY",
        timezone_name: "Asia/Tokyo",
        amount_spent: "50000",
      });

      const result = await client.getAccountInfo();
      expect(result).toEqual({
        id: "act_123456",
        name: "Test Account",
        accountStatus: 1,
        currency: "JPY",
        timezone: "Asia/Tokyo",
        amountSpent: "50000",
      });
    });
  });

  describe("listCampaigns", () => {
    it("should return mapped campaign list", async () => {
      mockAccount.getCampaigns.mockResolvedValueOnce([
        {
          id: "camp_1",
          name: "Campaign A",
          objective: "OUTCOME_LEADS",
          status: "ACTIVE",
          daily_budget: "10000",
        },
      ]);

      const result = await client.listCampaigns(10);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "camp_1",
        name: "Campaign A",
        objective: "OUTCOME_LEADS",
        status: "ACTIVE",
        dailyBudget: "10000",
        lifetimeBudget: undefined,
        startTime: undefined,
        stopTime: undefined,
      });
      expect(mockAccount.getCampaigns).toHaveBeenCalledWith(
        expect.any(Array),
        { limit: 10 },
      );
    });

    it("should use default limit of 50", async () => {
      mockAccount.getCampaigns.mockResolvedValueOnce([]);

      await client.listCampaigns();
      expect(mockAccount.getCampaigns).toHaveBeenCalledWith(
        expect.any(Array),
        { limit: 50 },
      );
    });
  });

  describe("createCampaign", () => {
    it("should create a campaign with required fields", async () => {
      mockAccount.createCampaign.mockResolvedValueOnce({ id: "camp_new" });

      const result = await client.createCampaign({
        name: "New Campaign",
        objective: "OUTCOME_LEADS",
      });
      expect(result).toEqual({ id: "camp_new" });
    });

    it("should default status to PAUSED", async () => {
      mockAccount.createCampaign.mockResolvedValueOnce({ id: "camp_new" });

      await client.createCampaign({
        name: "New Campaign",
        objective: "OUTCOME_LEADS",
      });

      const callArgs = mockAccount.createCampaign.mock.calls[0][1];
      expect(callArgs.status).toBe("PAUSED");
    });
  });

  describe("getInsights", () => {
    it("should return mapped insight data", async () => {
      mockAccount.getInsights.mockResolvedValueOnce([
        {
          date_start: "2026-03-01",
          date_stop: "2026-03-07",
          campaign_name: "Campaign A",
          impressions: "5000",
          clicks: "100",
          spend: "25.50",
          cpc: "0.25",
          ctr: "2.0",
          cpm: "5.10",
        },
      ]);

      const result = await client.getInsights({
        level: "campaign",
        from: "2026-03-01",
        to: "2026-03-07",
      });

      expect(result).toHaveLength(1);
      expect(result[0].campaignName).toBe("Campaign A");
      expect(result[0].impressions).toBe(5000);
      expect(result[0].clicks).toBe(100);
      expect(result[0].spend).toBe(25.5);
    });
  });
});
