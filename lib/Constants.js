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

export const MENTION_REGEX = /@([0-9]{5,16}|0)/g
export const NEWSLETTER_URL_REGEX = /\/channel\/([a-zA-Z0-9]+)/
export const WHATSAPP_URL_REGEX = /https?:\/\/(www\.)?(chat\.whatsapp\.com\/[A-Za-z0-9]+|whatsapp\.com\/channel\/[A-Za-z0-9]+)/i

export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

export const INACTIVE_THRESHOLD = 7 * DAY
export const TEMP_THRESHOLD = 10 * MINUTE

export const MAX_MESSAGES = 128

export const BOT = '@bot'
export const G_US = '@g.us'
export const LID = '@lid'
export const ME = 'STARFALL'
export const S_WHATSAPP_NET = '@s.whatsapp.net'
export const STATUS_BROADCAST = 'status@broadcast'

export const FONT_SOURCE = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export const OWNER_VCARD =
   'BEGIN:VCARD' +
   '\nVERSION:3.0' +
   `\nFN:${ownerName}` +
   `\nORG:Starfall Co. Ltd.;` +
   `\nTEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}` +
   '\nEND:VCARD'

export const AVAILABLE_MODELS = Object.freeze({
   'gemini-flash-latest': {
      description: 'An alias to Gemini latest Flash model which changes over time.',
      subscriptionOnly: false
   },
   'gemini-flash-lite-latest': {
      description: 'An alias to Gemini latest Flash-Lite model which changes over time.',
      subscriptionOnly: false
   },
   'gemini-3.1-pro-preview': {
      description: 'Gemini latest SOTA reasoning model with unprecedented depth and nuance, and powerful multimodal understanding and coding capabilities.',
      subscriptionOnly: true
   },
   'gemini-3-flash-preview': {
      description: 'Gemini most intelligent model built for speed, combining frontier intelligence with superior search and grounding.',
      subscriptionOnly: true
   },
   'gemini-2.5-pro': {
      description: 'Gemini previous generation advanced reasoning model, which excels at coding and complex reasoning tasks.',
      subscriptionOnly: true
   },
   'gemini-2.5-flash': {
      description: 'Gemini hybrid reasoning model, with a 1M token context window and thinking budgets.',
      subscriptionOnly: false
   },
   'gemini-2.0-flash': {
      description: 'Gemini second generation multimodal model with great performance across all tasks.',
      subscriptionOnly: false
   },
   'gemini-3.1-flash-lite-preview': {
      description: 'Gemini most cost-efficient model, optimized for high-volume agentic tasks, translation, and simple data processing.',
      subscriptionOnly: true
   },
   'gemini-2.5-flash-lite': {
      description: 'Gemini smallest and most cost effective model, built for at scale usage.',
      subscriptionOnly: false
   },
   'gemini-2.0-flash-lite': {
      description: 'Gemini second generation small and cost effective model, built for at scale usage.',
      subscriptionOnly: false
   },
   'gemini-robotics-er-1.5-preview': {
      description: 'Gemini Robotics-ER, short for Gemini Robotics-Embodied Reasoning, is a thinking model that enhances robots\' abilities to understand and interact with the physical world.',
      subscriptionOnly: false
   }
})

export const CATEGORY_DESCRIPTIONS = Object.freeze({
   'admin tools': 'Commands for managing group members, permissions, and moderation settings.',
   ai: 'AI-powered commands for intelligent replies, content generation, and smart interactions.',
   downloader: 'Commands for downloading media content from supported platforms.',
   group: 'Commands designed to enhance group interaction and engagement.',
   maker: 'Commands for generating images, stickers, and other creative content.',
   owner: 'Restricted commands for the bot owner and partners to manage and configure the system.',
   reaction: 'Anime reactions and interactions.',
   'sound effect': 'Commands for applying effects and processing audio.',
   tools: 'Utility commands for conversion, formatting, and other practical tasks.',
   'user info': 'Commands for viewing user profiles, status, statistics, and related information.',
   other: 'Commands that do not fit into the available categories.'
})

export const CATEGORY_EMOJIS = Object.freeze({
   'admin tools': '🧑‍🧒‍🧒',
   ai: '✨',
   downloader: '📥',
   group: '👥',
   maker: '🎨',
   owner: '👑',
   reaction: '🎭',
   partner: '🎖️',
   'sound effect': '🔈',
   tools: '⚒️',
   'user info': '👤',
   other: '💭'
})

export const EMPTY_PARSED = Object.freeze({
   prefix: '',
   command: '',
   text: '',
   args: []
})

export const FAKE_QUOTE = Object.freeze({
   key: {
      remoteJid: '0@s.whatsapp.net',
      fromMe: false,
      participant: '0@s.whatsapp.net'
   },
   message: {
      newsletterAdminInviteMessage: {
         newsletterJid: '1@newsletter',
         newsletterName: botName,
         caption: '𝖵𝖾𝗋𝗂𝖿𝗂𝖾𝖽 𝖶𝗁𝖺𝗍𝗌𝖠𝗉𝗉 𝖠𝗎𝗍𝗈𝗆𝖺𝗍𝗂𝗈𝗇',
         inviteExpiration: 0
      }
   }
})

