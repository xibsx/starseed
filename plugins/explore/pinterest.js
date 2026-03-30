import { nexray } from '../../lib/Request.js'
import { shuffleArray } from '../../lib/Utilities.js'

export default {
   command: 'pinimg',
   hidden: 'pins',
   category: 'explore',
   async run(m, {
      sock,
      isPrefix,
      command,
      text
   }) {
      try {
         if (!text)
            return m.reply(`👉🏻 *Example*: ${isPrefix + command} Fern x Stark`)
         m.react('🕒')
         const data = await nexray('search/pinterest', {
            q: text
         })
         if (!data.status)
            return m.reply('❌ Failed to get data.')
         const album = shuffleArray(data.result)
            .splice(0, 3)
         if (!album.length)
            return m.reply('❌ Failed to get data.')
         if (album.length < 2)
            return sock.sendMedia(m.chat, album[0].videos_url || album[0].images_url, '', m)
         sock.sendMessage(m.chat, {
            album: album.map((media) => ({
               [media.type]: {
                  url: media.videos_url || media.images_url
               }
            }))
         }, {
            quoted: m
         })
      }
      catch (error) {
         console.error(error)
         m.reply('❌ ' + error.message)
      }
   },
   limit: 1
}