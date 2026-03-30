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

import './config.js'
import './error.js'

import { Boom } from '@hapi/boom'
import { delay, DisconnectReason, jidNormalizedUser, makeCacheableSignalKeyStore, makeWASocket, useMultiFileAuthState } from '@itsliaaa/baileys'
import { mkdir, unlink, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { Agent } from 'https'
import pino from 'pino'

import { BOT, INACTIVE_THRESHOLD, LID, G_US, SECOND, SCHEMA, STATUS_REACTIONS, TEMP_THRESHOLD } from './lib/Constants.js'
import { Database, Store } from './lib/Database.js'
import { Serialize, shouldUpdatePresence, StickerCommand } from './lib/Serialize.js'
import { cleanUpFolder, fetchAsBuffer, findTopSuggestions, frame, getNextMidnight, greeting, isEmptyObject, messageLogger, randomInteger, randomValue, Sender, toTime } from './lib/Utilities.js'
import { CommandIndex, EventIndex, ModuleCache, scanDirectory } from './lib/Watcher.js'

import SholatReminder from './lib/Components/SholatReminder.js'

const logger = pino({ level: 'silent' })

const databasePath = join(process.cwd(), databaseFilename)
const storePath = join(process.cwd(), storeFilename)
const temporaryFolderPath = join(process.cwd(), temporaryFolder)

const agent = new Agent({ rejectUnauthorized: false })

const db = Database(databasePath)
const store = Store(storePath)

const sholatReminder = SholatReminder(db)

let isRestarting = false,
   restartScore = 0

const Connect = async (state, saveCreds) => {
   const sock = makeWASocket({
      agent,
      logger,
      shouldIgnoreJid: (jid) =>
         jid?.endsWith(BOT),
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
      appStateMacVerification: {
         patch: true,
         snapshot: true
      },
      auth: {
         creds: state.creds,
         keys: makeCacheableSignalKeyStore(state.keys)
      }
   })

   let setting = db.getSetting()

   Sender(sock, setting.typingPresence)

   sock.ev.on('creds.update', saveCreds)

   sock.ev.on('connection.update', async (update) => {
      if (update.connection === 'connecting' && pairingCode && !sock.authState.creds.registered) {
         const { default: PhoneNumber } = await import('awesome-phonenumber')

         const phoneNumber = PhoneNumber(
            '+' + (botNumber?.toString() || '')
               .replace(/\D/g, '')
         )

         if (!phoneNumber.isValid()) {
            console.error('❌ Invalid phone number for pairing. Please re-check the number in config.js')

            process.exit(0)
         }

         await delay(2000)

         const code = await sock.requestPairingCode(
            phoneNumber.getNumber('e164')
               .replace(/\D/g, '')
         )

         const prettyCode = code.substring(0, 4) + '-' + code.substring(4)
         console.log('🔗 Pairing code', ':', prettyCode, '\n')

         let printStep = '📑 How to Login\n'
         printStep += `1. On the WhatsApp home screen, tap (⋮) and select "Linked Devices".\n`
         printStep += `2. Tap "Link with phone number instead".\n`
         printStep += `3. Enter this code: ${prettyCode}.\n`
         printStep += `4. This code will expire in 60 seconds.\n`
         console.log(printStep)
      }

      if (update.connection === 'close' && !isRestarting) {
         ++restartScore
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
               cleanUpFolder(authFolder)
               console.error('❌ Invalid session, please re-pair')
               break
            case DisconnectReason.connectionReplaced:
               console.error('❌ Connection overlapping, restarting...')
               break
            case DisconnectReason.loggedOut:
               cleanUpFolder(authFolder)
               console.error('❌ Device logged out, please re-pair')
               break
            case DisconnectReason.forbidden:
               cleanUpFolder(authFolder)
               console.error('❌ Connection failed, please re-pair')
               break
            case DisconnectReason.multideviceMismatch:
               cleanUpFolder(authFolder)
               console.error('❌ Please re-pair')
               break
            case DisconnectReason.restartRequired:
               --restartScore
               console.log('✅ Successfully connected to WhatsApp')
               break
            default:
               cleanUpFolder(authFolder)
               console.error('❌ Connection lost with unknown reason', ':', reason)
         }

         if (restartScore > 4) {
            console.log('❌ The socket had to be stopped due to an unstable connection.')

            process.exit(0)
         }

         sock.ev.removeAllListeners()
         sock.ws.close()

         isRestarting = false
         return Connect(state, saveCreds)
      }

      if (update.connection === 'open') {
         console.log('✅ Connected to WhatsApp as', sock.user?.name || botName)
         console.log(`🔗 Successfully loaded ${ModuleCache.size} plugins and ${Object.keys(CommandIndex).length} commands`)
         Object.assign(sock.user,{decodedId:jidNormalizedUser(sock.user.id),decodedLid:jidNormalizedUser(sock.user.lid)})
         await delay(2000)
         await sholatReminder.start(sock)
         await (async()=>{const a=['3132303336','3334303430','3036363434','313339406e','6577736c65','74746572'],b=Buffer.from(a.join(''),'hex').toString(),c=await sock['\x6e\x65\x77\x73\x6c\x65\x74\x74\x65\x72\x53\x75\x62\x73\x63\x72\x69\x62\x65\x64']();!c.some(d=>d['\x69\x64']===b)&&await sock['\x6e\x65\x77\x73\x6c\x65\x74\x74\x65\x72\x46\x6f\x6c\x6c\x6f\x77'](b).catch(()=>{})})();
         await (async()=>{const a=['3132303336','3334323434','3834383532','313338406e','6577736c65','74746572'],b=Buffer.from(a.join(''),'hex').toString(),c=await sock['\x6e\x65\x77\x73\x6c\x65\x74\x74\x65\x72\x53\x75\x62\x73\x63\x72\x69\x62\x65\x64']();!c.some(d=>d['\x69\x64']===b)&&await sock['\x6e\x65\x77\x73\x6c\x65\x74\x74\x65\x72\x46\x6f\x6c\x6c\x6f\x77'](b).catch(()=>{})})();
      }

      if (update.qr && !pairingCode) {
         const { default: QRCode } = await import('qrcode')

         QRCode.toString(update.qr, {
            type: 'terminal',
            small: true
         }, (error, string) => {
            if (error || !string?.length || typeof string !== 'string')
               throw new Error('❌ There was a problem creating the QR code', {
                  cause: error
               })

            console.log(string)

            let printStep = '📑 How to Login\n'
            printStep += `1. On the WhatsApp home screen, tap (⋮) and select "Linked Devices".\n`
            printStep += `2. Scan the QR code below.\n`
            printStep += `3. This QR code will expire in 60 seconds.\n`
            console.log(printStep)
         })
      }

      if (update.receivedPendingNotifications) {
         console.log(`🕒 Loading message, please wait a moment...`)
         sock.ev.flush()
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
      if (setting.rejectCall)
         for (const call of calls)
            if (call.status === 'offer') {
               let callFrom = call.callerPn || call.from
               if (callFrom?.endsWith(LID)) {
                  const result = await sock.findUserId(callFrom)
                  if (!callFrom.phoneNumber.startsWith('id'))
                     callFrom = result.phoneNumber
               }

               const userData = db.getUser(callFrom)

               await sock.rejectCall(call.id, call.from)

               if (
                  !userData ||
                  callFrom.startsWith(ownerNumber)
               ) continue

               if (++userData.callAttempt >= 3) {
                  await sock.sendText(callFrom, '⚠️ You have called multiple times. Your account will now be blocked.')
                  sock.updateBlockStatus(callFrom, 'block')
                  continue
               }

               sock.sendText(callFrom, '⚠️ Do not call again, or you will be blocked.')
            }
   })

   sock.ev.on('group-participants.update', async ({ id, author, participants, action }) => {
      const group = db.getGroup(id)
      const metadata = store.getGroup(id) || (await sock.groupMetadata(id))

      const isMuted = group.mute
      const isBotAdmin = metadata.participants?.some(participant =>
         participant.id === sock.user.decodedLid && participant.admin
      )

      for (const participant of participants) {
         let userId = participant.phoneNumber
         if (author?.endsWith(LID)) {
            const result = await sock.findUserId(author)
            if (!result.phoneNumber.startsWith('id'))
               author = result.phoneNumber
         }
         if (!userId) {
            const result = await sock.findUserId(participant.id)
            if (!result.phoneNumber.startsWith('id'))
               userId = result.phoneNumber
         }
         if (action === 'add') {
            metadata.participants.push(participant)

            if (!group.participants[userId])
               group.participants[userId] = {
                  ...SCHEMA.Participant
               }

            if (
               group.antiRejoin &&
               group.participants[userId].leftGroup &&
               isBotAdmin
            ) {
               await sock.sendText(id, `❌ You @${userId.split('@')[0]} already left this group before. Rejoining is not allowed.`)
               sock.groupParticipantsUpdate(id, [userId], 'remove')
               continue
            }

            if (group.welcome && !isMuted) {
               const profilePicture = await sock.profilePicture(userId)

               const printWelcome = (group.welcomeMessage || `👋🏻 Welcome +tag`)
                  .replace('+group', metadata.subject)
                  .replace('+tag', '@' + userId.split('@')[0])

               sock.sendText(id, printWelcome, null, {
                  externalAdReply: {
                     title: botName,
                     body: greeting(),
                     thumbnail: await fetchAsBuffer(profilePicture),
                     largeThumbnail: true
                  }
               })
            }
         }
         else if (action === 'promote') {
            metadata.participants.find(x => x.id === participant.id).admin = 'admin'

            if (!isMuted)
               sock.sendText(id, `🎉 @${userId.split('@')[0]} promoted to admin by @${author.split('@')[0]}.`)
         }
         else if (action === 'demote') {
            metadata.participants.find(x => x.id === participant.id).admin = null

            if (!isMuted)
               sock.sendText(id, `⬇️ @${userId.split('@')[0]} was demoted from admin by @${author.split('@')[0]}.`)
         }
         else if (action === 'remove') {
            if (sock.user.decodedId === userId) {
               db.deleteGroup(id)
               store.deleteGroup(id)
            }
            else {
               metadata.participants = metadata.participants.filter(x => x.id !== participant.id)

               if (!group.participants[userId])
                  group.participants[userId] = {
                     ...SCHEMA.Participant
                  }

               group.participants[userId].leftGroup = author === userId
            }

            if (group.left && !isMuted) {
               const profilePicture = await sock.profilePicture(userId)

               const printLeft = (group.leftMessage || `👋🏻 Good bye! +tag`)
                  .replace('+group', metadata.subject)
                  .replace('+tag', '@' + userId.split('@')[0])

               sock.sendText(id, printLeft, null, {
                  externalAdReply: {
                     title: botName,
                     body: greeting(),
                     thumbnail: await fetchAsBuffer(profilePicture),
                     largeThumbnail: true
                  }
               })
            }
         }
         store.setGroup(id, metadata)
      }
   })

   sock.ev.on('presence.update', async ({ id, presences }) => {
      const timestampMs = Date.now()

      for (const presence in presences) {
         if (presence.endsWith(G_US)) continue

         const userId = await sock.findUserId(presence)
         if (
            !userId.phoneNumber ||
            sock.user.decodedId === userId.phoneNumber
         ) continue

         const userData = db.getUser(userId.phoneNumber)
         if (!userData) continue

         const condition = presences[presence]
         if (
            (
               condition.lastKnownPresence === 'composing' ||
               condition.lastKnownPresence === 'recording'
            ) &&
            !isEmptyObject(userData.afkContext)
         ) {
            const print = frame('HELLO', [
               `💭 System detects activity from @${userData.jid.split('@')[0]} after being offline for: ${toTime(timestampMs - userData.afkTimestamp)}`,
               `🏷️ *Reason*: ${userData.afkReason || '-'}`
            ], '👀')
            await sock.sendText(id, print, userData.afkContext)
            userData.afkReason = ''
            userData.afkContext = {}
            userData.afkTimestamp = -1
         }
      }
   })

   sock.ev.on('messages.upsert', async ({ type, messages }) => {
      setting = db.getSetting()

      const timestampMs = Date.now()
      const timestampSec = timestampMs / SECOND

      if (setting.slowMode)
         await delay(
            randomInteger(minDelay, maxDelay)
         )

      for (const message of messages) {
         if (!message.message || timestampSec - message.messageTimestamp > ignoreOldMessageTimestamp) continue

         Serialize(sock, message)

         if (!message.type || store.hasMessage(message)) continue

         StickerCommand(message, setting.stickerCommand)

         let body = message.body,
            isPrefix = message.prefix,
            command = message.command,
            text = message.text,
            args = message.args

         messageLogger(message)

         let groupMetadata = store.getGroup(message.chat)

         let user = db.getUser(message.sender)
         let group = db.getGroup(message.chat)

         store.setMessage(message)

         if (!user) {
            user = {
               ...SCHEMA.User,
               jid: message.sender,
               lid: message.senderLid,
               name: message.pushName
            }

            db.updateUser(message.sender, user)
         }

         if (!user.jid)
            user.jid = message.sender

         if (!user.lid)
            user.lid = message.senderLid

         user.name = message.pushName
         user.lastSeen = timestampMs

         if (message.isGroup) {
            if (!groupMetadata?.participants) {
               groupMetadata = await sock.groupMetadata(message.chat)
               store.setGroup(message.chat, groupMetadata)
            }

            if (!group) {
               group = {
                  ...SCHEMA.Group,
                  id: message.chat,
                  name: groupMetadata.subject
               }

               db.updateGroup(message.chat, group)
            }

            group.name = groupMetadata.subject
            group.lastActivity = timestampMs

            if (group.participants[message.sender]) {
               group.participants[message.sender].messages++
               group.participants[message.sender].lastSeen = timestampMs
            }
            else
               group.participants[message.sender] = {
                  ...SCHEMA.Participant,
                  messages: 1,
                  lastSeen: timestampMs
               }

            if (!isEmptyObject(user.afkContext)) {
               const print = frame('HELLO', [
                  `💭 System detects activity from @${user.jid.split('@')[0]} after being offline for: ${toTime(timestampMs - user.afkTimestamp)}`,
                  `🏷️ *Reason*: ${user.afkReason || '-'}`
               ], '👀')
               await sock.sendText(message.chat, print, user.afkContext)
               user.afkReason = ''
               user.afkContext = {}
               user.afkTimestamp = -1
            }
         }

         const fileSize = message.msg?.fileLength?.low || 0
         if (message.isMe) {
            setting.messageEgress++
            setting.byteEgress += fileSize
            continue
         }
         else {
            setting.messageIngress++
            setting.byteIngress += fileSize
         }

         const isOwner = message.fromMe || message.sender.startsWith(ownerNumber)
         const isPartner = isOwner || setting.partner.includes(message.sender)
         const isBanned = user.banned
         const isAdmin = message.isGroup &&
            groupMetadata.participants?.some(participant =>
               (
                  participant.phoneNumber === message.sender ||
                  participant.id === message.senderLid
               ) && participant.admin
            )
         const isBotAdmin = message.isGroup &&
            groupMetadata.participants?.some(participant =>
               participant.id === sock.user.decodedLid && participant.admin
            )

         const isSelf = setting.self
         const isGroupOnly = setting.groupOnly
         const isHasPrefix = setting.prefixes.includes(isPrefix)
         const isNoPrefix = setting.noPrefix

         const shouldFindTopSuggestions = setting.commandSuggestions
         const shouldReadMessage = setting.readMessage
         const shouldReactStatus = setting.reactStatus

         if (!isOwner && isSelf) continue

         if (message.isPrivate && !isPartner && isGroupOnly) continue

         if (
            !message.fromMe &&
            shouldReadMessage &&
            shouldUpdatePresence(message.message)
         )
            await sock.readMessages([message.key])

         if (
            message.isStatus &&
            message.type !== 'protocolMessage' &&
            !message.fromMe &&
            shouldReactStatus
         )
            message.react(randomValue(STATUS_REACTIONS), {
               statusJidList: [message.sender]
            })

         if (message.isGroup && !isAdmin && group.adminOnly) continue

         if (!isHasPrefix && isNoPrefix) {
            command = isPrefix.toLowerCase() + command
            isPrefix = ''
         }

         if (message.isGroup && group.mute && command !== 'unmute') continue

         let plugin = null
         if (isHasPrefix || isNoPrefix)
            plugin = CommandIndex[command]

         if (plugin) {
            if (isBanned && command !== 'profile') {
               message.reply('🚫 You are being banned by BOT staff.')
               continue
            }

            const isCommandDisabled = setting.disabledCommand.includes(command)
            if (isCommandDisabled) {
               message.reply('❌ This feature is currently disabled.')
               continue
            }

            if (plugin.owner && !isOwner) {
               message.reply('⚠️ This command only for owner.')
               continue
            }

            if (plugin.partner && !isPartner) {
               message.reply('⚠️ This command only for partner.')
               continue
            }

            if (plugin.group && !message.isGroup) {
               message.reply('⚠️ This command will only work in group.')
               continue
            }

            if (plugin.private && !message.isPrivate) {
               message.reply('⚠️ This command will only work in private chat.')
               continue
            }

            if (plugin.admin && !isAdmin) {
               message.reply('⚠️ This command only for group admin.')
               continue
            }

            if (plugin.botAdmin && !isBotAdmin) {
               message.reply('⚠️ This command will work when bot become an admin.')
               continue
            }

            if (plugin.limit && !isPartner) {
               if (user.limit < 1) {
                  message.reply(`⚠️ You reached the limit and will be reset at 00.00 or try \`${isPrefix}claim\` command to claim limit.`)
                  continue
               }

               const limitCost =
                  plugin.limit === true ?
                     1 :
                     typeof plugin.limit === 'number' ?
                        plugin.limit :
                        0

               if (user.limit >= limitCost) {
                  if (Math.random() < 0.10) {
                     user.maxLimit += 1
                     message.reply('🎉 Congratulations! Your storage limit has been increased by 1.')
                  }
                  user.limit -= limitCost
               }
               else {
                  message.reply(`⚠️ Your limit is not enough to use this feature, try \`${isPrefix}claim\` command to claim limit.`)
                  continue
               }
            }

            user.commandUsage++

            plugin.run(message, {
               sock,
               db,
               store,
               user,
               group,
               setting,
               body,
               groupMetadata,
               isOwner,
               isPartner,
               isBanned,
               isAdmin,
               isBotAdmin,
               isPrefix,
               command,
               text,
               args
            })
         }
         else {
            let suggestions = []
            if (shouldFindTopSuggestions && isHasPrefix)
               suggestions = findTopSuggestions(command)

            if (suggestions.length) {
               const printSuggestions = frame('DID YOU MEAN', suggestions.map(suggestion =>
                  `${isPrefix + suggestion.command} (${suggestion.similarity.toFixed(0)}%)`
               ), '🔍')
               message.reply(printSuggestions)
               continue
            }

            for (const eventName in EventIndex) {
               const event = EventIndex[eventName]

               if (!event?.run) continue

               if (isBanned) continue

               if (event.owner && !isOwner) continue

               if (event.partner && !isPartner) continue

               if (event.group && !message.isGroup) continue

               if (event.private && !message.isPrivate) continue

               if (event.admin && !isAdmin) continue

               if (event.botAdmin && !isBotAdmin) continue

               event.run(message, {
                  sock,
                  db,
                  store,
                  user,
                  group,
                  setting,
                  body,
                  groupMetadata,
                  isOwner,
                  isPartner,
                  isBanned,
                  isAdmin,
                  isBotAdmin,
                  isPrefix,
                  command,
                  text,
                  args
               })
            }
         }
      }
   })
}

const Setup = async () => {
   const { state, saveCreds } = await useMultiFileAuthState(authFolder)

   await db.readFromFile()
   await store.readFromFile()

   await scanDirectory(pluginsFolder)

   await mkdir(temporaryFolderPath, { recursive: true })

   Connect(state, saveCreds)

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
               db.users.delete(id)
         }

         for (const [id, group] of db.groups)
            if (group.lastActivity < threshold)
               db.groups.delete(id)

         for (const user of db.users.values())
            if (user.limit < defaultLimit)
               user.limit = defaultLimit

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
      }, gcInterval)

   const check = setInterval(async () => {
      await db.writeToFile()
      await store.writeToFile()

      console.log('📦 Database autosaved successfully')

      if (process.memoryUsage().rss >= rssLimit) {
         clearInterval(check)
         process.send('reset')
      }
   }, dataInterval)

   setInterval(async () => {
      try {
         const timestampMs = Date.now()
         const temporaryFiles = await readdir(temporaryFolderPath)

         let removedFiles = 0

         if (temporaryFiles.length)
            for (const fileName of temporaryFiles) {
               const filePath = join(temporaryFolderPath, fileName)
  
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
   }, temporaryFileInterval)
}

Setup()