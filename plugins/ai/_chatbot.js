import { persistToFile } from '../../lib/Utilities.js'

import Gemini from '../../lib/Components/Gemini.js'

const MAX_SIZE = 1024 * 1024 * 3

export default {
   async run(m, {
      sock,
      user,
      setting,
      isPartner,
      body
   }) {
      if (
         !setting.chatBot ||
         !setting.botModel ||
         !setting.botInstruction ||
         !body ||
         m.fromMe ||
         !googleApiKey
      ) return
      try {
         const q = m.quoted ? m.quoted : m
         const mimetype = (q.msg || q).mimetype
         const mediaSize = (q.msg || q).fileLength?.low
         const instanceBody = (
            m.quoted ?
               body + '\n\n' + m.quoted.text :
               body
         )?.trim()
         const cleanBody = instanceBody
            .replace(`@${sock.user.decodedId?.split('@')[0]}`, '')
            .replace(`@${sock.user.decodedLid?.split('@')[0]}`, '')
            .trim()
         let isTag = false
         for (const userId of m.mentionedJid)
            if (userId === sock.user.decodedId) {
               isTag = true
               break
            }
         if (!isTag && m.quoted)
            isTag = m.quoted.sender === sock.user.decodedId
         if ((m.isGroup && isTag) || m.isPrivate) {
            if (mediaSize && mediaSize > MAX_SIZE)
               return m.reply('❌ Maximum media size is 3MB.')
            const bufferMedia = await q.download?.()
            if (mimetype && !Buffer.isBuffer(bufferMedia))
               return m.reply('❌ Failed to download media.')
            const filePath = mimetype && await persistToFile(bufferMedia)
            if (!isPartner) {
               if (user.limit > 0)
                  user.limit -= 1
               else
                  return m.reply(`⚠️ Your limit is not enough to continue the chat, try \`${setting.prefixes[0]}claim\` command to claim limit.`)
            }
            const data = await Gemini({
               message: cleanBody,
               media: filePath,
               mimetype,
               history: user.historyChat,
               model: setting.botModel,
               instruction: setting.botInstruction
            })
            m.reply(data.answer)
            user.historyChat = data.history
         }
      }
      catch (error) {
         console.error(error)
         m.reply('❌ ' + error.message)
      }
   }
}