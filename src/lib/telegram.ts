import { createHmac } from 'crypto'

/**
 * Telegram authentication utilities.
 *
 * Supports TWO auth flows:
 * 1. Telegram Mini App (TMA) — verifies `initData` string using HMAC-SHA256
 * 2. Telegram Login Widget — verifies callback `hash` using the same method
 *
 * The bot token is read from TELEGRAM_BOT_TOKEN env var.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

/**
 * Verify Telegram Mini App initData string.
 * Returns the parsed user data if valid, null otherwise.
 *
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramInitData(initData: string): TelegramUserData | null {
  if (!BOT_TOKEN || !initData) return null

  try {
    // Parse the initData query string
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return null

    // Remove hash from params, build data-check-string
    params.delete('hash')

    // Sort keys alphabetically and build the data-check-string
    const sortedKeys = Array.from(params.keys()).sort()
    const dataCheckString = sortedKeys
      .map((key) => `${key}=${params.get(key)}`)
      .join('\n')

    // Create secret key: HMAC-SHA256 of bot token with "WebAppData" as key
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest()

    // Compute HMAC-SHA256 of data-check-string using the secret key
    const computedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    // Compare hashes
    if (computedHash !== hash) return null

    // Parse user data
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

    // Sort keys alphabetically and build the data-check-string
    const sortedKeys = Object.keys(rest).sort()
    const dataCheckString = sortedKeys
      .map((key) => `${key}=${rest[key]}`)
      .join('\n')

    // Create secret key: HMAC-SHA256 of bot token with empty string as data
    const secretKey = createHmac('sha256', '')
      .update(BOT_TOKEN)
      .digest()

    // Compute HMAC-SHA256 of data-check-string using the secret key
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

export type TelegramUserData = {
  id: string
  firstName: string
  lastName: string
  username: string
  photoUrl: string | null
  languageCode: string | null
}
