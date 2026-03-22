import { describe, it, expect } from "vitest";
import {
  formatCampaigns,
  formatInsights,
  formatAccountInfo,
} from "../lib/formatter.js";
import type { CampaignInfo, InsightRow, AccountInfo } from "../lib/types.js";

describe("formatCampaigns", () => {
  const campaigns: CampaignInfo[] = [
    {
      id: "123",
      name: "Test Campaign",
      objective: "OUTCOME_LEADS",
      status: "ACTIVE",
    },
  ];

  it("formats as JSON", () => {
    const result = formatCampaigns(campaigns, "json");
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("123");
  });

  it("formats as TSV", () => {
    const result = formatCampaigns(campaigns, "plain");
    expect(result).toContain("123\tTest Campaign\tOUTCOME_LEADS\tACTIVE");
  });

  it("formats as human-readable table", () => {
    const result = formatCampaigns(campaigns, "human");
    expect(result).toContain("123");
    expect(result).toContain("Test Campaign");
  });

  it("shows message when empty", () => {
    const result = formatCampaigns([], "human");
    expect(result).toBe("No campaigns found.");
  });
});

describe("formatInsights", () => {
  const insights: InsightRow[] = [
    {
      dateStart: "2026-03-01",
      dateStop: "2026-03-07",
      campaignName: "Lead Gen",
      impressions: 10000,
      clicks: 250,
      spend: 50.5,
      cpc: 0.2,
      ctr: 2.5,
      cpm: 5.05,
    },
  ];

  it("formats as JSON", () => {
    const result = formatInsights(insights, "json");
    const parsed = JSON.parse(result);
    expect(parsed[0].impressions).toBe(10000);
  });

  it("formats as human-readable", () => {
    const result = formatInsights(insights, "human");
    expect(result).toContain("Lead Gen");
    expect(result).toContain("10,000");
    expect(result).toContain("50.50");
  });

  it("shows message when empty", () => {
    const result = formatInsights([], "human");
    expect(result).toContain("No data");
  });
});

describe("formatAccountInfo", () => {
  const info: AccountInfo = {
    id: "act_123",
    name: "Test Account",
    accountStatus: 1,
    currency: "JPY",
    timezone: "Asia/Tokyo",
    amountSpent: "50000",
  };

  it("formats as JSON", () => {
    const result = formatAccountInfo(info, "json");
    const parsed = JSON.parse(result);
    expect(parsed.id).toBe("act_123");
  });

  it("formats as human-readable", () => {
    const result = formatAccountInfo(info, "human");
    expect(result).toContain("ACTIVE");
    expect(result).toContain("JPY");
    expect(result).toContain("Asia/Tokyo");
  });
});
