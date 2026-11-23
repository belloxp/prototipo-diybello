const jwt = require('jsonwebtoken')
require('dotenv').config()

// ==========================================================
// |  JSON WEB TOKEN                                        |
// |  Assina o token no login e valida nas rotas privadas.  |
// ==========================================================

const JWT_SECRET = process.env.JWT_SECRET || 'diybello_chave_secreta_padrao'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'

// Gera um token assinado a partir dos dados do usuário.
function gerarToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// Valida o token. Devolve o payload quando válido ou null quando inválido/expirado.
function verificarToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET)
    } catch (err) {
        return null
    }
}

module.exports = { gerarToken, verificarToken }
