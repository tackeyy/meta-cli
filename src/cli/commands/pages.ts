import type { Command } from "commander";
import { PagesClient } from "../../lib/pages-client.js";
import type { OutputMode } from "../../lib/types.js";

function getPagesClient(): PagesClient {
  const pageId = process.env.ZEIMU_FB_PAGE_ID;
  const pageToken = process.env.ZEIMU_FB_PAGE_TOKEN;

  if (!pageId || !pageToken) {
    console.error(
      "Error: ZEIMU_FB_PAGE_ID and ZEIMU_FB_PAGE_TOKEN must be set",
    );
    process.exit(1);
  }

  return new PagesClient(pageId, pageToken);
}

function handleError(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Error: ${message}`);
  process.exit(1);
}

export function registerPagesCommand(
  program: Command,
  getOutputMode: () => OutputMode,
): void {
  const pages = program
    .command("pages")
    .description("Facebook Pages operations");

  // pages auth
  pages
    .command("auth")
    .description("Test page authentication")
    .action(async () => {
      try {
        const result = await getPagesClient().authTest();
        if (getOutputMode() === "json") {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`Authentication successful`);
          console.log(`  Page ID: ${result.pageId}`);
          console.log(`  Page Name: ${result.pageName}`);
          console.log(`  Category: ${result.category}`);
        }
      } catch (err: unknown) {
        handleError(err);
      }
    });

  // pages post
  pages
    .command("post <message>")
    .description("Create a post on the page")
    .option("--link <url>", "URL to share")
    .option("--image <path>", "Image file path")
    .action(async (message: string, opts) => {
      try {
        const result = await getPagesClient().createPost({
          message,
          link: opts.link,
          imagePath: opts.image,
        });
        if (getOutputMode() === "json") {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`Post created: ${result.id}`);
        }
      } catch (err: unknown) {
        handleError(err);
      }
    });

  // pages list
  pages
    .command("list")
    .description("List recent posts")
    .option("--limit <n>", "Number of posts", "10")
    .action(async (opts) => {
      try {
        const posts = await getPagesClient().listPosts({
          limit: parseInt(opts.limit, 10),
        });
        if (getOutputMode() === "json") {
          console.log(JSON.stringify(posts, null, 2));
        } else if (getOutputMode() === "plain") {
          for (const p of posts) {
            console.log(
              `${p.id}\t${p.createdTime}\t${p.message.slice(0, 80)}`,
            );
          }
        } else {
          for (const p of posts) {
            const preview =
              p.message.length > 80
                ? p.message.slice(0, 80) + "…"
                : p.message;
            console.log(`[${p.createdTime}] ${preview}`);
            console.log(`  ID: ${p.id}\n`);
          }
        }
      } catch (err: unknown) {
        handleError(err);
      }
    });

  // pages cover
  pages
    .command("cover")
    .description("Update page cover photo")
    .requiredOption("--image <path>", "Image file path")
    .action(async (opts) => {
      try {
        const result = await getPagesClient().updateCoverPhoto(opts.image);
        if (getOutputMode() === "json") {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`Cover photo updated successfully`);
          if (result.id) console.log(`  ID: ${result.id}`);
          if (result.source) console.log(`  Source: ${result.source}`);
        }
      } catch (err: unknown) {
        handleError(err);
      }
    });

  // pages token-info
  pages
    .command("token-info")
    .description(
      "Check token validity and expiry via /debug_token (requires META_ADS_ACCESS_TOKEN as inspector token)",
    )
    .action(async () => {
      try {
        // META_ADS_ACCESS_TOKEN を inspector token として使用
        // (同アプリの有効なトークンなら debug_token の access_token に使える)
        const inspectorToken = process.env.META_ADS_ACCESS_TOKEN;
        if (!inspectorToken) {
          console.error(
            "Error: META_ADS_ACCESS_TOKEN must be set (used as inspector token for /debug_token)",
          );
          process.exit(1);
        }
        const result = await getPagesClient().tokenInfo(inspectorToken);
        if (getOutputMode() === "json") {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`Token valid: ${result.isValid}`);
          console.log(`Token type:  ${result.tokenType}`);
          console.log(`App ID:      ${result.appId}`);
          if (result.userId) console.log(`User ID:     ${result.userId}`);
          if (result.neverExpires) {
            console.log(`Expires:     Never (永久トークン)`);
          } else if (result.expiresAtIso) {
            const days = result.daysRemaining ?? "?";
            const warn =
              typeof result.daysRemaining === "number" &&
              result.daysRemaining <= 7
                ? " ⚠️ 期限まで7日以内!"
                : "";
            console.log(`Expires:     ${result.expiresAtIso} (残${days}日)${warn}`);
          }
          if (result.scopes.length > 0) {
            console.log(`Scopes:      ${result.scopes.join(", ")}`);
          }
        }
      } catch (err: unknown) {
        handleError(err);
      }
    });

  // pages token-refresh
  pages
    .command("token-refresh")
    .description(
      "Refresh/extend the page token via fb_exchange_token (requires ZEIMU_FB_APP_ID and ZEIMU_FB_APP_SECRET)",
    )
    .action(async () => {
      try {
        const appId = process.env.ZEIMU_FB_APP_ID;
        const appSecret = process.env.ZEIMU_FB_APP_SECRET;
        if (!appId || !appSecret) {
          console.error(
            "Error: ZEIMU_FB_APP_ID and ZEIMU_FB_APP_SECRET must be set",
          );
          process.exit(1);
        }
        const result = await getPagesClient().tokenRefresh(appId, appSecret);
        if (getOutputMode() === "json") {
          console.log(JSON.stringify(result, null, 2));
        } else if (result.success) {
          console.log(`Token refresh successful`);
          if (result.expiresAtIso) {
            console.log(`  New expiry: ${result.expiresAtIso}`);
          }
          console.log(`  New token (update ZEIMU_FB_PAGE_TOKEN):`);
          console.log(`  ${result.newToken}`);
        } else {
          console.error(`Token refresh failed: ${result.message}`);
          process.exit(1);
        }
      } catch (err: unknown) {
        handleError(err);
      }
    });

  // pages insights
  pages
    .command("insights")
    .description("Get page insights")
    .requiredOption("--from <date>", "Start date (YYYY-MM-DD)")
    .requiredOption("--to <date>", "End date (YYYY-MM-DD)")
    .option("--metrics <list>", "Comma-separated metrics")
    .action(async (opts) => {
      try {
        const metrics = opts.metrics?.split(",");
        const insights = await getPagesClient().getInsights({
          since: opts.from,
          until: opts.to,
          metrics,
        });
        if (getOutputMode() === "json") {
          console.log(JSON.stringify(insights, null, 2));
        } else {
          for (const insight of insights) {
            console.log(`${insight.title} (${insight.period})`);
            for (const v of insight.values) {
              console.log(`  ${v.endTime}: ${v.value}`);
            }
            console.log("");
          }
        }
      } catch (err: unknown) {
        handleError(err);
      }
    });
}
