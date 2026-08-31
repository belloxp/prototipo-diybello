const { verificarToken } = require('../utils/jwt')

// Middleware que protege as rotas privadas.
// Espera o cabeçalho: Authorization: Bearer <TOKEN_JWT>
function authMiddleware(req, res, next) {

    const authHeader = req.headers['authorization']

    if (!authHeader) {
        console.log('[AUTH MIDDLEWARE] - Nenhum header Authorization encontrado!')
        return res.status(401).json({ error: 'Token não informado' })
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
        console.log('[AUTH MIDDLEWARE] - Token mal formatado!')
        return res.status(401).json({ error: 'Token inválido ou mal formatado' })
    }

    const payload = verificarToken(token)

    if (!payload) {
        console.log('[AUTH MIDDLEWARE] - Token inválido ou expirado!')
        return res.status(401).json({ error: 'Token inválido ou expirado' })
    }

    req.usuario = payload
    console.log('[AUTH MIDDLEWARE] - Acesso autorizado para:', payload.email)

    return next()
}

module.exports = authMiddleware
