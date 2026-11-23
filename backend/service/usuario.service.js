const Usuario = require('../model/Usuario')
const { Op } = require('sequelize')
const { hashSenha } = require('../utils/bcrypt')
const { somenteNumeros, validaCEP } = require('../utils/validacao')
require('dotenv').config()

// Nunca devolvemos o hash da senha para o frontend
const SEM_SENHA = { attributes: { exclude: ['senha'] } }

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()

// ==========================================================
// |  VALIDAÇÃO MATEMÁTICA DE CPF                           |
// ==========================================================
function validaCPF(cpf) {
    const numeros = somenteNumeros(cpf)

    if (numeros.length !== 11) return false
    if (/^(\d)\1{10}$/.test(numeros)) return false // rejeita 000... 111... etc.

    const calculaDigito = (base) => {
        let soma = 0
        for (let i = 0; i < base.length; i++) {
            soma += Number(base[i]) * (base.length + 1 - i)
        }
        const resto = (soma * 10) % 11
        return resto === 10 ? 0 : resto
    }

    const digito1 = calculaDigito(numeros.slice(0, 9))
    const digito2 = calculaDigito(numeros.slice(0, 10))

    return digito1 === Number(numeros[9]) && digito2 === Number(numeros[10])
}

function validaEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''))
}

// ==========================================================
// |  POST /usuarios - CADASTRO PÚBLICO DE CLIENTES         |
// ==========================================================
async function createUsuario(dados) {

    const {
        nome, email, senha, cpf, telefone,
        cep, rua, numero, complemento, bairro, cidade, uf
    } = dados

    // ---------- campos obrigatórios ----------
    if (!nome || !email || !senha || !cpf) {
        throw new Error('Nome, e-mail, senha e CPF são obrigatórios')
    }

    if (!cep || !rua || !numero || !bairro || !cidade || !uf) {
        throw new Error('Endereço completo é obrigatório (CEP, rua, número, bairro, cidade e UF)')
    }

    // ---------- validações de formato ----------
    if (!validaEmail(email)) {
        throw new Error('E-mail inválido')
    }

    if (String(senha).length < 8) {
        throw new Error('A senha deve ter no mínimo 8 caracteres')
    }

    const cpfLimpo = somenteNumeros(cpf)

    if (!validaCPF(cpfLimpo)) {
        throw new Error('CPF inválido')
    }

    const cepLimpo = somenteNumeros(cep)

    if (!validaCEP(cepLimpo)) {
        throw new Error('CEP inválido')
    }

    const emailNormalizado = String(email).trim().toLowerCase()

    // ---------- unicidade de e-mail e CPF ----------
    const emailExistente = await Usuario.findOne({ where: { email: emailNormalizado } })

    if (emailExistente) {
        throw new Error('Já existe uma conta cadastrada com esse e-mail')
    }

    const cpfExistente = await Usuario.findOne({ where: { cpf: cpfLimpo } })

    if (cpfExistente) {
        throw new Error('Já existe uma conta cadastrada com esse CPF')
    }

    // O e-mail configurado no .env recebe nível ADMIN automaticamente
    const nivel_acesso = emailNormalizado === ADMIN_EMAIL ? 'ADMIN' : 'USER'

    const novoUsuario = await Usuario.create({
        nome: String(nome).trim(),
        email: emailNormalizado,
        senha: await hashSenha(senha),
        cpf: cpfLimpo,
        telefone: telefone ? somenteNumeros(telefone) : null,
        cep: cepLimpo,
        rua: String(rua).trim(),
        numero: String(numero).trim(),
        complemento: complemento ? String(complemento).trim() : null,
        bairro: String(bairro).trim(),
        cidade: String(cidade).trim(),
        uf: String(uf).trim().toUpperCase(),
        nivel_acesso,
        status: true
    })

    // devolve sem a senha
    return await Usuario.findByPk(novoUsuario.id, SEM_SENHA)
}

// ==========================================================
// |  GET /usuarios - LISTAGEM (somente ADMIN)              |
// ==========================================================
async function listUsuarios() {
    return await Usuario.findAll({
        ...SEM_SENHA,
        order: [['id', 'DESC']]
    })
}

// ==========================================================
// |  GET /usuarios/:id  e  /usuarios/perfil                |
// ==========================================================
async function findUsuarioById(id) {
    const usuario = await Usuario.findByPk(id, SEM_SENHA)

    if (!usuario) {
        throw new Error('Usuário não encontrado')
    }

    return usuario
}

// ==========================================================
// |  GET /usuarios/buscar?s=termo (somente ADMIN)          |
// ==========================================================
async function searchUsuarios(busca) {

    if (!busca || typeof busca !== 'string') {
        throw new Error('Termo de busca ausente ou inválido')
    }

    const filtros = [
        { nome: { [Op.like]: `%${busca}%` } },
        { email: { [Op.like]: `%${busca}%` } },
        { cpf: { [Op.like]: `%${somenteNumeros(busca)}%` } }
    ]

    if (!isNaN(busca)) {
        filtros.push({ id: Number(busca) })
    }

    return await Usuario.findAll({
        ...SEM_SENHA,
        where: { [Op.or]: filtros },
        order: [['id', 'DESC']]
    })
}

// Confere se o solicitante pode mexer nesse cadastro:
// o próprio dono ou um administrador.
function garantirPermissao(id, usuarioLogado) {
    const ehDono = Number(usuarioLogado.id) === Number(id)
    const ehAdmin = usuarioLogado.nivel_acesso === 'ADMIN'

    if (!ehDono && !ehAdmin) {
        throw new Error('Você não tem permissão para alterar esse cadastro')
    }

    return ehAdmin
}

