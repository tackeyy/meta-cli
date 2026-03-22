import type {
  OutputMode,
  AccountInfo,
  CampaignInfo,
  AdSetInfo,
  AdInfo,
  InsightRow,
} from "./types.js";

export function formatAccountInfo(
  info: AccountInfo,
  mode: OutputMode,
): string {
  if (mode === "json") return JSON.stringify(info, null, 2);
  if (mode === "plain") {
    return `${info.id}\t${info.name}\t${info.accountStatus}\t${info.currency}\t${info.timezone}`;
  }
  const statusMap: Record<number, string> = {
    1: "ACTIVE",
    2: "DISABLED",
    3: "UNSETTLED",
    7: "PENDING_RISK_REVIEW",
    8: "PENDING_SETTLEMENT",
    9: "IN_GRACE_PERIOD",
    100: "PENDING_CLOSURE",
    101: "CLOSED",
    201: "ANY_ACTIVE",
    202: "ANY_CLOSED",
  };
  return [
    `Account ID: ${info.id}`,
    `Name: ${info.name}`,
    `Status: ${statusMap[info.accountStatus] || info.accountStatus}`,
    `Currency: ${info.currency}`,
    `Timezone: ${info.timezone}`,
    `Amount Spent: ${info.amountSpent}`,
  ].join("\n");
}

export function formatCampaigns(
  campaigns: CampaignInfo[],
  mode: OutputMode,
): string {
  if (mode === "json") return JSON.stringify(campaigns, null, 2);
  if (campaigns.length === 0) return "No campaigns found.";

  if (mode === "plain") {
    return campaigns
      .map((c) => `${c.id}\t${c.name}\t${c.objective}\t${c.status}`)
      .join("\n");
  }

  const header = `${"ID".padEnd(20)} ${"Name".padEnd(30)} ${"Objective".padEnd(20)} Status`;
  const separator = "-".repeat(80);
  const rows = campaigns.map(
    (c) =>
      `${c.id.padEnd(20)} ${c.name.padEnd(30).slice(0, 30)} ${c.objective.padEnd(20)} ${c.status}`,
  );
  return [header, separator, ...rows].join("\n");
}

export function formatAdSets(adsets: AdSetInfo[], mode: OutputMode): string {
  if (mode === "json") return JSON.stringify(adsets, null, 2);
  if (adsets.length === 0) return "No ad sets found.";

  if (mode === "plain") {
    return adsets
      .map((a) => `${a.id}\t${a.name}\t${a.campaignId}\t${a.status}`)
      .join("\n");
  }

  const header = `${"ID".padEnd(20)} ${"Name".padEnd(30)} ${"Campaign".padEnd(20)} Status`;
  const separator = "-".repeat(80);
  const rows = adsets.map(
    (a) =>
      `${a.id.padEnd(20)} ${a.name.padEnd(30).slice(0, 30)} ${a.campaignId.padEnd(20)} ${a.status}`,
  );
  return [header, separator, ...rows].join("\n");
}

export function formatAds(ads: AdInfo[], mode: OutputMode): string {
  if (mode === "json") return JSON.stringify(ads, null, 2);
  if (ads.length === 0) return "No ads found.";

  if (mode === "plain") {
    return ads
      .map((a) => `${a.id}\t${a.name}\t${a.adsetId}\t${a.status}`)
      .join("\n");
  }

  const header = `${"ID".padEnd(20)} ${"Name".padEnd(30)} ${"Ad Set".padEnd(20)} Status`;
  const separator = "-".repeat(80);
  const rows = ads.map(
    (a) =>
      `${a.id.padEnd(20)} ${a.name.padEnd(30).slice(0, 30)} ${a.adsetId.padEnd(20)} ${a.status}`,
  );
  return [header, separator, ...rows].join("\n");
}

export function formatInsights(
  insights: InsightRow[],
  mode: OutputMode,
): string {
  if (mode === "json") return JSON.stringify(insights, null, 2);
  if (insights.length === 0) return "No data available for the specified period.";

  if (mode === "plain") {
    return insights
      .map(
        (r) =>
          [
            r.dateStart,
            r.dateStop,
            r.campaignName || "",
            r.adsetName || "",
            r.adName || "",
            r.impressions,
            r.clicks,
            r.spend,
            r.cpc,
            r.ctr,
            r.cpm,
          ].join("\t"),
      )
      .join("\n");
  }

  const rows = insights.map((r) => {
    const label =
      r.adName || r.adsetName || r.campaignName || "Account Total";
    return [
      `  ${label}`,
      `    Period: ${r.dateStart} — ${r.dateStop}`,
      `    Impressions: ${r.impressions.toLocaleString()}  |  Clicks: ${r.clicks.toLocaleString()}`,
      `    Spend: ${r.spend.toFixed(2)}  |  CPC: ${r.cpc.toFixed(2)}  |  CTR: ${r.ctr.toFixed(2)}%  |  CPM: ${r.cpm.toFixed(2)}`,
    ].join("\n");
  });

  return ["Performance Report", "=".repeat(60), ...rows].join("\n\n");
}
