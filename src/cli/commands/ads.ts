import type { Command } from "commander";
import { MacClient } from "../../lib/client.js";
import { loadConfig } from "../../lib/config.js";
import { formatAds } from "../../lib/formatter.js";
import type { OutputMode } from "../../lib/types.js";

export function registerAdsCommand(
  program: Command,
  getOutputMode: () => OutputMode,
): void {
  const ads = program
    .command("ads")
    .description("Manage ads");

  ads
    .command("list")
    .description("List ads")
    .option("--adset-id <id>", "Filter by ad set ID")
    .option("--limit <n>", "Number of results", "50")
    .action(async (opts) => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        const result = await client.listAds(opts.adsetId, Number(opts.limit));
        console.log(formatAds(result, getOutputMode()));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });

  ads
    .command("get <id>")
    .description("Get ad creative details including destination URL")
    .action(async (id) => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        const details = await client.getAdCreativeDetails(id);
        const mode = getOutputMode();
        const spec = details.objectStorySpec as Record<string, unknown> | undefined;
        const linkData = spec?.link_data as Record<string, unknown> | undefined;
        const videoData = spec?.video_data as Record<string, unknown> | undefined;
        const url = linkData?.link ?? videoData?.link_description ?? "(URL not found)";
        if (mode === "json") {
          console.log(JSON.stringify({ id, creativeId: details.creativeId, url, objectStorySpec: details.objectStorySpec }, null, 2));
        } else {
          console.log(`Ad ID:        ${id}`);
          console.log(`Creative ID:  ${details.creativeId}`);
          console.log(`URL:          ${url}`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });

  ads
    .command("update <id>")
    .description("Update an ad")
    .option("--name <name>", "New ad name")
    .option("--status <status>", "New status (ACTIVE|PAUSED)")
    .option("--creative <json>", "Creative spec as JSON")
    .action(async (id, opts) => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        const creative = opts.creative ? JSON.parse(opts.creative) : undefined;
        await client.updateAd(id, {
          name: opts.name,
          status: opts.status,
          creative,
        });
        const mode = getOutputMode();
        if (mode === "json") {
          console.log(JSON.stringify({ id, updated: true }, null, 2));
        } else {
          console.log(`Ad ${id} updated.`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });

  ads
    .command("update-url <id>")
    .description("Update the destination URL of an ad (creates a new creative with the new URL)")
    .requiredOption("--url <url>", "New destination URL (include UTM parameters)")
    .action(async (id, opts) => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        const result = await client.updateAdUrl(id, opts.url);
        const mode = getOutputMode();
        if (mode === "json") {
          console.log(JSON.stringify({ id, newCreativeId: result.newCreativeId, updated: true }, null, 2));
        } else {
          console.log(`Ad ${id} URL updated. New creative: ${result.newCreativeId}`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });

  ads
    .command("create")
    .description("Create a new ad")
    .requiredOption("--adset-id <id>", "Ad set ID")
    .requiredOption("--name <name>", "Ad name")
    .requiredOption(
      "--creative <json>",
      'Creative spec as JSON (e.g. \'{"creative_id":"123"}\' or full object_story_spec)',
    )
    .option("--status <status>", "Initial status", "PAUSED")
    .option("--tracking-specs <json>", "Tracking specs as JSON array string")
    .action(async (opts) => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        const creative = JSON.parse(opts.creative);
        const trackingSpecs = opts.trackingSpecs
          ? JSON.parse(opts.trackingSpecs)
          : undefined;
        const result = await client.createAd({
          adsetId: opts.adsetId,
          name: opts.name,
          creative,
          status: opts.status,
          trackingSpecs,
        });
        const mode = getOutputMode();
        if (mode === "json") {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`Ad created: ${result.id}`);
        }
      } catch (err: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;
        const apiError = e?.response?.error || e?.response;
        const message = apiError?.error_user_msg
          || apiError?.message
          || (err instanceof Error ? err.message : String(err));
        console.error(`Error: ${message}`);
        if (apiError?.error_subcode) console.error(`Subcode: ${apiError.error_subcode}`);
        if (apiError?.error_user_title) console.error(`Title: ${apiError.error_user_title}`);
        if (apiError?.error_user_msg) console.error(`Detail: ${apiError.error_user_msg}`);
        process.exit(1);
      }
    });
}
