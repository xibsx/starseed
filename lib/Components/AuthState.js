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

import { BufferJSON, initAuthCreds, proto } from '@itsliaaa/baileys'
import { Mutex } from 'async-mutex'
import { mkdir, readFile, stat, unlink, writeFile } from 'fs/promises'
import { join } from 'path'

const fixFileName = (fileName) =>
   fileName?.replace(/\//g, '__')?.replace(/:/g, '-')

export default async (folder = authFolder) => {
   const FileCache = new Map()
   const WriteLock = new Mutex()

   const readData = async (file) => {
      if (FileCache.has(file)) return FileCache.get(file)

      try {
         const data = await readFile(
            join(folder, fixFileName(file)),
            'utf-8'
         )
         const parsed = JSON.parse(data, BufferJSON.reviver)
         FileCache.set(file, parsed)
         return parsed
      }
      catch {
         return null
      }
   }

   const writeData = async (data, file) => {
      FileCache.set(file, data)

      await WriteLock.runExclusive(async () => {
         await writeFile(
            join(folder, fixFileName(file)),
            JSON.stringify(data, BufferJSON.replacer),
            'utf-8'
         )
      })
   }

   const removeData = async (file) => {
      FileCache.delete(file)

      await WriteLock.runExclusive(async () => {
         try {
            await unlink(
               join(folder, fixFileName(file))
            )
         }
         catch { }
      })
   }

   const folderInfo = await stat(folder).catch(() => { })
   if (folderInfo) {
      if (!folderInfo.isDirectory())
         throw new Error(`found something that is not a directory at ${folder}, either delete it or specify a different location`)
   }
   else {
      await mkdir(folder, { recursive: true })
   }

   const creds = (await readData('creds.json')) || initAuthCreds()

   return {
      state: {
         creds,
         keys: {
            get: async (type, ids) => {
               const data = {}

               for (const id of ids) {
                  let value = await readData(`${type}-${id}.json`)
                  if (type === 'app-state-sync-key' && value)
                     value = proto.Message.AppStateSyncKeyData.fromObject(value)
                  data[id] = value
               }

               return data
            },
            set: async (data) => {
               for (const category in data) {
                  for (const id in data[category]) {
                     const value = data[category][id]
                     const file = `${category}-${id}.json`
                     if (value)
                        await writeData(value, file)
                     else
                        await removeData(file)
                  }
               }
            }
         }
      },
      saveCreds: async () =>
         await writeData(creds, 'creds.json')
   }
}