import { test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const scriptPath = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "git-guard.sh")

function guard(command: string): number {
  const result = spawnSync("bash", [scriptPath], { input: JSON.stringify({ command }), encoding: "utf8" })
  return result.status ?? -1
}

const dangerous = [
  "git push",
  "git push --force",
  "git branch -D feature",
  "git checkout .",
  "git clean -fd",
  "git filter-branch --tree-filter x",
  "git reset --hard",
  "git restore .",
  "npm run push --force",
  "reset --hard HEAD~1",
]

const safe = ["git status", "git log --oneline -5", "git add file.txt", 'git commit -m "msg"', "ls -la"]

for (const command of dangerous) {
  test(`blocks: ${command}`, () => {
    assert.equal(guard(command), 2)
  })
}

for (const command of safe) {
  test(`allows: ${command}`, () => {
    assert.equal(guard(command), 0)
  })
}
