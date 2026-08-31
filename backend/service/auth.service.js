const Usuario = require('../model/Usuario')
const { compareSenha } = require('../utils/bcrypt')
const { gerarToken } = require('../utils/jwt')

async function login(email, senha) {

    if (!email || !senha) {
        throw new Error('E-mail e senha são obrigatórios')
    }

    // Verifica a existência prévia do usuário no banco antes de qualquer coisa
    const usuario = await Usuario.findOne({ where: { email } })

    if (!usuario) {
        throw new Error('E-mail ou senha inválidos')
    }

    if (!usuario.status) {
        throw new Error('Usuário inativo, procure o administrador da loja')
    }

    const senhaValida = await compareSenha(senha, usuario.senha)

    if (!senhaValida) {
        throw new Error('E-mail ou senha inválidos')
    }

    const token = gerarToken({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        nivel_acesso: usuario.nivel_acesso
    })

    return {
        token,
        usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            nivel_acesso: usuario.nivel_acesso
        }
    }
}

module.exports = { login }
