import NodeCache from '@cacheable/node-cache'

import { getStickerPack } from '../../lib/Scraper.js'
import { createSticker, frame } from '../../lib/Utilities.js'

const CDN_URL = 'https://s3.getstickerpack.com/'

const ResultCache = new NodeCache({
   stdTTL: searchCacheTTL,
   useClones: false,
   deleteOnExpire: true
})

export default {
   command: 'stickerpack',
   hidden: 'skpack',
   category: 'explore',
   async run(m, {
      sock,
      isPrefix,
      command,
      text
   }) {
      try {
         const keyCache = m.sender
         const userPreviousResult = ResultCache.get(keyCache)
         if (
            text &&
            !isNaN(text) &&
            userPreviousResult
         ) {
            const result = userPreviousResult[Number(text) - 1]
            if (!result)
               return m.reply(`❌ Invalid input.`)
            m.react('🕒')
            const data = await getStickerPack.detail(result.slug)
            const stickers = await Promise.all(
               data.images.map(async (value) => ({
                  data: await createSticker(CDN_URL + value.url)
               }))
            )
            await sock.sendMessage(m.chat, {
               cover: {
                  url: botThumbnail
               },
               stickers,
               name: stickerPackName,
               publisher: stickerPackPublisher,
               description: data.about || footer
            }, {
               quoted: m
            })
         }
         else {
            if (!text)
               return m.reply(`👉🏻 *Example*: ${isPrefix + command} cat`)
            m.react('🕒')
            const data = await getStickerPack.search(text)
            const flattedResult = data.flatMap((result, index, array) => {
               const lines = [
                  `${index + 1}. ${result.title}`,
                  `*Created by*: ${result.user.username || '-'}`
               ]
               if (index !== array.length - 1)
                  lines.push('')
               return lines
            })
            const printHowTo = frame('HOW TO GET', [
               `To get the stickers use \`${isPrefix + command} <number>\` command`,
               `*Example*: ${isPrefix + command} 1`
            ], '📄')
            const printList = frame('STICKER PACKS', flattedResult, '📦')
            ResultCache.set(keyCache, data)
            m.reply(printHowTo + '\n\n' +
               printList)
         }
      }
      catch (error) {
         console.error(error)
         m.reply('❌ ' + error.message)
      }
   },
   limit: 1
}