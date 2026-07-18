import type { Plugin } from "@opencode-ai/plugin"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

export const GitGuardPlugin: Plugin = async ({ $, client, directory }) => {
  const localPath = join(directory, ".agents/scripts/git-guard.sh")
  const globalPath = join(homedir(), ".agents/scripts/git-guard.sh")
  const scriptPath = existsSync(localPath) ? localPath : existsSync(globalPath) ? globalPath : null

  if (!scriptPath) {
    await client.app.log({
      body: {
        service: "git-guard",
        level: "error",
        message: `git-guard.sh not found at ${localPath} or ${globalPath}; skipping checks`,
      },
    })
  }

  return {
    "tool.execute.before": async (input, output) => {
      if (!scriptPath || input.tool !== "bash") return

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