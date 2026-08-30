/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ядро Кодування та Декодування (Національний Стандарт Даних)
 * 
 * Цей модуль — не просто набір утиліт, це фундамент нашого цифрового суверенітету.
 * Спираючись на філософію Григорія Сковороди ("Пізнай невидиме через видиме"),
 * ми реалізуємо глибоке розуміння того, як інформація мандрує між станами:
 * від сирої цифрової криці (binary/hex) до табличних літописів (CSV) та 
 * криптографічних грамот (PEM).
 * 
 * Безкомпромісна імплементація стандартів Go, викувана для нашої екосистеми.
 */

// ============================================================================
// 1. Універсальні Контракти (Спільні інтерфейси серіалізації)
// Визначають шляхетні правила перетворення сутностей на байти та текст.
// ============================================================================

export interface BinaryMarshaler {
  /** Перетворює сутність на монолітний злиток байтів */
  marshalBinary(): Uint8Array;
}

export interface BinaryUnmarshaler {
  /** Відновлює сутність із сирої байтової криці */
  unmarshalBinary(data: Uint8Array): void;
}

export interface TextMarshaler {
  /** Карбує сутність у текстовому форматі */
  marshalText(): string;
}

export interface TextUnmarshaler {
  /** Відроджує сутність із прочитаного тексту */
  unmarshalText(text: string): void;
}

// ============================================================================
// 2. Двійковий Фундамент (binary)
// Порядок байтів (Endianness) та гнучке кодування (Varint), що адаптується, 
// мов козацькі маневри, заощаджуючи простір.
// ============================================================================

export namespace binary {
  export const LittleEndian = {
    putUint16(b: Uint8Array, v: number, offset = 0) { new DataView(b.buffer, b.byteOffset, b.byteLength).setUint16(offset, v, true); },
    uint16(b: Uint8Array, offset = 0): number { return new DataView(b.buffer, b.byteOffset, b.byteLength).getUint16(offset, true); },
    putUint32(b: Uint8Array, v: number, offset = 0) { new DataView(b.buffer, b.byteOffset, b.byteLength).setUint32(offset, v, true); },
    uint32(b: Uint8Array, offset = 0): number { return new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(offset, true); },
    putUint64(b: Uint8Array, v: bigint, offset = 0) { new DataView(b.buffer, b.byteOffset, b.byteLength).setBigUint64(offset, v, true); },
    uint64(b: Uint8Array, offset = 0): bigint { return new DataView(b.buffer, b.byteOffset, b.byteLength).getBigUint64(offset, true); }
  };

  export const BigEndian = {
    putUint16(b: Uint8Array, v: number, offset = 0) { new DataView(b.buffer, b.byteOffset, b.byteLength).setUint16(offset, v, false); },
    uint16(b: Uint8Array, offset = 0): number { return new DataView(b.buffer, b.byteOffset, b.byteLength).getUint16(offset, false); },
    putUint32(b: Uint8Array, v: number, offset = 0) { new DataView(b.buffer, b.byteOffset, b.byteLength).setUint32(offset, v, false); },
    uint32(b: Uint8Array, offset = 0): number { return new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(offset, false); },
    putUint64(b: Uint8Array, v: bigint, offset = 0) { new DataView(b.buffer, b.byteOffset, b.byteLength).setBigUint64(offset, v, false); },
    uint64(b: Uint8Array, offset = 0): bigint { return new DataView(b.buffer, b.byteOffset, b.byteLength).getBigUint64(offset, false); }
  };

  export const MaxVarintLen64 = 10;

  /** Пакує беззнакове ціле число у гнучкий формат (Uvarint). */
  export function putUvarint(digitalSteel: Uint8Array, x: bigint): number {
    let index = 0;
    while (x >= 0x80n) {
      digitalSteel[index++] = Number((x & 0x7Fn) | 0x80n);
      x >>= 7n;
    }
    digitalSteel[index++] = Number(x & 0x7Fn);
    return index;
  }

