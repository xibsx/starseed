import { CATEGORY_EMOJIS } from '../../lib/Constants.js'
import { toArray, toTitleCase } from '../../lib/Utilities.js'
import { CommandIndex, ModuleCache } from '../../lib/Watcher.js'

export default {
   command: 'commands',
   category: 'other',
   async run(m, {
      sock
   }) {
      const grouped = Object.create(null)
      for (const { command, category } of ModuleCache.values()) {
         if (!category) continue
         ;(grouped[category] ??= []).push(...toArray(command))
      }
      sock.sendMessage(m.chat, {
         pollResult: {
            name: `📏 There are ${Object.keys(CommandIndex).length} commands available`,
            votes: Object.keys(grouped)
               .sort()
               .map(category => ({
                  name: (CATEGORY_EMOJIS[category] ?? '📁') + ' ' + toTitleCase(category),
                  voteCount: grouped[category].length
               }))
         }
      }, {
         quoted: m
      })
   }
}