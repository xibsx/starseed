/**
 * This file is part of the Starseed Bot WhatsApp project, solely developed and maintained by Lia Wynn.
 * https://github.com/itsliaaa/starseed
 *
 * All rights reserved.
 *
 * - You are NOT allowed to copy, rewrite, modify, redistribute, or reuse this file in any form.
 * - You are NOT allowed to claim this file or any part of this project as your own.
 * - This credit notice must NOT be removed or altered.
 * - This file may ONLY be used within the Starseed project.
 */

import './lib/Components/ErrorHandler.js'
import './lib/Components/Dispatcher.js'

import { Boom } from '@hapi/boom'
import { delay, DisconnectReason, jidNormalizedUser, makeCacheableSignalKeyStore, makeWASocket, useMultiFileAuthState } from '@itsliaaa/baileys'
import { mkdir, unlink, readdir, stat, writeFile, readFile } from 'fs/promises'
import { join } from 'path'
import pino from 'pino'
import { File } from 'megajs'

import { 
   BOT, INACTIVE_THRESHOLD, TEMP_THRESHOLD, SESSION_ID, AUTH_FOLDER,
   DATABASE_FILENAME, STORE_FILENAME, TEMPORARY_FOLDER, PLUGINS_FOLDER,
   DEFAULT_LIMIT, GC_INTERVAL, DATA_INTERVAL, RSS_LIMIT, BOT_NAME,
   PAIRING_CODE, BOT_NUMBER
} from './config.js'
import { cleanUpFolder, getNextMidnight, toTime } from './lib/Utilities.js'
import { CommandIndex, ModuleCache, scanDirectory } from './lib/Watcher.js'
import Listener from './lib/Listener.js'
import SholatReminder from './lib/Components/SholatReminder.js'

const DATABASE_PATH = join(process.cwd(), DATABASE_FILENAME)
const STORE_PATH = join(process.cwd(), STORE_FILENAME)
const TEMPORARY_FOLDER_PATH = join(process.cwd(), TEMPORARY_FOLDER)

const db = Database(DATABASE_PATH)
const store = Store(STORE_PATH)

const logger = pino({ level: 'silent' })

const listener = Listener(db, store)
const sholatReminder = SholatReminder(db)

let isRestarting = false

// Mega session downloader
async function downloadSessionFromMega() {
   if (!SESSION_ID) {
      console.error('❌ SESSION_ID not found in environment variables')
      process.exit(0)
   }

   // Clean the session ID (remove prefixes if any)
   let megaCode = SESSION_ID
   if (SESSION_ID.includes('~')) {
      megaCode = SESSION_ID.split('~')[1]
   }
   
   const megaUrl = `https://mega.nz/file/${megaCode}`
   console.log('📥 Downloading session from Mega...')
   
   try {
      const file = File.fromURL(megaUrl)
      const stream = file.download()
      let data = Buffer.from('')
      
      for await (const chunk of stream) {
         data = Buffer.concat([data, chunk])
      }
      
      const authPath = join(process.cwd(), AUTH_FOLDER)
      await mkdir(authPath, { recursive: true })
      
      const credsPath = join(authPath, 'creds.json')
      await writeFile(credsPath, data)
      console.log('✅ Session downloaded successfully')
      return true
   } catch (error) {
      console.error('❌ Failed to download session from Mega:', error.message)
      process.exit(0)
   }
}

// Check if creds.json exists
async function checkSessionExists() {
   const credsPath = join(process.cwd(), AUTH_FOLDER, 'creds.json')
   try {
      await readFile(credsPath)
      return true
   } catch {
      return false
   }
}