  /** Читає Uvarint з байтового злитка. */
  export function uvarint(digitalSteel: Uint8Array): [bigint, number] {
    let value = 0n;
    let shift = 0n;
    for (let i = 0; i < digitalSteel.length; i++) {
      const b = digitalSteel[i];
      if (b < 0x80) {
        if (i > 9 || (i === 9 && b > 1)) return [0n, -(i + 1)]; // Переповнення
        return [value | (BigInt(b) << shift), i + 1];
      }
      value |= BigInt(b & 0x7f) << shift;
      shift += 7n;
    }
    return [0n, 0];
  }

  /** Пакує знакове ціле число за допомогою зигзагоподібного маневру. */
  export function putVarint(digitalSteel: Uint8Array, x: bigint): number {
    let zigzag = x << 1n;
    if (x < 0n) { zigzag = ~zigzag; }
    return putUvarint(digitalSteel, zigzag);
  }

  /** Читає знакове число, декодуючи зигзагоподібне зміщення. */
  export function varint(digitalSteel: Uint8Array): [bigint, number] {
    const [zigzag, bytesRead] = uvarint(digitalSteel);
    let value = zigzag >> 1n;
    if ((zigzag & 1n) !== 0n) { value = ~value; }
    return [value, bytesRead];
  }
}

// ============================================================================
// 3. Шістнадцяткове Карбування (hex)
// ============================================================================

export namespace hex {
  export function encodeToString(src: Uint8Array): string {
    const chronicle = new Array(src.length);
    for (let i = 0; i < src.length; i++) {
      chronicle[i] = src[i].toString(16).padStart(2, '0');
    }
    return chronicle.join('');
  }

  export function decodeString(s: string): Uint8Array {
    if (s.length % 2 !== 0) throw new Error("encoding/hex: пошкоджена цілісність, непарна довжина шістнадцяткового рядка");
    const steel = new Uint8Array(s.length / 2);
    for (let i = 0; i < s.length; i += 2) {
      steel[i / 2] = parseInt(s.substring(i, i + 2), 16);
    }
    return steel;
  }
}

// ============================================================================
// 4. Базове Кодування (base64)
// ============================================================================

export namespace base64 {
  export const StdEncoding = {
    encodeToString(src: Uint8Array): string {
      let artifact = '';
      const len = src.length;
      for (let i = 0; i < len; i++) {
        artifact += String.fromCharCode(src[i]);
      }
      return btoa(artifact);
    },
    decodeString(s: string): Uint8Array {
      const artifact = atob(s);
      const len = artifact.length;
      const steel = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        steel[i] = artifact.charCodeAt(i);
      }
      return steel;
    }
  };
}

// ============================================================================
// 5. Табличний Літопис (CSV)
// Надійна робота з регістрами, що дотримується RFC 4180.
// ============================================================================

export class CSVReader {
  /**
   * Ініціалізує читця табличних літописів.
   * @param input Вхідний текст
   * @param comma Символ-розділювач (за замовчуванням кома)
   * @param comment Символ коментаря, рядки з яким ігноруються
   */
  constructor(private input: string, public comma: string = ',', public comment: string = '') {}

  readAll(): string[][] {
    const registry: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < this.input.length; i++) {
      const char = this.input[i];

      // Пропускаємо коментарі на початку рядка
      if (this.comment && char === this.comment && currentCell === '' && currentRow.length === 0) {
        while (i < this.input.length && this.input[i] !== '\n') i++;
        continue;
      }

      if (char === '"') {
        if (inQuotes && this.input[i + 1] === '"') {
          currentCell += '"'; // Екранована лапка
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === this.comma && !inQuotes) {
        currentRow.push(currentCell);
        currentCell = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && this.input[i + 1] === '\n') i++; // Обробка CRLF
        currentRow.push(currentCell);
        registry.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    // Завершення останнього рядка, якщо немає перенесення
    if (currentCell !== '' || currentRow.length > 0) {
      currentRow.push(currentCell);
      registry.push(currentRow);
    }

    return registry;
  }
}

export class CSVWriter {
  public useCRLF = false;
  constructor(public comma: string = ',') {}

