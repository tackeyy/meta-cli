import type { Command } from "commander";
import { MacClient } from "../../lib/client.js";
import { loadConfig } from "../../lib/config.js";
import type { OutputMode } from "../../lib/types.js";

export function registerImagesCommand(
  program: Command,
  getOutputMode: () => OutputMode,
): void {
  const images = program
    .command("images")
    .description("Manage ad images");

  images
    .command("upload")
    .description("Upload an image file and return its image hash")
    .requiredOption("--file <path>", "Path to the image file")
    .action(async (opts) => {
      try {
        const fs = await import("fs");
        if (!fs.existsSync(opts.file)) {
          throw new Error(`File not found: ${opts.file}`);
        }
        const config = loadConfig();
        const client = new MacClient(config);
        const result = await client.uploadImage(opts.file);
        const mode = getOutputMode();
        if (mode === "json") {
          console.log(JSON.stringify(result, null, 2));
        } else if (mode === "plain") {
          console.log(`${result.hash}\t${result.name}\t${result.url}`);
        } else {
          console.log(`Image uploaded successfully.`);
          console.log(`  Hash: ${result.hash}`);
          console.log(`  Name: ${result.name}`);
          console.log(`  URL: ${result.url}`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}
