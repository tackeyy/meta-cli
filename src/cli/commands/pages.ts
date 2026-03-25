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
