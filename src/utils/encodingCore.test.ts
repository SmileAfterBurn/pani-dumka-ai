import { binary, hex, base64, CSVReader, CSVWriter, pem, json } from './encodingCore';

function enforceTruth(name: string, actual: any, expected: any) {
  if (actual !== expected) {
    throw new Error(`[Зрада] Аудит не пройдено [${name}]: очікували ${expected}, натомість отримали ${actual}`);
  }
}

function runAudits() {
  console.log("🛡️ Пані Думка: Запускаю аудит цифрової криці (Encoding Core)...");

  // 1. Двійковий Фундамент (Little/Big Endian & Varint)
  const steel = new Uint8Array(8);
  binary.LittleEndian.putUint32(steel, 0x12345678, 0);
  enforceTruth("LittleEndian.uint32", binary.LittleEndian.uint32(steel, 0), 0x12345678);
  
  binary.BigEndian.putUint16(steel, 0xABCD, 4);
  enforceTruth("BigEndian.uint16", binary.BigEndian.uint16(steel, 4), 0xABCD);

  const flexibleSteel = new Uint8Array(binary.MaxVarintLen64);
  const bytesUsed = binary.putVarint(flexibleSteel, -150n);
  const [restoredVal, bytesRead] = binary.varint(flexibleSteel.subarray(0, bytesUsed));
  enforceTruth("Гнучке кодування (Varint) значення", restoredVal, -150n);
  enforceTruth("Гнучке кодування (Varint) байти", bytesRead, bytesUsed);

  // 2. Шістнадцяткове Карбування
  const hexStr = hex.encodeToString(new Uint8Array([0x01, 0x0A, 0xFF]));
  enforceTruth("Hex карбування", hexStr, "010aff");
  const hexDecoded = hex.decodeString("010aff");
  enforceTruth("Hex розкодування (довжина)", hexDecoded.length, 3);
  enforceTruth("Hex розкодування (значення)", hexDecoded[2], 0xFF);

  // 3. Базове Кодування (Base64)
  const b64Str = base64.StdEncoding.encodeToString(new Uint8Array([104, 101, 108, 108, 111])); // "hello"
  enforceTruth("Base64 маршалінг", b64Str, "aGVsbG8=");
  const b64Decoded = base64.StdEncoding.decodeString("aGVsbG8=");
  enforceTruth("Base64 демаршалінг", String.fromCharCode(...b64Decoded), "hello");

  // 4. Табличний Літопис (CSV)
  const csvChronicle = `first_name;last_name;username\n"Rob";"Pike";rob`;
  const reader = new CSVReader(csvChronicle, ';');
  const records = reader.readAll();
  enforceTruth("CSV Читання рядків", records.length, 2);
  enforceTruth("CSV Читання даних", records[1][0], "Rob");
  
  const writer = new CSVWriter(';');
  const csvOut = writer.writeAll(records);
  enforceTruth("CSV Карбування літопису", csvOut, `first_name;last_name;username\nRob;Pike;rob\n`);

  // 5. Захищена Грамота (PEM)
  const seal = {
    Type: "MESSAGE",
    Headers: { "Сутність": "Кібер-Козак" },
    Bytes: new Uint8Array([116, 101, 115, 116]) // "test"
  };
  const parchment = pem.encode(seal);
  if (!parchment.includes("Сутність: Кібер-Козак")) throw new Error("PEM: втрачено заголовок грамоти");
  
  const [decBlock, rest] = pem.decode(parchment);
  enforceTruth("PEM відновлення типу", decBlock!.Type, "MESSAGE");
  enforceTruth("PEM відновлення заголовку", decBlock!.Headers["Сутність"], "Кібер-Козак");
  enforceTruth("PEM хвостові дані відсутні", rest.trim(), "");

  // 6. Семантичний Обмін (JSON)
  class CustomEntity {
    val = 123;
    marshalJSON() { return { custom_encoded: this.val * 2 }; }
  }
  const jRes = json.marshal({ item: new CustomEntity() });
  if (jRes !== '{"item":{"custom_encoded":246}}') throw new Error("JSON: власний маршалінг не спрацював");

  console.log("✅ Пані Думка: Аудит успішний. Національний Стандарт Даних функціонує бездоганно.");
}

try {
  runAudits();
} catch (e) {
  console.error(e);
  process.exit(1);
}
