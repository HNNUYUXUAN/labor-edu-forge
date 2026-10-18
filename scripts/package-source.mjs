import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import JSZip from 'jszip'

execFileSync(process.execPath, ['scripts/security-check.mjs'], { stdio: 'inherit' })
const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z']).toString().split('\0').filter(Boolean))]
const zip = new JSZip()
for (const name of files) {
  if (!fs.existsSync(name)) continue
  if (fs.lstatSync(name).isSymbolicLink()) throw new Error(`Source package does not accept symlinks: ${name}`)
  zip.file(`labor-edu-forge/${name}`, fs.readFileSync(name))
}
const output = path.resolve('output', `labor-edu-forge-source-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`)
fs.mkdirSync(path.dirname(output), {recursive:true})
fs.writeFileSync(output, await zip.generateAsync({type:'nodebuffer', compression:'DEFLATE'}), {flag:'wx'})
console.log(`Source archive (no Git metadata, local data or dependencies): ${output}`)
