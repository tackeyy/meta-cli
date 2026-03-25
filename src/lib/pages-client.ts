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
      `/${this.pageId}/feed?fields=id,message,created_time,type&limit=${limit}`,
    );

    const posts = (data.data ?? []) as Record<string, unknown>[];
    return posts.map((p) => ({
      id: String(p.id),
      message: String(p.message ?? ""),
      createdTime: String(p.created_time),
      type: String(p.type ?? "status"),
    }));
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
