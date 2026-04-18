import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const BOT = process.env.BOT || '6281234567890@s.whatsapp.net'
export const BOT_NAME = process.env.BOT_NAME || 'Starseed'
export const SESSION_ID = process.env.SESSION_ID || null
export const PAIRING_CODE = process.env.PAIRING_CODE === 'true' || false
export const BOT_NUMBER = process.env.BOT_NUMBER || null

export const PREFIX = process.env.PREFIX || '.'
export const DEFAULT_LIMIT = parseInt(process.env.DEFAULT_LIMIT) || 50
export const GC_INTERVAL = parseInt(process.env.GC_INTERVAL) || 300000
export const DATA_INTERVAL = parseInt(process.env.DATA_INTERVAL) || 60000
export const RSS_LIMIT = parseInt(process.env.RSS_LIMIT) || 500
export const TEMP_THRESHOLD = parseInt(process.env.TEMP_THRESHOLD) || 60000
export const INACTIVE_THRESHOLD = parseInt(process.env.INACTIVE_THRESHOLD) || 86400000

export const AUTH_FOLDER = process.env.AUTH_FOLDER || 'auth'
export const DATABASE_FILENAME = process.env.DATABASE_FILENAME || 'database.json'
export const STORE_FILENAME = process.env.STORE_FILENAME || 'store.json'
export const TEMPORARY_FOLDER = process.env.TEMPORARY_FOLDER || 'temporary'
export const PLUGINS_FOLDER = process.env.PLUGINS_FOLDER || 'plugins'
