import type { Command } from "commander";
import { MacClient } from "../../lib/client.js";
import { loadConfig } from "../../lib/config.js";
import { formatAccountInfo } from "../../lib/formatter.js";
import type { OutputMode } from "../../lib/types.js";

export function registerAuthCommand(
  program: Command,
  getOutputMode: () => OutputMode,
): void {
  const auth = program
    .command("auth")
    .description("Authentication commands");

  auth
    .command("test")
    .description("Test Meta Ads API authentication")
    .action(async () => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        const result = await client.authTest();
        const mode = getOutputMode();

        if (mode === "json") {
          console.log(JSON.stringify(result, null, 2));
        } else if (mode === "plain") {
          console.log(`${result.id}\t${result.name}`);
        } else {
          console.log(`Account ID: ${result.id}`);
          console.log(`Name: ${result.name}`);
          console.log("Authentication successful.");
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });

  auth
    .command("info")
    .description("Show ad account details")
    .action(async () => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        const info = await client.getAccountInfo();
        console.log(formatAccountInfo(info, getOutputMode()));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}
