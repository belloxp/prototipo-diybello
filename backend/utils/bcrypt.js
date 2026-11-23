const bcrypt = require('bcrypt')
require('dotenv').config()

// ==========================================================
// |  HASH E COMPARAÇÃO DE SENHAS (bcrypt)                  |
// |  O número de salt rounds vem do .env (padrão 10).      |
// ==========================================================

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10

// Gera o hash da senha em texto puro antes de salvar no banco.
async function hashSenha(senha) {
    if (!senha) {
        throw new Error('Senha obrigatória para gerar o hash')
    }
    return await bcrypt.hash(String(senha), SALT_ROUNDS)
}

// Compara a senha digitada no login com o hash guardado no banco.
async function compareSenha(senha, hash) {
    if (!senha || !hash) return false
    return await bcrypt.compare(String(senha), hash)
}

module.exports = { hashSenha, compareSenha }
