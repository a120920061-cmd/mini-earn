import { createHmac } from 'crypto'

/**
 * Telegram authentication utilities.
 *
 * Uses BotFather-provided client_id + client_secret for Telegram OAuth.
 * The "bot token" is actually "client_id:client_secret" format.
 *
 * Supports TWO auth flows:
 * 1. Telegram Mini App (TMA) — verifies `initData` using HMAC-SHA256
 * 2. Telegram Login Widget — verifies callback `hash` using HMAC-SHA256
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const CLIENT_ID = process.env.NEXT_PUBLIC_TG_BOT_ID || BOT_TOKEN.split(':')[0] || ''
const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME || ''

/**
 * Verify Telegram Mini App initData string.
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramInitData(initData: string): TelegramUserData | null {
  if (!BOT_TOKEN || !initData) return null

  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return null

    params.delete('hash')

    const sortedKeys = Array.from(params.keys()).sort()
    const dataCheckString = sortedKeys
      .map((key) => `${key}=${params.get(key)}`)
      .join('\n')

    const secretKey = createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest()

    const computedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    if (computedHash !== hash) return null

    const userJson = params.get('user')
    if (!userJson) return null
    const user = JSON.parse(userJson)

    return {
      id: String(user.id),
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      username: user.username || `tg_${user.id}`,
      photoUrl: user.photo_url || null,
      languageCode: user.language_code || null,
    }
  } catch {
    return null
  }
}

/**
 * Verify Telegram Login Widget callback data.
 * @see https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramLoginWidget(data: Record<string, string>): TelegramUserData | null {
  if (!BOT_TOKEN || !data?.hash) return null

  try {
    const { hash, ...rest } = data

    const sortedKeys = Object.keys(rest).sort()
    const dataCheckString = sortedKeys
      .map((key) => `${key}=${rest[key]}`)
      .join('\n')

    // Secret key: HMAC-SHA256 with bot_token as KEY, empty string as data
    const secretKey = createHmac('sha256', BOT_TOKEN)
      .update('')
      .digest()

    const computedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    if (computedHash !== hash) return null

    return {
      id: String(data.id),
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      username: data.username || `tg_${data.id}`,
      photoUrl: data.photo_url || null,
      languageCode: null,
    }
  } catch {
    return null
  }
}

export function getBotId(): string {
  return CLIENT_ID
}

export function getBotUsername(): string {
  return BOT_USERNAME
}

export type TelegramUserData = {
  id: string
  firstName: string
  lastName: string
  username: string
  photoUrl: string | null
  languageCode: string | null
}
