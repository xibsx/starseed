import { isJidNewsletter } from '@itsliaaa/baileys'

import { nexray } from '../../lib/Request.js'
import { fetchAsBuffer, frame } from '../../lib/Utilities.js'

export default {
   command: 'play',
   category: 'downloader',
   async run(m, {
      sock,
      isPrefix,
      command,
      text
   }) {
      try {
         if (!text)
            return m.reply(`👉🏻 *Example*: ${isPrefix + command} you say run`)
         m.react('🕒')
         const data = await nexray('downloader/ytplay', {
            q: text
         })
         if (!data.status)
            return m.reply('❌ Failed to get data.')
         const printCaption = frame('YOUTUBE PLAY', [
            `*Title*: ${data.result.title}`,
            `*Views*: ${data.result.views}`,
            `*Duration*: ${data.result.duration}`,
            `*Uploaded*: ${data.result.upload_at}`
         ], '🎵')
         m.reply(printCaption, {
            externalAdReply: {
               title: data.result.title,
               body: data.result.description,
               thumbnail: await fetchAsBuffer(data.result.thumbnail || botThumbnail),
               url: data.result.url,
               sourceUrl: data.result.url,
               largeThumbnail: true,
               mediaType: 2
            }
         })
         sock.sendMedia(m.chat, data.result.download_url, '', m, {
            audio: true,
            ptt: isJidNewsletter(m.chat)
         })
      }
      catch (error) {
         console.error(error)
         m.reply('❌ ' + error.message)
      }
   },
   limit: 1
}