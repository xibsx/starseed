import { delay } from '@itsliaaa/baileys'

import { frame, isEmptyObject, toTime } from '../../lib/Utilities.js'

const notifySender = async (m, {
   sock,
   userData,
   senderData,
   setting,
   groupMetadata
}) => {
   const printNotifySender = frame('AFK', [
      `💭 @${userData.jid.split('@')[0]} is not available right now.`,
      `🏷️ *Reason*: ${userData.afkReason || '-'}`,
      `🕒 *During*: ${toTime(senderData.lastSeen - userData.afkTimestamp)}`
   ], '⚠️')
   const printNotifyAFK = frame('HELLO', [
      `💬 Someone from ${groupMetadata.subject}'s group, tagged or mentioned you.`,
      `👤 *Sender*: @${m.sender.split('@')[0]}`
   ], '👋🏻')
   sock.sendText(m.chat, printNotifySender, m)
   if (!setting.afkNotifier) return
   await delay(3000)
   sock.sendText(userData.jid, printNotifyAFK, m)
}

export default {
   async run(m, {
      sock,
      db,
      user: senderData,
      setting,
      groupMetadata
   }) {
      if (m.fromMe) return
      for (const userId of m.mentionedJid) {
         const userData = db.getUser(userId)
         if (
            !userData ||
            isEmptyObject(userData.afkContext)
         ) continue
         notifySender(m, {
            sock,
            userData,
            senderData,
            setting,
            groupMetadata
         })
      }
      if (m.quoted?.sender) {
         const userData = db.getUser(m.quoted.sender)
         if (
            !userData ||
            isEmptyObject(userData.afkContext)
         ) return
         notifySender(m, {
            sock,
            userData,
            senderData,
            setting,
            groupMetadata
         })
      }
   },
   group: true
}