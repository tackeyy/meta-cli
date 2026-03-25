#!/usr/bin/env node
import { Command } from "commander";
import type { OutputMode } from "../lib/types.js";
import { registerAuthCommand } from "./commands/auth.js";
import { registerCampaignsCommand } from "./commands/campaigns.js";
import { registerAdSetsCommand } from "./commands/adsets.js";
import { registerAdsCommand } from "./commands/ads.js";
import { registerInsightsCommand } from "./commands/insights.js";
import { registerImagesCommand } from "./commands/images.js";
import { registerPagesCommand } from "./commands/pages.js";

const program = new Command();

program
  .name("meta-cli")
  .description("Meta CLI — Facebook/Instagram ads + Pages management")
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
registerImagesCommand(program, getOutputMode);
registerPagesCommand(program, getOutputMode);

program.parse();
