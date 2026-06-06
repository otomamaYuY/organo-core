// Copy Monaco Editor's min/vs runtime into public/monaco/vs so it can be
// served from the same origin. @monaco-editor/react would otherwise pull
// the loader from cdn.jsdelivr.net at runtime, which is unreliable on some
// networks and can leave the editor stuck on "Loading...".
//
// Run automatically as `postinstall` and `prebuild` (see package.json).

import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
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

  // ── Monaco 0.55.x patch ──────────────────────────────────────────────────
  // editor.main.js's Ne() helper uses `for...in` on the AMD require function
  // then calls Object.getOwnPropertyDescriptor for each key. Inherited
  // enumerable properties (added to Function.prototype by some browser
  // extensions) cause getOwnPropertyDescriptor to return undefined, making
  // `r.get` throw a TypeError. Add a guard to skip such properties.
  const editorMain = resolve(dest, 'editor', 'editor.main.js')
  try {
    let code = await readFile(editorMain, 'utf8')
    const buggy = 'const r=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,r.get?r'
    const fixed = 'const r=Object.getOwnPropertyDescriptor(e,n);if(!r)continue;Object.defineProperty(t,n,r.get?r'
    if (code.includes(buggy)) {
      await writeFile(editorMain, code.replace(buggy, fixed), 'utf8')
      console.log('[copy-monaco] patched editor.main.js (Ne guard for undefined property descriptor)')
    }
  } catch (e) {
    console.warn('[copy-monaco] could not patch editor.main.js:', e.message)
  }
}

main().catch(err => {
  console.error('[copy-monaco] failed:', err)
  process.exit(1)
})
