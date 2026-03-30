import { Agent, setGlobalDispatcher } from 'undici'
import { cpus } from 'os'

const CPU_COUNT = cpus().length

Object.assign(global, {
   // Owner name
   ownerName: 'Lia Wynn',

   // Owner phone number
   ownerNumber: '628111111',

   // Bot name
   botName: 'Starseed',

   // Footer text
   footer: '✦ Starseed',

   // [IMPORTANT] Bot phone number for pairing code
   botNumber: '628111111',

   // Pairing using code method (set to true for pairing code, false for QR pairing)
   pairingCode: false,

   // User default limit (used for reset too)
   defaultLimit: 15,

   // Sticker pack name
   stickerPackName: '📦 Starseed Sticker',

   // Sticker pack publisher
   stickerPackPublisher: 'GitHub: itsliaaa',

   // ********** API KEYS ********** //

   // Google AI Studio for Chat Bot @ https://aistudio.google.com/
   googleApiKey: '',

   // SightEngine for Anti Porn @ https://sightengine.com/
   apiUser: '',
   apiSecret: '',

   // ********** ADVANCED SETTINGS ********** //

   // Local timezone
   localTimezone: 'Asia/Jakarta',

   // Bot thumbnail (optional, you can change it with setcover command)
   botThumbnail: './lib/Media/thumbnail.jpg',

   // Bot menu music (optional, you can change it with setmenumusic command)
   botMenuMusic: './lib/Media/music.mp3',

   // Temporary folder name (optional)
   temporaryFolder: 'temp',

   // Plugins folder name (optional)
   pluginsFolder: 'plugins',

   // Auth state folder name (optional)
   authFolder: 'session',

   // Store file name (optional)
   storeFilename: 'store.json',

   // Database file name (optional)
   databaseFilename: 'database.json',

   // Interval to clean temporary files (ms)
   temporaryFileInterval: 1_800_000,

   // Persist database to file interval (ms)
   dataInterval: 600_000,

   // Call the garbage collector if exposed (ms)
   gcInterval: 3_600_000,

   // API request timeout (ms)
   requestTimeout: 90_000,

   // FFmpeg process timeout (ms)
   ffmpegTimeout: 60_000,

   // Min delay response (ms)
   minDelay: 100,

   // Max delay response (ms)
   maxDelay: 3_000,

   // Ignore user old message (sec)
   ignoreOldMessageTimestamp: 30,

   // Search cache results TTL (sec)
   searchCacheTTL: 300,

   // RSS limit (mb)
   rssLimit: 384 * 1024 * 1024,

   // FFmpeg stream max concurrent processes (min: 1)
   ffmpegConcurrency: Math.max(3, Math.floor(CPU_COUNT * 1.3)),

   // Maximum allowed NSFW score (lower values are stricter)
   maxNSFWScore: 0.75,

   // Maximum chat bot history length
   maxHistoryChatSize: 20
})

setGlobalDispatcher(
   new Agent({
      connections: 4,
      pipelining: 1,
      keepAliveTimeout: 3_000,
      keepAliveMaxTimeout: 60_000,
      connectTimeout: 5_000,
      bodyTimeout: 30_000,
      maxRedirections: 3,
      connect: {
         rejectUnauthorized: false
      }
   })
)