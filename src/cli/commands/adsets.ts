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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;
        // Try multiple SDK error formats
        const apiError = e?.response?.error || e?._body?.error || e?.body?.error;
        const message = apiError?.error_user_msg
          || apiError?.message
          || (err instanceof Error ? err.message : String(err));
        console.error(`Error: ${message}`);
        if (apiError) {
          console.error(`Code: ${apiError.code}, Subcode: ${apiError.error_subcode || "N/A"}`);
          if (apiError.error_user_msg) console.error(`User msg: ${apiError.error_user_msg}`);
          if (apiError.is_transient) console.error(`(Transient error - retry may succeed)`);
        }
        process.exit(1);
      }
    });

  adsets
    .command("create")
    .description("Create a new ad set")
    .requiredOption("--campaign-id <id>", "Campaign ID")
    .requiredOption("--name <name>", "Ad set name")
    .requiredOption(
      "--optimization-goal <goal>",
      "Optimization goal (e.g. OFFSITE_CONVERSIONS, LINK_CLICKS, LEAD_GENERATION)",
    )
    .requiredOption(
      "--billing-event <event>",
      "Billing event (e.g. IMPRESSIONS, LINK_CLICKS)",
    )
    .requiredOption("--targeting <json>", "Targeting spec as JSON string")
    .option("--daily-budget <amount>", "Daily budget in account currency minor units")
    .option("--lifetime-budget <amount>", "Lifetime budget (requires --end-time)")
    .option(
      "--bid-strategy <strategy>",
      "Bid strategy (LOWEST_COST_WITHOUT_CAP, LOWEST_COST_WITH_BID_CAP, COST_CAP)",
    )
    .option("--bid-amount <amount>", "Bid cap or target cost")
    .option("--status <status>", "Initial status", "PAUSED")
    .option("--start-time <time>", "Start time (ISO 8601 or UNIX timestamp)")
    .option("--end-time <time>", "End time (ISO 8601 or UNIX timestamp)")
    .option("--promoted-object <json>", "Promoted object as JSON string")
    .option(
      "--destination-type <type>",
      "Destination type (WEBSITE, APP, MESSENGER, etc.)",
    )
    .action(async (opts) => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        const targeting = JSON.parse(opts.targeting);
        const promotedObject = opts.promotedObject
          ? JSON.parse(opts.promotedObject)
          : undefined;
        const result = await client.createAdSet({
          campaignId: opts.campaignId,
          name: opts.name,
          optimizationGoal: opts.optimizationGoal,
          billingEvent: opts.billingEvent,
          targeting,
          dailyBudget: opts.dailyBudget,
          lifetimeBudget: opts.lifetimeBudget,
          bidStrategy: opts.bidStrategy,
          bidAmount: opts.bidAmount,
          status: opts.status,
          startTime: opts.startTime,
          endTime: opts.endTime,
          promotedObject,
          destinationType: opts.destinationType,
        });
        const mode = getOutputMode();
        if (mode === "json") {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`Ad set created: ${result.id}`);
        }
      } catch (err: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;
        // Try multiple SDK error formats
        const apiError = e?.response?.error || e?._body?.error || e?.body?.error;
        const message = apiError?.error_user_msg
          || apiError?.message
          || (err instanceof Error ? err.message : String(err));
        console.error(`Error: ${message}`);
        if (apiError) {
          console.error(`Code: ${apiError.code}, Subcode: ${apiError.error_subcode || "N/A"}`);
          if (apiError.error_user_msg) console.error(`User msg: ${apiError.error_user_msg}`);
          if (apiError.is_transient) console.error(`(Transient error - retry may succeed)`);
        }
        process.exit(1);
      }
    });

  adsets
    .command("delete <id>")
    .description("Delete an ad set")
    .action(async (id) => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        await client.deleteAdSet(id);
        const mode = getOutputMode();
        if (mode === "json") {
          console.log(JSON.stringify({ id, deleted: true }, null, 2));
        } else {
          console.log(`Ad set ${id} deleted.`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}
