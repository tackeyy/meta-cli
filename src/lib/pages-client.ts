import { readFileSync } from "node:fs";
import { basename } from "node:path";
import type {
  PagePostResult,
  PagePhotoPostResult,
  PagePost,
  PageInsight,
  CreatePagePostArgs,
  ListPagePostsOptions,
  PageInsightsOptions,
  PageAuthResult,
  PageCoverPhotoResult,
  PageTokenInfo,
  PageTokenRefreshResult,
} from "./types.js";

const API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

export class PagesClient {
  private pageId: string;
  private pageToken: string;

  constructor(pageId: string, pageToken: string) {
    this.pageId = pageId;
    this.pageToken = pageToken;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const separator = path.includes("?") ? "&" : "?";
    const fullUrl = `${url}${separator}access_token=${this.pageToken}`;

    const response = await fetch(fullUrl, options);
    const data = await response.json();

    if (!response.ok) {
      const error = (data as Record<string, unknown>).error as
        | Record<string, unknown>
        | undefined;
      const message = error?.message ?? response.statusText;
      throw new Error(`Facebook Pages API Error: ${message}`);
    }

    return data as T;
  }

  async authTest(): Promise<PageAuthResult> {
    const data = await this.request<Record<string, unknown>>(
      `/${this.pageId}?fields=id,name,category`,
    );
    return {
      pageId: String(data.id),
      pageName: String(data.name),
      category: String(data.category ?? ""),
    };
  }

