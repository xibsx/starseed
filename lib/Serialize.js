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

import { downloadContentFromMessage, getContentType, normalizeMessageContent } from '@itsliaaa/baileys'

import { EMPTY_PARSED, G_US, LID, ME, MINUTE, S_WHATSAPP_NET, STATUS_BROADCAST } from './Constants.js'

export const UserIdCache = new Map()

export const cachedUserId = (id, { jid, lid } = {}) => {
   const cachedId = UserIdCache.get(id)
   if (cachedId) return cachedId

   if (jid && lid)
      UserIdCache.set(id, { jid, lid })

   return null
}

export const downloadAsBuffer = async (message, type) => {
   if (!message || !(message.url || message.directPath)) return Buffer.alloc(0)

   try {
      const stream = await downloadContentFromMessage(message, type)

      const chunks = []
      for await (const chunk of stream)
         chunks.push(chunk)

      return Buffer.concat(chunks)
   }
   catch {
      return Buffer.alloc(0)
   }
}

export const extractMessageBody = (message) => {
   const msg = message.msg || message
   if (!msg)
      return ''

   return (
      msg.text ||
      msg.caption ||
      msg.name ||
      msg.selectedId ||
      msg.selectedButtonId ||
      msg.singleSelectReply?.selectedRowId ||
      (
         msg.nativeFlowResponseMessage?.paramsJson &&
         JSON.parse(msg.nativeFlowResponseMessage.paramsJson).id
      ) ||
      (
         typeof msg === 'string' && msg
      ) ||
      msg.contentText ||
      msg.body?.text ||
      ''
   )
}

export const findChatId = (key) => {
   if (key.remoteJid === STATUS_BROADCAST)
      return key.remoteJid

   let remoteJid = key.remoteJidAlt || key.remoteJid
   if (remoteJid.endsWith(LID))
      return key.senderPn || key.participantPn || key.participant

   return remoteJid
}

export const findUserJid = (sock, key) => {
   if (key.fromMe)
      return sock.user.decodedId

   let sender = key.remoteJidAlt || key.participantAlt
   if (!sender || sender.endsWith(LID))
      return key.participant || key.remoteJid

   return sender
}

export const findUserLid = (sock, key) => {
   if (key.fromMe)
      return sock.user.decodedLid

   let sender = key.participant || key.remoteJid
   if (!sender || sender.endsWith(S_WHATSAPP_NET))
      return key.participantAlt || key.remoteJidAlt

   return sender
}

export const normalizeMentionedJid = (mentionedJid) => {
   if (!mentionedJid)
      return []

   const mentionedSize = mentionedJid.length
   if (!mentionedSize)
      return mentionedJid

   let result = null

   for (let i = 0; i < mentionedSize; i++) {
      const userId = mentionedJid[i]
      const cached = cachedUserId(userId)
      const userJid = cached && cached.jid

      const normalized = userJid?.endsWith(S_WHATSAPP_NET) ? userJid : userId

      if (result) {
         result[i] = normalized
      }
      else if (normalized !== userId) {
         result = mentionedJid.slice()
         result[i] = normalized
      }
   }

   return result || mentionedJid
}

export const parseCommand = (body) => {
   if (!body) return EMPTY_PARSED

   body = body.trim()
   if (!body) return EMPTY_PARSED

   let first = body[Symbol.iterator]().next().value
   if (!first) return EMPTY_PARSED

   if (first === '\u200D' || first === '\uFE0F' || first.trim() === '') return EMPTY_PARSED

   const rest = body.slice(first.length).trim()
   if (!rest) return EMPTY_PARSED

   const spaceIndex = rest.indexOf(' ')

   if (spaceIndex === -1)
      return {
         prefix: first,
         command: rest.toLowerCase(),
         text: '',
         args: []
      }

   const command = rest.slice(0, spaceIndex).toLowerCase()
   const text = rest.slice(spaceIndex + 1)

   const args = []
   let start = 0
   for (let i = 0; i <= text.length; i++)
      if (i === text.length || text[i] === ' ') {
         if (i > start)
            args.push(
               text.slice(start, i)
            )
         start = i + 1
      }

   return {
      prefix: first,
      command, text, args
   }
}

export const shouldUpdatePresence = (message) => 
   !(
      message.encEventResponseMessage ||
      message.encReactionMessage ||
      message.pollUpdateMessage ||
      message.protocolMessage ||
      message.reactionMessage
   )

function reply(text, options = {}, extra = {}) {
   return this.sock.sendText(this.chat, text, this, options, extra)
}

function react(text = '💛', extra = {}) {
   return this.sock.sendMessage(this.chat, {
      react: {
         key: this.key,
         text
      }
   }, extra)
}

function download() {
   const messageType = this.type

   const cleanType = messageType.slice(-7) === 'Message' ?
      messageType.slice(0, -7) :
      messageType

   return downloadAsBuffer(this.msg, cleanType)
}

