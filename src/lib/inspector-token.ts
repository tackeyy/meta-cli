export type InspectorTokenSource =
  | "app_access_token"
  | "meta_ads_access_token"
  | "none";

export interface ResolvedInspectorToken {
  token: string | null;
  source: InspectorTokenSource;
}

/**
 * /debug_token の access_token パラメータに使う inspector token を解決する。
 *
 * 優先順位:
 *   1. ZEIMU_FB_APP_ID + ZEIMU_FB_APP_SECRET → App Access Token "{appId}|{appSecret}"
 *      （Facebook の仕様で失効しない。サーバー側からのみ使うこと）
 *   2. META_ADS_ACCESS_TOKEN → そのまま使用（後方互換）
 *   3. どちらもなければ null
 */
export function resolveInspectorToken(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
): ResolvedInspectorToken {
  const appId = env.ZEIMU_FB_APP_ID;
  const appSecret = env.ZEIMU_FB_APP_SECRET;
  if (appId && appSecret) {
    return { token: `${appId}|${appSecret}`, source: "app_access_token" };
  }

  const metaAdsToken = env.META_ADS_ACCESS_TOKEN;
  if (metaAdsToken) {
    return { token: metaAdsToken, source: "meta_ads_access_token" };
  }

  return { token: null, source: "none" };
}
