import type { Command } from "commander";
import { MacClient } from "../../lib/client.js";
import { loadConfig } from "../../lib/config.js";
import { formatCampaigns } from "../../lib/formatter.js";
import type { OutputMode } from "../../lib/types.js";

export function registerCampaignsCommand(
  program: Command,
  getOutputMode: () => OutputMode,
): void {
  const campaigns = program
    .command("campaigns")
    .description("Manage campaigns");

  campaigns
    .command("list")
    .description("List all campaigns")
    .option("--limit <n>", "Number of results", "50")
    .action(async (opts) => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        const result = await client.listCampaigns(Number(opts.limit));
        console.log(formatCampaigns(result, getOutputMode()));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });

  campaigns
    .command("create")
    .description("Create a new campaign")
    .requiredOption("--name <name>", "Campaign name")
    .requiredOption("--objective <objective>", "Campaign objective (e.g. OUTCOME_LEADS)")
    .option("--status <status>", "Initial status", "PAUSED")
    .option("--daily-budget <amount>", "Daily budget in cents")
    .option(
      "--bid-strategy <strategy>",
      "Bid strategy (LOWEST_COST_WITHOUT_CAP, LOWEST_COST_WITH_BID_CAP, COST_CAP)",
    )
    .action(async (opts) => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        const result = await client.createCampaign({
          name: opts.name,
          objective: opts.objective,
          status: opts.status,
          dailyBudget: opts.dailyBudget,
          bidStrategy: opts.bidStrategy,
        });
        const mode = getOutputMode();
        if (mode === "json") {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`Campaign created: ${result.id}`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });

  campaigns
    .command("update <id>")
    .description("Update a campaign")
    .option("--name <name>", "New campaign name")
    .option("--status <status>", "New status (ACTIVE|PAUSED)")
    .option(
      "--bid-strategy <strategy>",
      "Bid strategy (LOWEST_COST_WITHOUT_CAP, LOWEST_COST_WITH_BID_CAP, COST_CAP)",
    )
    .action(async (id, opts) => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        await client.updateCampaign(id, {
          name: opts.name,
          status: opts.status,
          bidStrategy: opts.bidStrategy,
        });
        const mode = getOutputMode();
        if (mode === "json") {
          console.log(JSON.stringify({ id, updated: true }, null, 2));
        } else {
          console.log(`Campaign ${id} updated.`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });

  campaigns
    .command("delete <id>")
    .description("Delete a campaign")
    .action(async (id) => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        await client.deleteCampaign(id);
        const mode = getOutputMode();
        if (mode === "json") {
          console.log(JSON.stringify({ id, deleted: true }, null, 2));
        } else {
          console.log(`Campaign ${id} deleted.`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}
