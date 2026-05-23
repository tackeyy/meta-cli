import { describe, it, expect } from "vitest";
import { resolveInspectorToken } from "../lib/inspector-token.js";

describe("resolveInspectorToken", () => {
  it("returns App Access Token when APP_ID and APP_SECRET are both set", () => {
    const env = {
      ZEIMU_FB_APP_ID: "1234567890",
      ZEIMU_FB_APP_SECRET: "abcdef",
    };
    const result = resolveInspectorToken(env);
    expect(result.token).toBe("1234567890|abcdef");
    expect(result.source).toBe("app_access_token");
  });

  it("prefers App Access Token over META_ADS_ACCESS_TOKEN", () => {
    const env = {
      ZEIMU_FB_APP_ID: "1234567890",
      ZEIMU_FB_APP_SECRET: "abcdef",
      META_ADS_ACCESS_TOKEN: "EAA...legacy",
    };
    const result = resolveInspectorToken(env);
    expect(result.token).toBe("1234567890|abcdef");
    expect(result.source).toBe("app_access_token");
  });

  it("falls back to META_ADS_ACCESS_TOKEN when APP credentials are missing", () => {
    const env = {
      META_ADS_ACCESS_TOKEN: "EAA...legacy",
    };
    const result = resolveInspectorToken(env);
    expect(result.token).toBe("EAA...legacy");
    expect(result.source).toBe("meta_ads_access_token");
  });

  it("falls back when only APP_ID is set", () => {
    const env = {
      ZEIMU_FB_APP_ID: "1234567890",
      META_ADS_ACCESS_TOKEN: "EAA...legacy",
    };
    const result = resolveInspectorToken(env);
    expect(result.token).toBe("EAA...legacy");
    expect(result.source).toBe("meta_ads_access_token");
  });

  it("falls back when only APP_SECRET is set", () => {
    const env = {
      ZEIMU_FB_APP_SECRET: "abcdef",
      META_ADS_ACCESS_TOKEN: "EAA...legacy",
    };
    const result = resolveInspectorToken(env);
    expect(result.token).toBe("EAA...legacy");
    expect(result.source).toBe("meta_ads_access_token");
  });

  it("returns null when no credentials are available", () => {
    const result = resolveInspectorToken({});
    expect(result.token).toBeNull();
    expect(result.source).toBe("none");
  });

  it("treats empty strings as unset", () => {
    const env = {
      ZEIMU_FB_APP_ID: "",
      ZEIMU_FB_APP_SECRET: "",
      META_ADS_ACCESS_TOKEN: "",
    };
    const result = resolveInspectorToken(env);
    expect(result.token).toBeNull();
    expect(result.source).toBe("none");
  });
});
