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
}
