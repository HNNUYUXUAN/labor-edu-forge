import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { parse } from 'dotenv'

const root = process.cwd()
const allObjects = process.argv.includes('--all-objects')
const allRefs = allObjects || process.argv.includes('--all-refs')
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] })
const findings = new Set()
const secrets = new Set()
const report = (source, rule) => findings.add(`${source}: ${rule}`)
const privatePath = name => /(^|\/)\.env(?:\.|$)/.test(name) && !name.endsWith('/.env.example') && name !== '.env.example'
  || /(^|\/)(?:data|backups|exports|artifacts|output|test-results|playwright-report|\.playwright-cli)\//.test(name) && !name.endsWith('/.gitkeep') && !name.startsWith('server/src/data/')
  || /\.(?:pem|key|p12|pfx|sqlite\w*|db|bak|zip|docx)$/i.test(name)

// Compare local credentials in memory only. Never log a matched value or source line.
for (const dir of [root, path.join(root, 'server'), path.join(root, 'client')]) {
  for (const name of fs.readdirSync(dir).filter(name => /^\.env(?:\.|$)/.test(name) && name !== '.env.example')) {
    const file = path.join(dir, name)
    if (!fs.statSync(file).isFile()) continue
    for (const [key, value] of Object.entries(parse(fs.readFileSync(file)))) {
      if ((/key|secret|token|password/i.test(key) || /llm-[a-z0-9]+\./i.test(value)) && value.length >= 12) secrets.add(value)
    }
  }
}
if (process.env.DASHSCOPE_API_KEY?.length >= 12) secrets.add(process.env.DASHSCOPE_API_KEY)

const rules = [
  ['provider/token pattern', /\b(?:sk-[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/],
  ['private key block', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['private workspace endpoint', /llm-[a-z0-9]{8,}\.[a-z0-9-]+\.maas\.aliyuncs\.com/i],
  ['nonempty credential assignment', /^[ \t]*(?:export[ \t]+)?(?:DASHSCOPE_API_KEY|OPENAI_API_KEY|AWS_SECRET_ACCESS_KEY|GITHUB_TOKEN)[ \t]*=[ \t]*[^\s#\r\n][^\r\n]*/m],
]
function scan(buffer, source) {
  for (const secret of secrets) if (buffer.includes(Buffer.from(secret))) report(source, 'matches local private configuration')
  const text = buffer.toString('utf8')
  for (const [rule, pattern] of rules) {
    const match = pattern.exec(text)
    if (match) report(`${source}:${text.slice(0, match.index).split('\n').length}`, rule)
  }
}
function checkPath(name, source) { if (privatePath(name)) report(source, 'private/generated file is publishable') }

try {
  const files = [...new Set(git('ls-files', '--cached', '--others', '--exclude-standard', '-z').toString().split('\0').filter(Boolean))]
  for (const name of files) {
    checkPath(name, `worktree/${name}`)
    const full = path.join(root, name)
    if (fs.existsSync(full) && fs.statSync(full).isFile()) scan(fs.readFileSync(full), `worktree/${name}`)
  }
  const blobs = new Map()
  for (const entry of git('ls-files', '--stage', '-z').toString().split('\0').filter(Boolean)) {
    const [meta, name] = entry.split('\t')
    checkPath(name, `index/${name}`)
    blobs.set(meta.split(' ')[1], `index/${name}`)
  }
  // Default: release branch history. --all-refs additionally audits other branches/tags/internal refs.
  const objects = git('rev-list', '--objects', ...(allRefs ? ['--all', ...(allObjects ? ['--reflog'] : [])] : ['HEAD'])).toString().trim().split('\n').filter(Boolean)
  const types = execFileSync('git', ['cat-file', '--batch-check=%(objectname) %(objecttype)'], {cwd: root, input: objects.map(x => x.split(' ')[0]).join('\n')+'\n', encoding:'utf8'}).trim().split('\n')
  let objectIndex = 0
  for (const object of objects) {
    const type = types[objectIndex++].split(' ')[1]
    const split = object.indexOf(' ')
    if (split < 0) continue
    const sha = object.slice(0, split), name = object.slice(split + 1)
    if (type !== 'blob') continue
    checkPath(name, `history/${sha.slice(0, 8)}/${name}`)
    if (!blobs.has(sha)) blobs.set(sha, `history/${sha.slice(0, 8)}/${name}`)
  }
  // Include unreachable and packed objects after a history cleanup. Commit/tag
  // messages can contain credentials too; never print their raw contents.
  const metadata = new Map()
  const inventory = allObjects
    ? git('cat-file', '--batch-all-objects', '--batch-check=%(objectname) %(objecttype)').toString().trim().split('\n')
    : types
  for (const entry of inventory) {
    const [sha, type] = entry.split(' ')
    if (allObjects && type === 'blob' && !blobs.has(sha)) blobs.set(sha, `object/${sha.slice(0, 8)}`)
    if (type === 'commit' || type === 'tag') metadata.set(sha, `${type}/${sha.slice(0, 8)}`)
  }
  const scanned = new Map([...blobs, ...metadata])
  const contents = execFileSync('git', ['cat-file', '--batch'], { cwd: root, input: [...scanned.keys()].join('\n')+'\n', maxBuffer: 256*1024*1024 })
  let offset = 0
  for (const source of scanned.values()) {
    const end = contents.indexOf(10, offset)
    const size = Number(contents.subarray(offset, end).toString().split(' ')[2])
    if (!Number.isFinite(size)) throw new Error('Unreadable Git object')
    scan(contents.subarray(end+1, end+1+size), source)
    offset = end+size+2
  }
  const bundle = path.join(root, 'client/dist')
  let bundles = 0
  const walk = dir => {
    for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, file.name)
      if (file.isDirectory()) walk(full)
      else if (/\.(?:js|css|html|json|map)$/.test(file.name)) { scan(fs.readFileSync(full), `bundle/${path.relative(bundle, full)}`); bundles++ }
    }
  }
  if (fs.existsSync(bundle)) walk(bundle)
  console.log(`Scope: ${allObjects ? 'all Git objects (including reflogs and unreachable objects)' : allRefs ? 'all refs' : 'HEAD release branch'}; scanned ${files.length} publishable files, ${blobs.size} Git blobs, ${metadata.size} commit/tag objects, ${bundles} browser bundles.`)
  if (!bundles) console.log('Browser bundle absent: run npm run build, then rerun security:check before release.')
  if (findings.size) {
    for (const finding of findings) console.error(finding)
    process.exitCode = 1
  } else console.log('No configured-secret, token-pattern or private-file findings. Heuristic checks do not replace review.')
} catch {
  console.error('Security scan could not complete. Check Git availability, repository access and file permissions; no raw error output was printed.')
  process.exitCode = 1
}
