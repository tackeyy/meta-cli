import type { Command } from "commander";
import { MacClient } from "../../lib/client.js";
import { loadConfig } from "../../lib/config.js";
import { formatInsights } from "../../lib/formatter.js";
import type { OutputMode, InsightLevel } from "../../lib/types.js";

export function registerInsightsCommand(
  program: Command,
  getOutputMode: () => OutputMode,
): void {
  program
    .command("insights")
    .description("Show performance report (CPC, CTR, spend, etc.)")
    .option("--level <level>", "Aggregation level: campaign|adset|ad", "campaign")
    .option("--from <date>", "Start date (YYYY-MM-DD)")
    .option("--to <date>", "End date (YYYY-MM-DD)")
    .option("--limit <n>", "Number of results", "100")
    .action(async (opts) => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        const insights = await client.getInsights({
          level: opts.level as InsightLevel,
          from: opts.from,
          to: opts.to,
          limit: Number(opts.limit),
        });
        console.log(formatInsights(insights, getOutputMode()));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}
