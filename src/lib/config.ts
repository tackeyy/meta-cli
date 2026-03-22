import type { MacConfig } from "./types.js";

export function loadConfig(): MacConfig {
  const accessToken = process.env.META_ADS_ACCESS_TOKEN || "";
  const accountId = process.env.META_ADS_ACCOUNT_ID || "";

  if (!accessToken) {
    throw new Error(
      "META_ADS_ACCESS_TOKEN is required. Set it as an environment variable or in ~/.secrets",
    );
  }

  if (!accountId) {
    throw new Error(
      "META_ADS_ACCOUNT_ID is required (act_XXXXX format). Set it as an environment variable or in ~/.secrets",
    );
  }

  if (!accountId.startsWith("act_")) {
    throw new Error(
      `META_ADS_ACCOUNT_ID must start with 'act_'. Got: ${accountId}`,
    );
  }

  return { accessToken, accountId };
}