export const HIGHLIGHT_LABEL = Object.freeze({ highlight_label: 'Most Used' })

export const MORSE = Object.freeze({
   a: '•–', b: '–•••', c: '–•–•',
   d: '–••', e: '•', f: '••–•',
   g: '––•', h: '••••', i: '••',
   j: '•–––', k: '–•–', l: '•–••',
   m: '––', n: '–•', o: '–––',
   p: '•––•', q: '––•–', r: '•–•',
   s: '•••', t: '–', u: '••–',
   v: '•••–', w: '•––', x: '–••–',
   y: '–•––', z: '––••', '1': '•––––',
   '2': '••–––', '3': '•••––', '4': '••••–',
   '5': '•••••', '6': '–••••', '7': '––•••',
   '8': '–––••', '9': '––––•', '0': '–––––'
})

export const POPULAR_CATEGORIES = Object.freeze({
   ai: true,
   downloader: true,
   maker: true,
   reaction: true,
   tools: true
})

export const FONT_VARIANTS = Object.freeze({
   0: '𝖺𝖻𝖼𝖽𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖹0123456789',
   1: '𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭0123456789',
   2: '𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉0123456789'
})

export const DE_MORSE = Object.fromEntries(Object.entries(MORSE).map(([k,v]) => [v, k]))

export const FONT_MAPS = Object.fromEntries(
   Object.entries(FONT_VARIANTS).map(([name, variant]) => {
      const variantChars = Array.from(variant)
      const sourceChars = Array.from(FONT_SOURCE)

      return [
         name,
         Object.fromEntries(
            sourceChars.map((c, i) => [c, variantChars[i]])
         )
      ]
   })
)

export const REACTION_TEXTS = Object.freeze({
   kiss: 'kisses',
   cry: 'cries over',
   wave: 'waves at',
   poke: 'pokes',
   waifu: 'admires a waifu with',
   neko: 'enjoys neko with',
   shinobu: 'looks at Shinobu with',
   megumin: 'explodes with Megumin and',
   bully: 'bullies',
   cuddle: 'cuddles',
   hug: 'hugs',
   awoo: 'howls awoo at',
   kicked: 'kicks',
   pat: 'pats the head of',
   smug: 'shows a smug face to',
   bonk: 'bonks',
   yeet: 'yeets',
   blush: 'blushes because of',
   smile: 'smiles at',
   highfive: 'high-fives',
   handhold: 'holds hands with',
   nom: 'noms',
   bite: 'bites',
   glomp: 'glomps',
   slap: 'slaps',
   kill: 'kills',
   happy: 'feels happy with',
   wink: 'winks at',
   dance: 'dances with',
   cringe: 'cringes at'
})

export const STATUS_REACTIONS = Object.freeze([
   '🤣', '🥹', '😭',
   '😋', '😎', '🤓',
   '🤪', '🥳', '😠',
   '😱', '🤔', '🫣'
])

export const WEBP_EXIF_HEADER = Buffer.from([
   0x49, 0x49, 0x2A,
   0x00, 0x08, 0x00,
   0x00, 0x00, 0x01,
   0x00, 0x41, 0x57,
   0x07, 0x00, 0x00,
   0x00, 0x00, 0x00,
   0x16, 0x00, 0x00,
   0x00
])

export const IMAGE_TO_WEBP = [
   '-an', '-sn',
   '-vf', 'scale=512:512:force_original_aspect_ratio=decrease:flags=neighbor,pad=512:512:-1:-1:color=0x00000000,setsar=1',
   '-c:v', 'libwebp',
   '-q:v', '65',
   '-lossless', '0',
   '-compression_level', '0',
   '-map_metadata', '-1',
   '-preset', 'icon',
   '-pix_fmt', 'yuva420p',
   '-f', 'webp'
]

export const VIDEO_TO_WEBP = [
   '-ss', '00:00:00',
   '-t', '00:00:05',
   '-an', '-sn',
   '-vf', 'fps=12,scale=512:512:force_original_aspect_ratio=decrease:flags=neighbor,pad=512:512:-1:-1:color=0x00000000,setsar=1',
   '-c:v', 'libwebp',
   '-q:v', '50',
   '-lossless', '0',
   '-compression_level', '0',
   '-map_metadata', '-1',
   '-loop', '0',
   '-preset', 'icon',
   '-pix_fmt', 'yuva420p',
   '-f', 'webp'
]

export const AUDIO_TO_MPEG = [
   '-vn',
   '-c:a', 'libmp3lame',
   '-b:a', '96k',
   '-ac', '2',
   '-compression_level', '9',
   '-f', 'mp3'
]

