import type { Plugin } from "@opencode-ai/plugin"
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const scriptPath = join(dirname(fileURLToPath(import.meta.url)), "../assets/git-guard.sh")

export const GitGuardPlugin: Plugin = async ({ $, client }) => {
  const available = existsSync(scriptPath)

  if (!available) {
    await client.app.log({
      body: {
        service: "git-guard",
        level: "error",
        message: `git-guard.sh not found at ${scriptPath}; skipping checks`,
      },
    })
  }

  return {
    "tool.execute.before": async (input, output) => {
      if (!available || input.tool !== "bash") return

      const command: string = output.args.command ?? ""
      const payload = JSON.stringify({ command })
      const result = await $`echo ${payload} | bash ${scriptPath}`.nothrow()

      if (result.exitCode === 2) {
        throw new Error(
          `BLOCKED (git-guard): '${command}' matches dangerous git pattern. The user has prevented you from doing this.`
        )
      }
    },
  }
}

export default GitGuardPlugin