const Socket = async () => {
   // Handle Mega session on startup
   if (SESSION_ID) {
      const sessionExists = await checkSessionExists()
      if (!sessionExists) {
         await downloadSessionFromMega()
      } else {
         console.log('📁 Session file already exists, using existing session')
      }
   } else {
      console.error('❌ No SESSION_ID provided')
      process.exit(0)
   }

   const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER)

   const sock = listener.bind(
      makeWASocket({
         logger,
         shouldIgnoreJid: (jid) =>
            typeof jid === 'string' && jid.endsWith(BOT),
         cachedGroupMetadata: async (jid) => {
            let metadata = store.getGroup(jid)
            if (metadata)
               return metadata
            try {
               metadata = await sock.groupMetadata(jid)
               store.setGroup(jid, metadata)
               return metadata
            }
            catch { }
         },
         getMessage: (key) =>
            store.getMessage({
               chat: key.remoteJid,
               id: key.id
            }),
         auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys)
         }
      })
   )

   sock.ev.on('creds.update', saveCreds)

   sock.ev.on('connection.update', async (update) => {
      if (update.connection === 'close' && !isRestarting) {
         isRestarting = true

         const reason = new Boom(update.lastDisconnect?.error)?.output?.statusCode
         switch (reason) {
            case DisconnectReason.connectionLost:
               console.error('❌ Connection to WhatsApp lost, restarting...')
               break
            case DisconnectReason.connectionClosed:
               console.error('❌ Connection to WhatsApp closed, restarting...')
               break
            case DisconnectReason.timedOut:
               console.error('❌ Connection timed out to WhatsApp, restarting...')
               break
            case DisconnectReason.badSession:
               await cleanUpFolder(AUTH_FOLDER)
               console.error('❌ Invalid session, please re-pair')
               break
            case DisconnectReason.connectionReplaced:
               console.error('❌ Connection overlapping, restarting...')
               break
            case DisconnectReason.loggedOut:
               await cleanUpFolder(AUTH_FOLDER)
               console.error('❌ Device logged out, please re-pair')
               break
            case DisconnectReason.forbidden:
               await cleanUpFolder(AUTH_FOLDER)
               console.error('❌ Connection failed, please re-pair')
               break
            case DisconnectReason.multideviceMismatch:
               await cleanUpFolder(AUTH_FOLDER)
               console.error('❌ Please re-pair')
               break
            case DisconnectReason.restartRequired:
               console.log('✅ Successfully connected to WhatsApp')
               break
            default:
               await cleanUpFolder(AUTH_FOLDER)
               console.error('❌ Connection lost with unknown reason', ':', reason)
         }

         listener.unbind()

         await delay(2000)

         isRestarting = false
         return Socket()
      }

      if (update.connection === 'open') {
         console.log('✅ Connected to WhatsApp as', sock.user?.name || BOT_NAME)
         console.log(`🔗 Successfully loaded ${ModuleCache.size} plugins and ${CommandIndex.size} commands`)
         Object.assign(sock.user,{decodedId:jidNormalizedUser(sock.user.id),decodedLid:jidNormalizedUser(sock.user.lid)})
         await delay(3000)
         await sholatReminder.start(sock)
      }
   })

   sock.ev.on('groups.upsert', (groups) => {
      for (const group of groups)
         store.setGroup(group.id, group)
   })

   sock.ev.on('groups.update', (groups) => {
      for (const group of groups)
         if (store.hasGroup(group.id))
            store.setGroup(
               group.id,
               Object.assign(
                  store.getGroup(group.id) || {},
                  group
               )
            )
         else
            store.setGroup(group.id, group)
   })

   sock.ev.on('call', async (calls) => {
      for (const call of calls)
         listener.call(call)
   })

   sock.ev.on('group-participants.update', async ({ id, author, participants, action }) => {
      for (const participant of participants)
         listener.participant({ id, author, participant, action })
   })

   sock.ev.on('presence.update', async ({ id, presences }) => {
      for (const presence in presences)
         listener.presence({ id, presence, presences })
   })

   sock.ev.on('messages.upsert', async ({ messages }) => {
      for (const message of messages)
         listener.message(message)
   })
}

const Setup = async () => {
   await db.readFromFile()
   await store.readFromFile()

   await scanDirectory(PLUGINS_FOLDER)

   await mkdir(TEMPORARY_FOLDER_PATH, { recursive: true })

   Socket()

   const scheduleDailyTasks = () => {
      const resetTimeout = getNextMidnight()

      setTimeout(() => {
         const timestampMs = Date.now()
         const threshold = timestampMs - INACTIVE_THRESHOLD

         const setting = db.getSetting()

         for (const [id, user] of db.users) {
            const isProtected =
               user.banned ||
               user.premiumExpiry > 0 ||
               user.limit >= 128

            if (!isProtected && user.lastSeen < threshold)
               db.deleteUser(id)
         }

         for (const [id, group] of db.groups)
            if (group.lastActivity < threshold)
               db.deleteGroup(id)

         for (const user of db.users.values())
            if (user.limit < DEFAULT_LIMIT)
               user.limit = DEFAULT_LIMIT

         setting.lastReset = timestampMs
         db.writeToFile()

         scheduleDailyTasks()
      }, resetTimeout)

      console.log('🔃 Daily tasks scheduled in', ':', toTime(resetTimeout))
   }

   scheduleDailyTasks()

   if (global.gc)
      setInterval(() => {
         global.gc()
         console.log('🧹 Garbage collector called, heap cleaned')
      }, GC_INTERVAL)

   const check = setInterval(async () => {
      await db.writeToFile()
      await store.writeToFile()

      console.log('📦 Database autosaved successfully')

      if (process.memoryUsage().rss >= RSS_LIMIT) {
         clearInterval(check)
         process.send('reset')
      }
   }, DATA_INTERVAL)

   setInterval(async () => {
      try {
         const timestampMs = Date.now()
         const temporaryFiles = await readdir(TEMPORARY_FOLDER_PATH)

         let removedFiles = 0

         if (temporaryFiles.length)
            for (const fileName of temporaryFiles) {
               const filePath = join(TEMPORARY_FOLDER_PATH, fileName)
  
               const fileStatistic = await stat(filePath)
               const fileAge = timestampMs - fileStatistic.mtimeMs

               if (fileAge > TEMP_THRESHOLD) {
                  await unlink(filePath)
                  removedFiles++
               }
            }

         console.log('🗑️ Cleaned up temp folder', ':', removedFiles, 'files removed')
      }
      catch (error) {
         console.error('❌ Failed to clean temp folder', ':', error)
      }
   }, TEMP_THRESHOLD)
}

Setup()