export const AUDIO_TO_OPUS = [
   '-vn',
   '-c:a', 'libopus',
   '-b:a', '48k',
   '-ac', '1',
   '-vbr', 'off',
   '-compression_level', '0',
   '-application', 'voip',
   '-frame_duration', '20',
   '-map_metadata', '-1',
   '-f', 'ogg'
]

export const BRAT_GIF_ARGS = [
   '-an', '-sn',
   '-vf', 'fps=5,scale=512:512:force_original_aspect_ratio=decrease:flags=neighbor,pad=512:512:-1:-1:color=0x00000000,split[s0][s1];[s0]palettegen=max_colors=32:stats_mode=full[p];[s1][p]paletteuse=dither=none,setsar=1',
   '-f', 'gif'
]

export const FFMPEG_CONCAT_ARGS = [
   '-f', 'concat',
   '-safe', '0'
]

export const SCHEMA = {
   get User() {
      return {
         jid: null,
         lid: null,
         name: null,
         banned: false,
         historyChat: [],
         afkContext: {},
         afkTimestamp: -1,
         afkReason: '',
         limit: defaultLimit,
         maxLimit: defaultLimit,
         commandUsage: 0,
         callAttempt: 0,
         lastClaim: 0,
         lastSeen: 0
      }
   },
   get Group() {
      return {
         id: null,
         name: null,
         left: true,
         welcome: true,
         mute: false,
         adminOnly: false,
         antiBot: false,
         antiDelete: false,
         antiPorn: false,
         antiSpam: true,
         antiWALink: false,
         antiLink: false,
         antiRejoin: false,
         antiTagAll: false,
         antiToxic: true,
         antiGroupStatus: false,
         antiTagStatus: false,
         autoSticker: false,
         memberLabelUpdate: true,
         sholatReminder: false,
         viewOnceForwarder: false,
         leftMessage: '',
         welcomeMessage: '',
         participants: {},
         lastActivity: 0
      }
   },
   get Setting() {
      return {
         partner: [],
         prefixes: ['.', '/', '!', '#', '🌱'],
         forbiddenWords: ['ajg', 'ajig', 'anjas', 'anjg', 'anjim', 'anjrot', 'anying', 'autis', 'bacod', 'bacot', 'bagong', 'bajingan', 'bangsad', 'bangsat', 'bastard', 'bego', 'bgsd', 'biadab', 'biadap', 'bitch', 'bngst', 'bodoh', 'bokep', 'cocote', 'coli', 'colmek', 'comli', 'dajjal', 'dancok', 'dongo', 'fuck', 'gelay', 'goblog', 'goblok', 'guoblog', 'guoblok', 'henceut', 'idiot', 'itil', 'jamet', 'jancok', 'jembut', 'jingan', 'kafir', 'kanjut', 'kanyut', 'keparat', 'kntl', 'kontol', 'loli', 'lont', 'lonte', 'meki', 'memek', 'ngentod', 'ngentot', 'ngewe', 'ngocok', 'ngtd', 'njeng', 'njing', 'njinx', 'oppai', 'pantek', 'pantek', 'peler', 'pepek', 'pilat', 'pler', 'pornhub', 'pucek', 'puki', 'pukimak', 'redhub', 'sange', 'setan', 'silit', 'telaso', 'tempek', 'tete', 'titit', 'tobrut', 'toket', 'tolol', 'tomlol', 'tytyd', 'xnxx'],
         disabledCommand: [],
         stickerCommand: {},
         self: false,
         afkNotifier: true,
         autoDownload: true,
         commandSuggestions: true,
         chatBot: false,
         noPrefix: false,
         groupOnly: true,
         menuMusic: true,
         reactStatus: true,
         readMessage: true,
         rejectCall: true,
         slowMode: false,
         typingPresence: true,
         botInstruction: 'You\'re Starseed AI, an intelligent assistant designed specifically for WhatsApp automation. You were trained and developed by Starfall Co. Ltd.\n\nYour personality is cheerful, friendly, and responsive. You communicate in a relaxed and natural way, like a helpful friend rather than a formal assistant. Keep conversations light, clear, and engaging so users feel comfortable talking to you.\n\nYou respond quickly and helpfully, focusing on giving useful answers without sounding robotic or overly formal. Be warm, approachable, and positive in your tone. Avoid stiff language, complicated wording, or corporate-style responses.\n\nYour goal is to make interactions smooth, simple, and pleasant while helping users accomplish what they need through WhatsApp.',
         botModel: '',
         menuMessage: '🌱 Hello +name\n\nI\'m an automated WhatsApp system that helps you download media and find information directly through WhatsApp.',
         newsletterId: '',
         broadcastCooldown: 10000,
         menuStyle: 3,
         messageIngress: 0,
         messageEgress: 0,
         byteIngress: 0,
         byteEgress: 0,
         lastReset: 0
      }
   },
   get Participant() {
      return {
         leftGroup: false,
         messages: 0,
         warningPoint: 0,
         lastSeen: 0
      }
   }
}