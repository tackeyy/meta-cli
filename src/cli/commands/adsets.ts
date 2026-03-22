import type { Command } from "commander";
import { MacClient } from "../../lib/client.js";
import { loadConfig } from "../../lib/config.js";
import { formatAdSets } from "../../lib/formatter.js";
import type { OutputMode } from "../../lib/types.js";

export function registerAdSetsCommand(
  program: Command,
  getOutputMode: () => OutputMode,
): void {
  const adsets = program
    .command("adsets")
    .description("Manage ad sets");

  adsets
    .command("list")
    .description("List ad sets")
    .option("--campaign-id <id>", "Filter by campaign ID")
    .option("--limit <n>", "Number of results", "50")
    .action(async (opts) => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        const result = await client.listAdSets(
          opts.campaignId,
          Number(opts.limit),
        );
        console.log(formatAdSets(result, getOutputMode()));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}
