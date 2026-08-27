import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

export const serverProjectRoot = path.resolve(currentDir, '..', '..')
export const serverDataDir = path.join(serverProjectRoot, 'data')
