const authService = require('../service/auth.service')

async function login(req, res) {
    try {
        const { email, senha } = req.body

        const resultado = await authService.login(email, senha)

        return res.status(200).json({
            message: 'login realizado com sucesso',
            ...resultado
        })
    } catch (err) {
        return res.status(401).json({
            error: err.message
        })
    }
}

module.exports = { login }
