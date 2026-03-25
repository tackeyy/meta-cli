import type { Command } from "commander";
import { MacClient } from "../../lib/client.js";
import { loadConfig } from "../../lib/config.js";
import type { OutputMode } from "../../lib/types.js";

export function registerRecommendationsCommand(
  program: Command,
  getOutputMode: () => OutputMode,
): void {
  program
    .command("recommendations")
    .description("Show account recommendations and optimization score")
    .action(async () => {
      try {
        const config = loadConfig();
        const client = new MacClient(config);
        const result = await client.getRecommendations();
        const mode = getOutputMode();

        if (mode === "json") {
          console.log(JSON.stringify(result, null, 2));
        } else {
          const recs = result.recommendations;
          if (recs.length === 0) {
            console.log("No recommendations found.");
            return;
          }

          console.log(
            `Found ${recs.length} recommendation(s):\n`,
          );

          for (const rec of recs) {
            const importance =
              (rec.importance as string) || "UNKNOWN";
            const title = (rec.title as string) || "(no title)";
            const message =
              (rec.message as string) || "(no message)";
            const type = (rec.type as string) || "";
            const score = rec.score as number | undefined;
            const actions = rec.recommended_actions as
              | string[]
              | undefined;

            console.log(`[${importance}] ${title}`);
            if (type) console.log(`  Type: ${type}`);
            if (score !== undefined) console.log(`  Score: ${score}`);
            console.log(`  ${message}`);
            if (actions && actions.length > 0) {
              console.log(`  Actions: ${actions.join(", ")}`);
            }
            console.log("");
          }
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}