  async createPost(
    args: CreatePagePostArgs,
  ): Promise<PagePostResult | PagePhotoPostResult> {
    if (args.imagePath) {
      return this.createPhotoPost(args.message, args.imagePath);
    }

    const params = new URLSearchParams();
    params.set("message", args.message);
    if (args.link) params.set("link", args.link);

    const data = await this.request<Record<string, unknown>>(
      `/${this.pageId}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      },
    );

    return { id: String(data.id) };
  }

  private async createPhotoPost(
    message: string,
    imagePath: string,
  ): Promise<PagePhotoPostResult> {
    const fileBuffer = readFileSync(imagePath);
    const fileName = basename(imagePath);

    const formData = new FormData();
    formData.append("message", message);
    formData.append("source", new Blob([fileBuffer]), fileName);

    const data = await this.request<Record<string, unknown>>(
      `/${this.pageId}/photos`,
      {
        method: "POST",
        body: formData,
      },
    );

    return {
      id: String(data.id),
      postId: String(data.post_id ?? data.id),
    };
  }

  async listPosts(options: ListPagePostsOptions = {}): Promise<PagePost[]> {
    const limit = options.limit ?? 10;
    const data = await this.request<Record<string, unknown>>(
      `/${this.pageId}/feed?fields=id,message,created_time,permalink_url,attachments{type,title,url}&limit=${limit}`,
    );

    const posts = (data.data ?? []) as Record<string, unknown>[];
    return posts.map((p) => {
      const attachments = p.attachments as
        | { data?: Array<{ type?: string }> }
        | undefined;
      const attachmentType = attachments?.data?.[0]?.type;
      return {
        id: String(p.id),
        message: String(p.message ?? ""),
        createdTime: String(p.created_time),
        type: attachmentType ?? "status",
        permalinkUrl: p.permalink_url ? String(p.permalink_url) : undefined,
      };
    });
  }

  async updateCoverPhoto(imagePath: string): Promise<PageCoverPhotoResult> {
    const fileBuffer = readFileSync(imagePath);
    const fileName = basename(imagePath);

    const formData = new FormData();
    formData.append("source", new Blob([fileBuffer]), fileName);

    const data = await this.request<Record<string, unknown>>(
      `/${this.pageId}`,
      {
        method: "POST",
        body: formData,
      },
    );

    return {
      id: String(data.id ?? ""),
      source: String((data.cover as Record<string, unknown>)?.source ?? ""),
    };
  }

  /**
   * /debug_token でトークン情報を取得する
   * inspectorToken: debug_token の access_token パラメータに使うトークン
   *   （App Access Token = "{app_id}|{app_secret}" or 同アプリの有効なユーザートークン）
   */
  async tokenInfo(inspectorToken: string): Promise<PageTokenInfo> {
    const url = `${BASE_URL}/debug_token?input_token=${encodeURIComponent(this.pageToken)}&access_token=${encodeURIComponent(inspectorToken)}`;
    const response = await fetch(url);
    const json = await response.json();

    if (!response.ok) {
      const error = (json as Record<string, unknown>).error as
        | Record<string, unknown>
        | undefined;
      const message = error?.message ?? response.statusText;
      throw new Error(`Facebook Debug Token API Error: ${message}`);
    }

    const data = (json as Record<string, unknown>).data as Record<
      string,
      unknown
    >;
    if (!data) {
      throw new Error("Unexpected response: missing data field");
    }

    const expiresAt =
      typeof data.expires_at === "number" ? data.expires_at : undefined;
    const neverExpires = expiresAt === 0 || expiresAt === undefined;
    const nowSec = Math.floor(Date.now() / 1000);
    const daysRemaining =
      !neverExpires && expiresAt
        ? Math.floor((expiresAt - nowSec) / 86400)
        : undefined;
    const expiresAtIso =
      !neverExpires && expiresAt
        ? new Date(expiresAt * 1000).toISOString()
        : undefined;

    const scopes = Array.isArray(data.scopes)
      ? (data.scopes as string[])
      : [];

    return {
      isValid: Boolean(data.is_valid),
      tokenType: String(data.type ?? "UNKNOWN"),
      appId: String(data.app_id ?? ""),
      userId: data.user_id ? String(data.user_id) : undefined,
      expiresAt,
      expiresAtIso,
      daysRemaining,
      neverExpires,
      scopes,
      rawData: data,
    };
  }

  /**
   * Long-lived User Token を延長する（fb_exchange_token フロー）
   * 同じエンドポイントに既存のlong-lived tokenを渡すと新しいlong-lived token（60日）を返す
   * Page Access Token（無期限）の取得にも利用可能
   */
  async tokenRefresh(
    appId: string,
    appSecret: string,
  ): Promise<PageTokenRefreshResult> {
    const url =
      `${BASE_URL}/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${encodeURIComponent(appId)}` +
      `&client_secret=${encodeURIComponent(appSecret)}` +
      `&fb_exchange_token=${encodeURIComponent(this.pageToken)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      const error = (data as Record<string, unknown>).error as
        | Record<string, unknown>
        | undefined;
      const message = error?.message ?? response.statusText;
      return {
        success: false,
        message: `Token refresh failed: ${message}`,
      };
    }

    const result = data as Record<string, unknown>;
    const newToken = String(result.access_token ?? "");
    const expiresIn =
      typeof result.expires_in === "number" ? result.expires_in : undefined;
    const expiresAt = expiresIn
      ? Math.floor(Date.now() / 1000) + expiresIn
      : undefined;
    const expiresAtIso = expiresAt
      ? new Date(expiresAt * 1000).toISOString()
      : undefined;

    return {
      success: true,
      newToken,
      expiresAt,
      expiresAtIso,
      message: expiresAtIso
        ? `Token refreshed. New expiry: ${expiresAtIso}`
        : "Token refreshed (no expiry info returned)",
    };
  }

  async getInsights(options: PageInsightsOptions): Promise<PageInsight[]> {
    const metrics = options.metrics ?? [
      "page_impressions",
      "page_engaged_users",
      "page_post_engagements",
      "page_fans",
    ];

    const params = new URLSearchParams();
    params.set("metric", metrics.join(","));
    params.set("since", options.since);
    params.set("until", options.until);
    params.set("period", "day");

    const data = await this.request<Record<string, unknown>>(
      `/${this.pageId}/insights?${params.toString()}`,
    );

    const insights = (data.data ?? []) as Record<string, unknown>[];
    return insights.map((i) => ({
      name: String(i.name),
      period: String(i.period),
      title: String(i.title ?? i.name),
      values: ((i.values ?? []) as Record<string, unknown>[]).map((v) => ({
        value: Number(v.value ?? 0),
        endTime: String(v.end_time),
      })),
    }));
  }
}
