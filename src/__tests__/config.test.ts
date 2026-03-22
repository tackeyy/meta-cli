import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "../lib/config.js";

describe("loadConfig", () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.META_ADS_ACCESS_TOKEN;
    delete process.env.META_ADS_ACCOUNT_ID;
  });

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it("throws if META_ADS_ACCESS_TOKEN is missing", () => {
    process.env.META_ADS_ACCOUNT_ID = "act_123";
    expect(() => loadConfig()).toThrow("META_ADS_ACCESS_TOKEN is required");
  });

  it("throws if META_ADS_ACCOUNT_ID is missing", () => {
    process.env.META_ADS_ACCESS_TOKEN = "token123";
    expect(() => loadConfig()).toThrow("META_ADS_ACCOUNT_ID is required");
  });

  it("throws if account ID does not start with act_", () => {
    process.env.META_ADS_ACCESS_TOKEN = "token123";
    process.env.META_ADS_ACCOUNT_ID = "123456";
    expect(() => loadConfig()).toThrow("must start with 'act_'");
  });

  it("returns config when all env vars are set correctly", () => {
    process.env.META_ADS_ACCESS_TOKEN = "token123";
    process.env.META_ADS_ACCOUNT_ID = "act_123456";
    const config = loadConfig();
    expect(config.accessToken).toBe("token123");
    expect(config.accountId).toBe("act_123456");
  });
});
