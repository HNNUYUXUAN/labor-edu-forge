import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../server/src/app.js'
import { lessonTemplates } from '../server/src/data/templates.js'

afterEach(() => vi.unstubAllEnvs())

describe('local API privacy boundary', () => {
  it('rejects foreign origins and DNS rebinding before invoking the model', async () => {
    const generateContent = vi.fn()
    const app = createApp({ generateContent })
    for (const headers of [{ Origin: 'https://example.org' }, { Origin: 'null' }, { Host: 'attacker.example' }, { 'Sec-Fetch-Site': 'cross-site' }]) {
      await request(app).post('/api/projects').set(headers).send(lessonTemplates[0].input).expect(403)
    }
    expect(generateContent).not.toHaveBeenCalled()
    await request(app).get('/api/projects').set('Origin', 'https://example.org').expect(403)
  })

  it('accepts the local UI and disables caching of project responses', async () => {
    const response = await request(createApp()).get('/api/templates').set('Origin', 'http://localhost:5173').expect(200)
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    expect(response.headers['cache-control']).toBe('no-store')
  })

  it('does not echo credentials or workspace configuration in health and provider errors', async () => {
    const secret = 'private-test-credential-value'
    vi.stubEnv('DASHSCOPE_API_KEY', secret)
    vi.stubEnv('DASHSCOPE_BASE_URL', 'https://private-workspace.example/v1')
    const app = createApp({ generateContent: async () => { throw new Error(secret) } })
    const health = await request(app).get('/api/health').expect(200)
    expect(health.body.providerReady).toBe(true)
    const failure = await request(app).post('/api/projects').send(lessonTemplates[0].input).expect(502)
    for (const response of [health, failure]) {
      expect(response.text).not.toContain(secret)
      expect(response.text).not.toContain('private-workspace')
    }
  })

  it('does not echo malformed JSON or stack traces', async () => {
    const response = await request(createApp()).post('/api/projects').set('Content-Type', 'application/json').send('{"private-data":"do-not-echo"').expect(400)
    expect(response.body.error).toBe('INVALID_REQUEST')
    expect(response.text).not.toMatch(/do-not-echo|SyntaxError|node_modules|stack/)
  })
})
