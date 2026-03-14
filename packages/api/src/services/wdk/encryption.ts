import CryptoJS from 'crypto-js'

const FALLBACK_ENCRYPTION_KEY = 'arbiter-local-development-key'

function readEncryptionKey(): string {
  const key = process.env.AGENT_ENCRYPTION_KEY?.trim()
  return key && key.length > 0 ? key : FALLBACK_ENCRYPTION_KEY
}

function deriveAesKey(): CryptoJS.lib.WordArray {
  return CryptoJS.SHA256(readEncryptionKey())
}

function assertEncryptedSeedPayload(payload: string): [string, string] {
  const parts = payload.split(':')
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted seed payload')
  }

  const [ivHex, ciphertextBase64] = parts
  if (!ivHex || !ciphertextBase64) {
    throw new Error('Invalid encrypted seed payload')
  }

  return [ivHex, ciphertextBase64]
}

export function encryptSeedPhrase(seedPhrase: string): string {
  const normalizedSeedPhrase = seedPhrase.trim().replace(/\s+/g, ' ')
  if (normalizedSeedPhrase.length === 0) {
    throw new Error('Seed phrase must not be empty')
  }

  const key = deriveAesKey()
  const iv = CryptoJS.lib.WordArray.random(16)
  const encrypted = CryptoJS.AES.encrypt(normalizedSeedPhrase, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  return `${iv.toString(CryptoJS.enc.Hex)}:${encrypted.ciphertext.toString(CryptoJS.enc.Base64)}`
}

export function decryptSeedPhrase(encryptedSeedPhrase: string): string {
  const [ivHex, ciphertextBase64] = assertEncryptedSeedPayload(encryptedSeedPhrase)
  const key = deriveAesKey()
  const iv = CryptoJS.enc.Hex.parse(ivHex)
  const ciphertext = CryptoJS.enc.Base64.parse(ciphertextBase64)
  const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext })
  const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })

  const seedPhrase = decrypted.toString(CryptoJS.enc.Utf8).trim().replace(/\s+/g, ' ')
  if (seedPhrase.length === 0) {
    throw new Error('Failed to decrypt seed phrase')
  }

  return seedPhrase
}
