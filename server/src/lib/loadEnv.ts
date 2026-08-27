import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { serverProjectRoot } from './paths.js'

function loadEnvFile(filename: string, override = false) {
  const filePath = path.join(serverProjectRoot, filename)

  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override })
  }
}

loadEnvFile('.env')
loadEnvFile('.env.local', true)
