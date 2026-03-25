import type { Command } from "commander";
import { MacClient } from "../../lib/client.js";
import { loadConfig } from "../../lib/config.js";
import type { OutputMode } from "../../lib/types.js";

export function registerTargetingCommand(
  program: Command,
  getOutputMode: () => OutputMode,
): void {
  const targeting = program
    .command("targeting")
    .description("Search targeting options (interests, regions, locales)");

  targeting
    .command("interests <query>")
    .description("Search for interest targeting IDs")
    .option("--limit <n>", "Max results", "10")
    .action(async (query, opts) => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        const results = await client.searchTargeting({
          type: "adinterest",
          query,
          limit: Number(opts.limit),
        });
        const mode = getOutputMode();
        if (mode === "json") {
          console.log(JSON.stringify(results, null, 2));
        } else if (mode === "plain") {
          for (const r of results) {
            console.log(`${r.id}\t${r.name}\t${r.audience_size || "N/A"}`);
          }
        } else {
          if (results.length === 0) {
            console.log("No interests found.");
            return;
          }
          for (const r of results) {
            console.log(
              `  id=${r.id}, name=${r.name}, audience=${r.audience_size || "N/A"}`,
            );
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });

  targeting
    .command("regions <query>")
    .description("Search for region/geo targeting keys")
    .option("--country <code>", "Country code (e.g. JP)", "JP")
    .option("--limit <n>", "Max results", "10")
    .action(async (query, opts) => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        const results = await client.searchTargeting({
          type: "adgeolocation",
          query,
          countryCode: opts.country,
          locationTypes: ["region"],
          limit: Number(opts.limit),
        });
        const mode = getOutputMode();
        if (mode === "json") {
          console.log(JSON.stringify(results, null, 2));
        } else if (mode === "plain") {
          for (const r of results) {
            console.log(`${r.key}\t${r.name}\t${r.type}`);
          }
        } else {
          if (results.length === 0) {
            console.log("No regions found.");
            return;
          }
          for (const r of results) {
            console.log(`  key=${r.key}, name=${r.name}, type=${r.type}`);
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });

  targeting
    .command("locales <query>")
    .description("Search for locale/language targeting IDs")
    .option("--limit <n>", "Max results", "10")
    .action(async (query, opts) => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        const results = await client.searchTargeting({
          type: "adlocale",
          query,
          limit: Number(opts.limit),
        });
        const mode = getOutputMode();
        if (mode === "json") {
          console.log(JSON.stringify(results, null, 2));
        } else if (mode === "plain") {
          for (const r of results) {
            console.log(`${r.key}\t${r.name}`);
          }
        } else {
          if (results.length === 0) {
            console.log("No locales found.");
            return;
          }
          for (const r of results) {
            console.log(`  key=${r.key}, name=${r.name}`);
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}
