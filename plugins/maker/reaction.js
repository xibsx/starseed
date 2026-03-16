import { REACTION_TEXTS } from '../../lib/Constants.js'
import { request } from '../../lib/Request.js'

export default {
   command: Object.keys(REACTION_TEXTS),
   category: 'reaction',
   async run(m, {
      sock,
      command
   }) {
      try {
         m.react('🕒')
         const path = command === 'kicked' ?
            'kick' :
            command
         const data = await request(`https://api.waifu.pics/sfw/${path}`)
         if (!data?.url) return m.reply('❌ Failed to get data.')
         const userId =
            m.quoted?.sender ||
            m.mentionedJid[0]
         const message = REACTION_TEXTS[command]
         const context = await sock.sendMedia(m.chat, data.url, '', m, {
            sticker: true
         })
         if (userId && message)
            sock.sendText(
               m.chat,
               `✨ @${m.sender.split('@')[0]} ${message} ${
                  userId === m.sender
                     ? 'themselves'
                     : `@${userId.split('@')[0]}`
               }`,
               context,
               { mentions: [m.sender, userId] }
            )
      }
      catch (error) {
         console.error(error)
         m.reply('❌ ' + error.message)
      }
   },
   limit: true
}