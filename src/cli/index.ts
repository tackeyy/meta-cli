#!/usr/bin/env node
import { Command } from "commander";
import type { OutputMode } from "../lib/types.js";
import { registerAuthCommand } from "./commands/auth.js";
import { registerCampaignsCommand } from "./commands/campaigns.js";
import { registerAdSetsCommand } from "./commands/adsets.js";
import { registerAdsCommand } from "./commands/ads.js";
import { registerInsightsCommand } from "./commands/insights.js";

const program = new Command();

program
  .name("mac")
  .description("Meta Ads CLI — manage Facebook/Instagram ad campaigns")
  .version("0.1.0")
  .option("--json", "Output in JSON format")
  .option("--plain", "Output in TSV format (for piping)");

function getOutputMode(): OutputMode {
  const opts = program.opts();
  if (opts.json) return "json";
  if (opts.plain) return "plain";
  return "human";
}

registerAuthCommand(program, getOutputMode);
registerCampaignsCommand(program, getOutputMode);
registerAdSetsCommand(program, getOutputMode);
registerAdsCommand(program, getOutputMode);
registerInsightsCommand(program, getOutputMode);

program.parse();
