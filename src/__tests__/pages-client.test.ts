import { describe, it, expect, vi, beforeEach } from "vitest";
import { PagesClient } from "../lib/pages-client.js";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockResponse(data: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 400,
    statusText: ok ? "OK" : "Bad Request",
    json: () => Promise.resolve(data),
  } as Response;
}

describe("PagesClient", () => {
  let client: PagesClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new PagesClient("123456", "test-token");
  });

  describe("authTest", () => {
    it("returns page info on success", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ id: "123456", name: "Test Page", category: "Software" }),
      );

      const result = await client.authTest();
      expect(result).toEqual({
        pageId: "123456",
        pageName: "Test Page",
        category: "Software",
      });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/v21.0/123456");
      expect(url).toContain("fields=id,name,category");
      expect(url).toContain("access_token=test-token");
    });

    it("throws on API error", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ error: { message: "Invalid token" } }, false),
      );

      await expect(client.authTest()).rejects.toThrow("Invalid token");
    });
  });

  describe("createPost", () => {
    it("creates a text post", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: "123456_789" }));

      const result = await client.createPost({ message: "Hello world" });
      expect(result).toEqual({ id: "123456_789" });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/123456/feed");

      const options = mockFetch.mock.calls[0][1] as RequestInit;
      expect(options.method).toBe("POST");
      expect(options.body).toContain("message=Hello+world");
    });

    it("creates a post with link", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: "123456_790" }));

      const result = await client.createPost({
        message: "Check this",
        link: "https://example.com",
      });
      expect(result).toEqual({ id: "123456_790" });

      const options = mockFetch.mock.calls[0][1] as RequestInit;
      const body = options.body as string;
      expect(body).toContain("link=https");
    });
  });

  describe("listPosts", () => {
    it("returns recent posts with attachment type", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          data: [
            {
              id: "123_1",
              message: "First post",
              created_time: "2026-03-25T10:00:00+0000",
              permalink_url: "https://www.facebook.com/123/posts/1",
            },
            {
              id: "123_2",
              message: "Second post",
              created_time: "2026-03-24T10:00:00+0000",
              permalink_url: "https://www.facebook.com/123/posts/2",
              attachments: {
                data: [{ type: "share", title: "Link", url: "https://example.com" }],
              },
            },
          ],
        }),
      );

      const posts = await client.listPosts({ limit: 5 });
      expect(posts).toHaveLength(2);
      expect(posts[0].id).toBe("123_1");
      expect(posts[0].message).toBe("First post");
      expect(posts[0].type).toBe("status");
      expect(posts[0].permalinkUrl).toBe("https://www.facebook.com/123/posts/1");
      expect(posts[1].type).toBe("share");

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("limit=5");
      expect(url).not.toContain("fields=id,message,created_time,type");
      expect(url).toContain("attachments");
    });
  });

  describe("getInsights", () => {
    it("returns page insights with default metrics", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          data: [
            {
              name: "page_impressions",
              period: "day",
              title: "Daily Total Impressions",
              values: [{ value: 100, end_time: "2026-03-25T08:00:00+0000" }],
            },
          ],
        }),
      );

      const insights = await client.getInsights({
        since: "2026-03-24",
        until: "2026-03-25",
      });
      expect(insights).toHaveLength(1);
      expect(insights[0].name).toBe("page_impressions");
      expect(insights[0].values[0].value).toBe(100);

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("page_impressions");
      expect(url).toContain("since=2026-03-24");
    });

    it("uses custom metrics", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ data: [] }));

      await client.getInsights({
        since: "2026-03-24",
        until: "2026-03-25",
        metrics: ["page_fans"],
      });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("metric=page_fans");
    });
  });
});
