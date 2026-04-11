// Copy Monaco Editor's min/vs runtime into public/monaco/vs so it can be
// served from the same origin. @monaco-editor/react would otherwise pull
// the loader from cdn.jsdelivr.net at runtime, which is unreliable on some
// networks and can leave the editor stuck on "Loading...".
//
// Run automatically as `postinstall` and `prebuild` (see package.json).

import { cp, mkdir, rm, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const src = resolve(projectRoot, 'node_modules/monaco-editor/min/vs')
const dest = resolve(projectRoot, 'public/monaco/vs')

async function exists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function main() {
  if (!(await exists(src))) {
    console.warn(
      `[copy-monaco] source not found: ${src}\n` +
        `[copy-monaco] skipping (run "npm install" first).`,
    )
    return
  }

  await rm(dest, { recursive: true, force: true })
  await mkdir(dirname(dest), { recursive: true })
  await cp(src, dest, { recursive: true })
  console.log(`[copy-monaco] copied ${src} -> ${dest}`)
}

main().catch(err => {
  console.error('[copy-monaco] failed:', err)
  process.exit(1)
})
