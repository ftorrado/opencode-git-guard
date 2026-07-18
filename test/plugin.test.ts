import { test } from "node:test"
import assert from "node:assert/strict"
import { GitGuardPlugin } from "../src/index.ts"

function mockInput(exitCode: number) {
  const calls: unknown[] = []
  const $ = (_strings: TemplateStringsArray, ...values: unknown[]) => {
    calls.push(values)
    return { nothrow: async () => ({ exitCode }) }
  }
  return { $, client: { app: { log: async () => {} } }, calls } as any
}

test("ignores non-bash tools", async () => {
  const input = mockInput(2)
  const hooks = await GitGuardPlugin(input)
  await hooks["tool.execute.before"]!({ tool: "edit" } as any, { args: { command: "git push --force" } } as any)
  assert.equal(input.calls.length, 0)
})

test("allows bash commands the script doesn't flag", async () => {
  const input = mockInput(0)
  const hooks = await GitGuardPlugin(input)
  await assert.doesNotReject(hooks["tool.execute.before"]!({ tool: "bash" } as any, { args: { command: "git status" } } as any))
})

test("blocks bash commands the script flags", async () => {
  const input = mockInput(2)
  const hooks = await GitGuardPlugin(input)
  await assert.rejects(
    hooks["tool.execute.before"]!({ tool: "bash" } as any, { args: { command: "git push --force" } } as any),
    /BLOCKED \(git-guard\)/,
  )
})
