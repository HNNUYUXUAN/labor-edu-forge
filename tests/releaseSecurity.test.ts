import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
describe('release safeguards', () => {
  it('ignores environment variants, nested generated data and report artifacts', () => {
    const privateFiles = ['server/.env.production', 'client/.env.development.local', 'server/data/backup/snapshot.json', 'server/server/data/projects.json', '.playwright-cli/snapshot.yml', 'exports/lesson.zip']
    for (const name of privateFiles) {
      const result = spawnSync('git', ['check-ignore', '--no-index', name], {cwd:root})
      expect(result.status, `${name}: ${result.stderr.toString()}`).toBe(0)
    }
    expect(spawnSync('git', ['check-ignore', '--no-index', 'server/.env.example'], {cwd:root}).status).toBe(1)
  })

  it('detects a removed historical credential without printing its value', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'labor-edu-security-'))
    const git = (...args: string[]) => execFileSync('git', args, {cwd:dir, stdio:'pipe'})
    const commit = () => {git('add', '.');git('-c','user.name=Security Test','-c','user.email=test@example.invalid','commit','-qm','synthetic fixture')}
    const synthetic = 'sk-' + '0'.repeat(32)
    try {
      mkdirSync(path.join(dir, 'server')); mkdirSync(path.join(dir, 'client'))
      git('init','-q')
      writeFileSync(path.join(dir,'server/.env.example'), `DASHSCOPE_API_KEY=${synthetic}\n`)
      commit()
      writeFileSync(path.join(dir,'server/.env.example'), 'DASHSCOPE_API_KEY=\nQWEN_TEXT_MODEL=example\n')
      commit()
      const result = spawnSync(process.execPath, [path.join(root,'scripts/security-check.mjs')], {cwd:dir,encoding:'utf8'})
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('history/')
      expect(result.stderr).toContain('provider/token pattern')
      expect(result.stderr+result.stdout).not.toContain(synthetic)
    } finally { rmSync(dir, {recursive:true,force:true}) }
  })

  it('keeps the public environment template credential empty', () => {
    expect(readFileSync(path.join(root,'server/.env.example'),'utf8')).toMatch(/^DASHSCOPE_API_KEY=\r?$/m)
  })

  it('finds unreachable credentials and commit-message secrets without disclosing them', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'labor-edu-security-'))
    const git = (...args: string[]) => execFileSync('git', args, {cwd:dir, stdio:'pipe'})
    const synthetic = 'sk-' + '1'.repeat(32)
    try {
      mkdirSync(path.join(dir, 'server')); mkdirSync(path.join(dir, 'client'))
      git('init', '-q')
      writeFileSync(path.join(dir, 'README.md'), 'Synthetic repository\n')
      git('add', '.')
      git('-c', 'user.name=Security Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'synthetic fixture')
      execFileSync('git', ['hash-object', '-w', '--stdin'], {cwd:dir,input:synthetic,stdio:['pipe','pipe','pipe']})
      const scoped = spawnSync(process.execPath, [path.join(root,'scripts/security-check.mjs')], {cwd:dir,encoding:'utf8'})
      expect(scoped.status).toBe(0)
      const all = spawnSync(process.execPath, [path.join(root,'scripts/security-check.mjs'), '--all-objects'], {cwd:dir,encoding:'utf8'})
      expect(all.status).toBe(1)
      expect(all.stderr).toContain('object/')
      expect(all.stderr+all.stdout).not.toContain(synthetic)
      git('-c', 'user.name=Security Test', '-c', 'user.email=test@example.invalid', 'commit', '--allow-empty', '-qm', synthetic)
      const metadata = spawnSync(process.execPath, [path.join(root,'scripts/security-check.mjs')], {cwd:dir,encoding:'utf8'})
      expect(metadata.status).toBe(1)
      expect(metadata.stderr).toContain('commit/')
      expect(metadata.stderr+metadata.stdout).not.toContain(synthetic)
    } finally { rmSync(dir, {recursive:true,force:true}) }
  })
})
