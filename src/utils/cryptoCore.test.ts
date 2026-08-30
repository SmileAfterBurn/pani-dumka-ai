import { CryptoCore, SecureChannel, EncryptedPacket } from './cryptoCore';

async function enforceTruth(name: string, condition: boolean, errorMessage: string) {
  if (!condition) {
    throw new Error(`[Зрада] Аудит не пройдено [${name}]: ${errorMessage}`);
  }
}

async function runAudits() {
  console.log("🛡️ Пані Думка: Розпочинаю аудит системи підключення та криптошифрування (Crypto Core)...");

  // 1. Тест базової математики (Криві та AES)
  const pairA = await CryptoCore.generateKeyPair();
  const pairB = await CryptoCore.generateKeyPair();

  const pubA = await CryptoCore.exportPublicKey(pairA.publicKey);
  const pubB = await CryptoCore.exportPublicKey(pairB.publicKey);

  const importedPubA = await CryptoCore.importPublicKey(pubA);
  const importedPubB = await CryptoCore.importPublicKey(pubB);

  // Derive Shared Secrets
  const sharedKeyA = await CryptoCore.deriveSharedSecret(pairA.privateKey, importedPubB);
  const sharedKeyB = await CryptoCore.deriveSharedSecret(pairB.privateKey, importedPubA);

  const secretMessage = "Слава Україні! Це секретне повідомлення для перевірки шифру. 12345";
  const packet = await CryptoCore.encryptData(sharedKeyA, secretMessage);
  
  await enforceTruth("Структура пакету", !!packet.iv && !!packet.ciphertext, "Некоректний EncryptedPacket");
  await enforceTruth("Стійкість шифру", packet.ciphertext !== secretMessage, "Повідомлення не зашифроване (передається у відкритому вигляді)!");

  const decryptedMessage = await CryptoCore.decryptData(sharedKeyB, packet);
  await enforceTruth("Розшифровка", decryptedMessage === secretMessage, "Розшифрований текст не збігається з оригіналом.");


  // 2. Тест високорівневої абстракції (SecureChannel)
  console.log("🛡️ Пані Думка: Перевіряю SecureChannel для прямого A2A зв'язку...");
  
  const channelAlice = new SecureChannel();
  const channelBob = new SecureChannel();

  // Ініціалізація
  await channelAlice.initialize();
  await channelBob.initialize();

  // Обмін публічними ключами (Handshake)
  const alicePub = await channelAlice.getPublicKeyBundle();
  const bobPub = await channelBob.getPublicKeyBundle();

  await channelAlice.establishConnection(bobPub);
  await channelBob.establishConnection(alicePub);

  // Передача даних
  const payload = JSON.stringify({ action: "ATTACK", target: "botnet_c2", severity: "CRITICAL" });
  
  const encryptedPayload = await channelAlice.send(payload);
  const receivedPayload = await channelBob.receive(encryptedPayload);

  await enforceTruth("SecureChannel Data Flow", payload === receivedPayload, "Цілісність даних у каналі порушено.");

  console.log("✅ Пані Думка: Усі криптографічні редути вистояли. AES-GCM та ECDH працюють бездоганно. З'єднання ізольоване та захищене.");
}

runAudits().catch(err => {
  console.error(err);
  process.exit(1);
});
