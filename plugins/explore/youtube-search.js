import { isJidNewsletter } from '@itsliaaa/baileys'
import NodeCache from '@cacheable/node-cache'

import { nexray } from '../../lib/Request.js'
import { frame } from '../../lib/Utilities.js'

const ResultCache = new NodeCache({
   stdTTL: searchCacheTTL,
   useClones: false,
   deleteOnExpire: true
})

export default {
   command: 'ytsearch',
   hidden: ['yts', 'ytsa', 'ytsv'],
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
            const shouldAsAudio = command === 'ytsa'
            const path = shouldAsAudio ?
               'ytmp3' :
               'v1/ytmp4'
            const data = await nexray('downloader/' + path, {
               url: result.url
            })
            if (!data.status)
               return m.reply('❌ Failed to get data.')
            sock.sendMedia(m.chat, data.result.url, data.result.title, m, {
               audio: shouldAsAudio,
               ptt: shouldAsAudio && isJidNewsletter(m.chat)
            })
         }
         else {
            if (!text)
               return m.reply(`👉🏻 *Example*: ${isPrefix + command} abnormal heat`)
            m.react('🕒')
            const data = await nexray('search/youtube', {
               q: text
            })
            if (!data.status)
               return m.reply('❌ Failed to get data.')
            const flattedResult = data.result.flatMap((result, index, array) => {
               const lines = [
                  `${index + 1}. ${result.title}`,
                  `*Views*: ${result.views}`,
                  `*Duration*: ${result.duration}`,
                  `*Uploaded*: ${result.upload_at}`
               ]
               if (index !== array.length - 1)
                  lines.push('')
               return lines
            })
            const printHowTo = frame('HOW TO GET', [
               `To get the video use \`${isPrefix}ytsv <number>\` command and to get the audio use \`${isPrefix}ytsa <number>\` command`,
               `*Example*: ${isPrefix}ytsv 1`
            ], '📄')
            const printList = frame('YOUTUBE SEARCH', flattedResult, '🎥')
            ResultCache.set(keyCache, data.result)
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