/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ядро Криптографії та Захищених З'єднань (National Crypto Core)
 * 
 * Цей модуль відповідає за встановлення безпечного A2A (Agent-to-Agent)
 * з'єднання та криптошифрування даних. Забезпечує Zero Trust архітектуру:
 * - Обмін ключами на еліптичних кривих (ECDH, P-384).
 * - Автентифіковане симетричне шифрування (AES-GCM 256-bit).
 * 
 * Жодних заглушок — лише чиста, стійка математика та Web Crypto API.
 */

const getCrypto = (): Crypto => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto as Crypto;
  }
  // Fallback for older Node environments, though Node 22+ supports globalThis.crypto
  return require('crypto').webcrypto as unknown as Crypto;
};

const _crypto = getCrypto();
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export interface EncryptedPacket {
  iv: string;         // Base64 encoded Initialization Vector
  ciphertext: string; // Base64 encoded Encrypted Data
}

export namespace CryptoCore {
  /**
   * Генерує пару ключів (Публічний/Приватний) для асиметричного обміну.
   * Використовує еліптичну криву P-384.
   */
  export async function generateKeyPair(): Promise<CryptoKeyPair> {
    return await _crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-384" },
      true, // ключі експортовані для передачі/зберігання
      ["deriveKey", "deriveBits"]
    );
  }

  /**
   * Експортує публічний ключ у формат SPKI (Base64) для передачі іншому агенту.
   */
  export async function exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await _crypto.subtle.exportKey("spki", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  /**
   * Імпортує публічний ключ співрозмовника з формату SPKI (Base64).
   */
  export async function importPublicKey(spkiBase64: string): Promise<CryptoKey> {
    const binaryDer = atob(spkiBase64);
    const bytes = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
      bytes[i] = binaryDer.charCodeAt(i);
    }
    return await _crypto.subtle.importKey(
      "spki",
      bytes.buffer,
      { name: "ECDH", namedCurve: "P-384" },
      true,
      []
    );
  }

  /**
   * Створює спільний симетричний ключ (Shared Secret) для AES-GCM (256-bit)
   * на основі власного приватного ключа та публічного ключа співрозмовника.
   */
  export async function deriveSharedSecret(
    privateKey: CryptoKey,
    publicKey: CryptoKey
  ): Promise<CryptoKey> {
    return await _crypto.subtle.deriveKey(
      {
        name: "ECDH",
        public: publicKey,
      },
      privateKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      false, // Спільний ключ не повинен залишати пам'ять
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Шифрує відкритий текст за допомогою спільного симетричного ключа AES-GCM.
   */
  export async function encryptData(sharedKey: CryptoKey, plaintext: string): Promise<EncryptedPacket> {
    const iv = _crypto.getRandomValues(new Uint8Array(12)); // Рекомендований розмір IV для GCM - 96 bit (12 байт)
    const encodedData = textEncoder.encode(plaintext);

    const ciphertextBuffer = await _crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      sharedKey,
      encodedData
    );

    return {
      iv: btoa(String.fromCharCode(...iv)),
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)))
    };
  }

  /**
   * Розшифровує пакет даних за допомогою спільного симетричного ключа AES-GCM.
   */
  export async function decryptData(sharedKey: CryptoKey, packet: EncryptedPacket): Promise<string> {
    const ivStr = atob(packet.iv);
    const iv = new Uint8Array(ivStr.length);
    for (let i = 0; i < ivStr.length; i++) iv[i] = ivStr.charCodeAt(i);

    const cipherStr = atob(packet.ciphertext);
    const ciphertext = new Uint8Array(cipherStr.length);
    for (let i = 0; i < cipherStr.length; i++) ciphertext[i] = cipherStr.charCodeAt(i);

    const decryptedBuffer = await _crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      sharedKey,
      ciphertext
    );

    return textDecoder.decode(decryptedBuffer);
  }
}

// ============================================================================
// Захищений Канал (Secure Channel)
// Абстракція над криптографічним ядром для зручного обміну даними.
// ============================================================================

export class SecureChannel {
  private keyPair?: CryptoKeyPair;
  private sharedKey?: CryptoKey;

  /** 1. Ініціалізує канал, генерує ключі. */
  async initialize(): Promise<void> {
    this.keyPair = await CryptoCore.generateKeyPair();
  }

  /** 2. Повертає публічний ключ для передачі іншій стороні. */
  async getPublicKeyBundle(): Promise<string> {
    if (!this.keyPair) throw new Error("Канал не ініціалізовано.");
    return await CryptoCore.exportPublicKey(this.keyPair.publicKey);
  }

  /** 3. Приймає публічний ключ іншої сторони та генерує Shared Secret. */
  async establishConnection(peerPublicKeyBase64: string): Promise<void> {
    if (!this.keyPair) throw new Error("Канал не ініціалізовано.");
    const peerKey = await CryptoCore.importPublicKey(peerPublicKeyBase64);
    this.sharedKey = await CryptoCore.deriveSharedSecret(this.keyPair.privateKey, peerKey);
  }

  /** 4. Шифрує повідомлення. */
  async send(data: string): Promise<EncryptedPacket> {
    if (!this.sharedKey) throw new Error("З'єднання не встановлено. Відсутній Shared Secret.");
    return await CryptoCore.encryptData(this.sharedKey, data);
  }

  /** 5. Розшифровує повідомлення. */
  async receive(packet: EncryptedPacket): Promise<string> {
    if (!this.sharedKey) throw new Error("З'єднання не встановлено. Відсутній Shared Secret.");
    return await CryptoCore.decryptData(this.sharedKey, packet);
  }
}