function downloadQuoted() {
   const messageType = this.type

   const cleanType = messageType.slice(-7) === 'Message' ?
      messageType.slice(0, -7) :
      messageType

   return downloadAsBuffer(this, cleanType)
}

export const Serialize = (sock, message) => {
   if (message.key) {
      message.id = message.key.id
      message.chat = findChatId(message.key)

      const sender = findUserJid(sock, message.key)
      const senderLid = findUserLid(sock, message.key)

      const cachedSenderId = cachedUserId(sender)
      message.sender = cachedSenderId?.jid || sender
      message.senderLid = cachedSenderId?.lid || senderLid

      const isCacheableUserId = message.sender?.endsWith(S_WHATSAPP_NET) && message.senderLid?.endsWith(LID)
      if (isCacheableUserId) {
         cachedUserId(message.sender, {
            jid: message.sender,
            lid: message.senderLid
         })

         cachedUserId(message.senderLid, {
            jid: message.sender,
            lid: message.senderLid
         })
      }

      message.fromMe = message.key.fromMe
      message.isMe = message.fromMe && message.id.includes(ME)
      message.isGroup = message.chat.endsWith(G_US)
      message.isPrivate = message.chat.endsWith(S_WHATSAPP_NET)
      message.isStatus = message.chat === STATUS_BROADCAST
   }

   let innerMessage = normalizeMessageContent(message.message)
   const editedMessage = innerMessage?.protocolMessage?.editedMessage

   if (editedMessage)
      innerMessage = normalizeMessageContent(editedMessage)

   const messageType = getContentType(innerMessage)

   message.msg = innerMessage[messageType]
   message.type = messageType
   message.body = extractMessageBody(message)

   const parsedBody = parseCommand(message.body)
   message.prefix = parsedBody.prefix
   message.command = parsedBody.command
   message.text = parsedBody.text
   message.args = parsedBody.args

   message.pushName = message.verifiedBizName || message.pushName || 'Somebody'

   const contextInfo = typeof message.msg !== 'string' ?
      message.msg?.contextInfo :
      null

   message.mentionedJid = normalizeMentionedJid(contextInfo?.mentionedJid)
   message.expiration = contextInfo?.expiration || 0
   message.quoted = contextInfo?.quotedMessage

   if (message.quoted) {
      const innerQuotedMessage = normalizeMessageContent(message.quoted)
      const quotedMessageType = getContentType(innerQuotedMessage)

      message.quoted = innerQuotedMessage[quotedMessageType]
      message.quoted = typeof message.quoted === 'string'
         ? { text: message.quoted } :
         message.quoted
      if (typeof message.quoted !== 'string') {
         const { quoted } = message
         const quotedContextInfo = quoted?.contextInfo

         quoted.type = quotedMessageType
         quoted.body = extractMessageBody(quoted)

         const parsedQuotedBody = parseCommand(quoted.body)
         quoted.text = parsedQuotedBody.text
         quoted.prefix = parsedQuotedBody.prefix
         quoted.command = parsedQuotedBody.command
         quoted.args = parsedQuotedBody.args

         quoted.mentionedJid = normalizeMentionedJid(quotedContextInfo?.mentionedJid)
         quoted.expiration = quotedContextInfo?.expiration || 0
         quoted.id = contextInfo.stanzaId
         quoted.chat = contextInfo.remoteJid || message.chat

         const quotedUserId = cachedUserId(contextInfo.participant)
         quoted.sender = quotedUserId?.jid
         quoted.senderLid = quotedUserId?.lid

         quoted.fromMe = sock.user.decodedId === quoted.sender
         quoted.isMe = quoted.fromMe && quoted.id?.includes(ME)
         quoted.isGroup = quoted.chat.endsWith(G_US)
         quoted.isPrivate = quoted.chat.endsWith(S_WHATSAPP_NET)
         quoted.isStatus = quoted.chat === STATUS_BROADCAST
         quoted.key = {
            remoteJid: quoted.chat,
            fromMe: quoted.fromMe,
            id: quoted.id,
            participant: quoted.sender
         }

         quoted.download = null

         if (quoted.directPath)
            quoted.download = downloadQuoted
      }
   }

   message.sock = sock
   message.reply = reply
   message.react = react
   message.download = null

   if (message.msg?.directPath)
      message.download = download
}

export const StickerCommand = (message, savedHash = {}) => {
   if (message.type !== 'stickerMessage') return

   const base64Hash = message.msg.fileSha256.toString('base64')
   if (!(base64Hash in savedHash)) return

   const stickerCommand = savedHash[base64Hash]
   if (!stickerCommand) return

   message.body = stickerCommand.body
   message.prefix = stickerCommand.prefix
   message.command = stickerCommand.command
   message.text = stickerCommand.text
   message.args = stickerCommand.args
}