import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { serverProjectRoot } from './paths.js'

function loadEnvFile(filename: string) {
  const filePath = path.join(serverProjectRoot, filename)

  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, quiet: true })
  }
}

// Existing process variables win; local configuration wins over the fallback file.
loadEnvFile('.env.local')
loadEnvFile('.env')
