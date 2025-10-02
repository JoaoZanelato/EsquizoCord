// TESTE/utils/crypto-helper.js

const crypto = require("crypto");

// Validação da chave na inicialização para evitar erros silenciosos
if (
  !process.env.ENCRYPTION_SECRET_KEY ||
  process.env.ENCRYPTION_SECRET_KEY.length !== 64
) {
  throw new Error(
    "FATAL ERROR: A variável de ambiente ENCRYPTION_SECRET_KEY é necessária e deve ser uma string hexadecimal de 64 caracteres."
  );
}

const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = Buffer.from(process.env.ENCRYPTION_SECRET_KEY, "hex");
const NONCE_LENGTH = 16; // O "Nonce" (também conhecido como IV)
const AUTH_TAG_LENGTH = 16;

/**
 * Criptografa o texto.
 * @param {string} text - O texto a ser criptografado.
 * @returns {{nonce: string, ciphertext: string}} - Um objeto contendo o nonce e o texto criptografado.
 */
function encrypt(text) {
  const nonce = crypto.randomBytes(NONCE_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, nonce);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Combina o conteúdo criptografado e a tag de autenticação
  const ciphertextWithAuthTag = Buffer.concat([encrypted, authTag]).toString(
    "hex"
  );

  return {
    nonce: nonce.toString("hex"),
    ciphertext: ciphertextWithAuthTag,
  };
}

/**
 * Descriptografa os dados.
 * @param {{id_mensagem?: number, ConteudoCriptografado: string, Nonce: string, Conteudo?: string}} dbRow - A linha do banco de dados.
 * @returns {string} - O texto original.
 */
function decrypt(dbRow) {
  // Lida com mensagens antigas ou malformadas que não possuem os campos de criptografia.
  if (!dbRow || !dbRow.Nonce || !dbRow.ConteudoCriptografado) {
    return dbRow.Conteudo || "[Mensagem antiga ou corrompida]";
  }

  try {
    const nonce = Buffer.from(dbRow.Nonce, "hex");
    const ciphertextWithAuthTag = Buffer.from(
      dbRow.ConteudoCriptografado,
      "hex"
    );

    if (ciphertextWithAuthTag.length < AUTH_TAG_LENGTH) {
      console.error(
        `Falha ao descriptografar (conteúdo muito curto). ID da Mensagem: ${dbRow.id_mensagem}`
      );
      return "[Mensagem corrompida]";
    }

    const authTag = ciphertextWithAuthTag.slice(-AUTH_TAG_LENGTH);
    const encrypted = ciphertextWithAuthTag.slice(0, -AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, nonce);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    // Log do erro mais detalhado para ajudar a depurar no futuro
    console.error(
      `Falha ao descriptografar a mensagem ID: ${dbRow.id_mensagem}. Erro: ${error.message}`
    );
    return "[Mensagem ilegível ou incompatível]";
  }
}

module.exports = { encrypt, decrypt };
