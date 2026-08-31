// Middleware que libera a área administrativa somente para o nível ADMIN
function isAdminMiddleware(req, res, next) {

    if (!req.usuario) {
        console.log('[ADMIN MIDDLEWARE] - Usuário não autenticado!')
        return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    if (!req.usuario.nivel_acesso || req.usuario.nivel_acesso.toUpperCase() !== 'ADMIN') {
        console.log('[ADMIN MIDDLEWARE] - Usuário não é administrador!')
        return res.status(403).json({ error: 'Acesso permitido somente para administradores' })
    }

    console.log('[ADMIN MIDDLEWARE] - Acesso administrativo autorizado!')
    return next()
}

module.exports = { isAdminMiddleware }