  writeAll(registry: string[][]): string {
    const eol = this.useCRLF ? '\r\n' : '\n';
    return registry.map(row => 
      row.map(cell => {
        // Екранування спеціальних символів у клітинці
        if (cell.includes(this.comma) || cell.includes('\n') || cell.includes('\r') || cell.includes('"')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(this.comma)
    ).join(eol) + eol;
  }
}

// ============================================================================
// 6. Захищені Грамоти (PEM)
// Скриптографічна печатка для збереження ключів та сертифікатів.
// ============================================================================

export interface PEMBlock {
  /** Тип грамоти (наприклад, "RSA PRIVATE KEY") */
  Type: string;
  /** Супровідні метадані (заголовки) */
  Headers: Record<string, string>;
  /** Безпосередньо зашифроване тіло (криптографічний скарб) */
  Bytes: Uint8Array;
}

export namespace pem {
  /** Карбує криптографічну печатку (Encode) */
  export function encode(seal: PEMBlock): string {
    let parchment = `-----BEGIN ${seal.Type}-----\n`;
    for (const [key, value] of Object.entries(seal.Headers)) {
      parchment += `${key}: ${value}\n`;
    }
    if (Object.keys(seal.Headers).length > 0) {
      parchment += '\n';
    }
    const b64Artifact = base64.StdEncoding.encodeToString(seal.Bytes);
    for (let i = 0; i < b64Artifact.length; i += 64) {
      parchment += b64Artifact.substring(i, i + 64) + '\n';
    }
    parchment += `-----END ${seal.Type}-----\n`;
    return parchment;
  }

  /** Зламує печатку та розшифровує грамоту (Decode) */
  export function decode(parchment: string): [PEMBlock | null, string] {
    const beginRegex = /-----BEGIN ([A-Z0-9 ]+)-----\n/;
    const match = parchment.match(beginRegex);
    if (!match) return [null, parchment];

    const type = match[1];
    const startIndex = match.index! + match[0].length;
    const endStr = `-----END ${type}-----\n`;
    const endIndex = parchment.indexOf(endStr, startIndex);
    
    if (endIndex === -1) return [null, parchment]; 
    
    const blockContent = parchment.substring(startIndex, endIndex);
    const lines = blockContent.split('\n');
    const headers: Record<string, string> = {};
    let b64Artifact = "";
    let parsingHeaders = true;

    for (const line of lines) {
      const trimmed = line.trim();
      if (parsingHeaders && trimmed.includes(':')) {
        const splitIdx = trimmed.indexOf(':');
        headers[trimmed.substring(0, splitIdx).trim()] = trimmed.substring(splitIdx + 1).trim();
      } else if (trimmed === "") {
        parsingHeaders = false;
      } else {
        parsingHeaders = false;
        b64Artifact += trimmed;
      }
    }

    const steelBytes = base64.StdEncoding.decodeString(b64Artifact);
    return [{ Type: type, Headers: headers, Bytes: steelBytes }, parchment.substring(endIndex + endStr.length)];
  }
}

// ============================================================================
// 7. Семантичний Обмін (JSON)
// Гнучкий світогляд даних для спілкування між агентами.
// ============================================================================

export namespace json {
  /** Пакує сутність у JSON-формат, поважаючи власні інтерфейси маршалінгу. */
  export function marshal(entity: any): string {
    return JSON.stringify(entity, (key, value) => {
      if (value !== null && typeof value === 'object') {
        if (typeof value.marshalJSON === 'function') {
          return value.marshalJSON();
        }
        if (typeof value.marshalText === 'function') {
          return value.marshalText();
        }
      }
      return value;
    });
  }

  /** Розпаковує JSON у об'єкт середовища. */
  export function unmarshal(data: string, reviver?: (this: any, key: string, value: any) => any): any {
    return JSON.parse(data, reviver);
  }
}