// ==========================================================
// |  PUT /usuarios/:id - ATUALIZAÇÃO COMPLETA              |
// ==========================================================
async function updateUsuario(id, dados, usuarioLogado) {

    const ehAdmin = garantirPermissao(id, usuarioLogado)

    const usuario = await Usuario.findByPk(id)

    if (!usuario) {
        throw new Error('Usuário não encontrado')
    }

    const {
        nome, email, senha, telefone,
        cep, rua, numero, complemento, bairro, cidade, uf,
        nivel_acesso, status
    } = dados

    if (!nome || !email || !cep || !rua || !numero || !bairro || !cidade || !uf) {
        throw new Error('No PUT nome, e-mail e endereço completo são obrigatórios')
    }

    if (!validaEmail(email)) {
        throw new Error('E-mail inválido')
    }

    const cepLimpo = somenteNumeros(cep)

    if (!validaCEP(cepLimpo)) {
        throw new Error('CEP inválido')
    }

    const emailNormalizado = String(email).trim().toLowerCase()

    // e-mail único (ignorando o próprio registro)
    const emailExistente = await Usuario.findOne({
        where: { email: emailNormalizado, id: { [Op.ne]: usuario.id } }
    })

    if (emailExistente) {
        throw new Error('Já existe outra conta com esse e-mail')
    }

    const atualizacao = {
        nome: String(nome).trim(),
        email: emailNormalizado,
        telefone: telefone ? somenteNumeros(telefone) : null,
        cep: cepLimpo,
        rua: String(rua).trim(),
        numero: String(numero).trim(),
        complemento: complemento ? String(complemento).trim() : null,
        bairro: String(bairro).trim(),
        cidade: String(cidade).trim(),
        uf: String(uf).trim().toUpperCase()
    }

    // troca de senha é opcional no update
    if (senha) {
        if (String(senha).length < 8) {
            throw new Error('A senha deve ter no mínimo 8 caracteres')
        }
        atualizacao.senha = await hashSenha(senha)
    }

    // só o admin pode mexer em nível de acesso e status
    if (ehAdmin) {
        if (nivel_acesso && ['USER', 'ADMIN'].includes(nivel_acesso)) {
            atualizacao.nivel_acesso = nivel_acesso
        }
        if (status !== undefined) {
            atualizacao.status = Boolean(status)
        }
    }

    await usuario.update(atualizacao)

    return await Usuario.findByPk(usuario.id, SEM_SENHA)
}

// ==========================================================
// |  PATCH /usuarios/:id - ATUALIZAÇÃO PARCIAL             |
// ==========================================================
async function patchUsuario(id, dados, usuarioLogado) {

    const ehAdmin = garantirPermissao(id, usuarioLogado)

    const usuario = await Usuario.findByPk(id)

    if (!usuario) {
        throw new Error('Usuário não encontrado')
    }

    const permitidos = {}

    if (dados.nome) permitidos.nome = String(dados.nome).trim()

    if (dados.email) {
        if (!validaEmail(dados.email)) {
            throw new Error('E-mail inválido')
        }
        const emailNormalizado = String(dados.email).trim().toLowerCase()
        const emailExistente = await Usuario.findOne({
            where: { email: emailNormalizado, id: { [Op.ne]: usuario.id } }
        })
        if (emailExistente) {
            throw new Error('Já existe outra conta com esse e-mail')
        }
        permitidos.email = emailNormalizado
    }

    if (dados.senha) {
        if (String(dados.senha).length < 8) {
            throw new Error('A senha deve ter no mínimo 8 caracteres')
        }
        permitidos.senha = await hashSenha(dados.senha)
    }

    if (dados.telefone !== undefined) permitidos.telefone = dados.telefone ? somenteNumeros(dados.telefone) : null

    if (dados.cep) {
        const cepLimpo = somenteNumeros(dados.cep)
        if (!validaCEP(cepLimpo)) {
            throw new Error('CEP inválido')
        }
        permitidos.cep = cepLimpo
    }

    if (dados.rua) permitidos.rua = String(dados.rua).trim()
    if (dados.numero) permitidos.numero = String(dados.numero).trim()
    if (dados.complemento !== undefined) permitidos.complemento = dados.complemento ? String(dados.complemento).trim() : null
    if (dados.bairro) permitidos.bairro = String(dados.bairro).trim()
    if (dados.cidade) permitidos.cidade = String(dados.cidade).trim()
    if (dados.uf) permitidos.uf = String(dados.uf).trim().toUpperCase()

    // só o admin altera nível e status
    if (ehAdmin) {
        if (dados.nivel_acesso && ['USER', 'ADMIN'].includes(dados.nivel_acesso)) {
            permitidos.nivel_acesso = dados.nivel_acesso
        }
        if (dados.status !== undefined) {
            permitidos.status = Boolean(dados.status)
        }
    }

    if (Object.keys(permitidos).length === 0) {
        throw new Error('Nenhum campo válido foi enviado para atualização')
    }

    await usuario.update(permitidos)

    return await Usuario.findByPk(usuario.id, SEM_SENHA)
}

// ==========================================================
// |  DELETE /usuarios/:id                                  |
// ==========================================================
async function deleteUsuario(id, usuarioLogado) {

    garantirPermissao(id, usuarioLogado)

    const usuario = await Usuario.findByPk(id)

    if (!usuario) {
        throw new Error('Usuário não encontrado')
    }

    await usuario.destroy()

    return {
        status: true,
        message: 'Usuário apagado com sucesso'
    }
}

module.exports = {
    createUsuario,
    listUsuarios,
    findUsuarioById,
    searchUsuarios,
    updateUsuario,
    patchUsuario,
    deleteUsuario
}
