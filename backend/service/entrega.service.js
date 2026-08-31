const Entrega = require('../model/Entrega')
const Pedido = require('../model/Pedido')
const Usuario = require('../model/Usuario')
const { Op } = require('sequelize')

const { validaCEP, somenteNumeros } = require('../utils/validacao')
const { gerarCodigoRastreio, calcularPrevisaoEntrega } = require('../utils/function')

const INCLUDE_PEDIDO = [{
    model: Pedido,
    as: 'pedidoEntrega',
    attributes: ['id', 'usuario_id', 'status', 'total'],
    include: [{
        model: Usuario,
        as: 'usuarioPedido',
        attributes: ['id', 'nome', 'email']
    }]
}]

const STATUS_VALIDOS = ['PREPARANDO', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADA']

// POST /entregas - normalmente a entrega nasce junto com o pedido,
// essa rota existe para o admin recriar uma entrega perdida.
async function createEntrega(dados) {

    const { pedido_id, cep, rua, numero, bairro, cidade, uf, status } = dados

    if (!pedido_id || !cep || !rua || !numero || !bairro || !cidade || !uf) {
        throw new Error('Pedido e endereço completo são obrigatórios')
    }

    // Verifica a existência prévia do pedido
    const pedido = await Pedido.findByPk(pedido_id)

    if (!pedido) {
        throw new Error('Pedido não encontrado para gerar a entrega')
    }

    // Um pedido só pode ter uma entrega
    const entregaExistente = await Entrega.findOne({ where: { pedido_id } })

    if (entregaExistente) {
        throw new Error('Esse pedido já possui uma entrega registrada')
    }

    const cepLimpo = somenteNumeros(cep)

    if (!validaCEP(cepLimpo)) {
        throw new Error('CEP inválido')
    }

    const novaEntrega = await Entrega.create({
        pedido_id,
        status: status || 'PREPARANDO',
        codigo_rastreio: gerarCodigoRastreio(pedido_id),
        cep: cepLimpo,
        rua,
        numero,
        bairro,
        cidade,
        uf: String(uf).toUpperCase(),
        previsao_entrega: calcularPrevisaoEntrega(7)
    })

    return await Entrega.findByPk(novaEntrega.id, { include: INCLUDE_PEDIDO })
}

// GET /entregas - painel de logística (somente ADMIN)
async function listEntregas(filtros = {}) {

    const where = {}

    if (filtros.status) {
        where.status = String(filtros.status).toUpperCase()
    }

    return await Entrega.findAll({
        where,
        include: INCLUDE_PEDIDO,
        order: [['id', 'DESC']]
    })
}

// GET /entregas/minhas-entregas - o cliente acompanha as próprias entregas
async function listMinhasEntregas(usuario_id) {
    return await Entrega.findAll({
        include: [{
            model: Pedido,
            as: 'pedidoEntrega',
            attributes: ['id', 'usuario_id', 'status', 'total'],
            where: { usuario_id }
        }],
        order: [['id', 'DESC']]
    })
}

async function findEntregaById(id, usuarioLogado) {

    const entrega = await Entrega.findByPk(id, { include: INCLUDE_PEDIDO })

    if (!entrega) {
        throw new Error('Entrega não encontrada')
    }

    if (usuarioLogado.nivel_acesso !== 'ADMIN' &&
        entrega.pedidoEntrega.usuario_id !== Number(usuarioLogado.id)) {
        throw new Error('Você não tem permissão para ver essa entrega')
    }

    return entrega
}

// GET /entregas/buscar?s=termo - consulta por código de rastreio ou código do pedido
async function searchEntregas(busca) {

    if (!busca || typeof busca !== 'string') {
        throw new Error('Termo de busca ausente ou inválido')
    }

    const filtros = [
        { codigo_rastreio: { [Op.like]: `%${busca}%` } },
        { cidade: { [Op.like]: `%${busca}%` } }
    ]

    if (!isNaN(busca)) {
        filtros.push({ id: Number(busca) })
        filtros.push({ pedido_id: Number(busca) })
    }

    return await Entrega.findAll({
        where: { [Op.or]: filtros },
        include: INCLUDE_PEDIDO
    })
}

// PUT /entregas/:id - atualização completa do endereço e do status
async function updateEntrega(id, dados) {

    const entrega = await Entrega.findByPk(id)

    if (!entrega) {
        throw new Error('Entrega não encontrada')
    }

    const { status, cep, rua, numero, bairro, cidade, uf } = dados

    if (!status || !cep || !rua || !numero || !bairro || !cidade || !uf) {
        throw new Error('No PUT status e endereço completo são obrigatórios')
    }

    const statusNovo = String(status).toUpperCase()

    if (!STATUS_VALIDOS.includes(statusNovo)) {
        throw new Error(`Status inválido. Use: ${STATUS_VALIDOS.join(', ')}`)
    }

    const cepLimpo = somenteNumeros(cep)

    if (!validaCEP(cepLimpo)) {
        throw new Error('CEP inválido')
    }

    await entrega.update({
        status: statusNovo,
        cep: cepLimpo,
        rua,
        numero,
        bairro,
        cidade,
        uf: String(uf).toUpperCase(),
        data_entrega: statusNovo === 'ENTREGUE' ? new Date() : null
    })

    return await Entrega.findByPk(id, { include: INCLUDE_PEDIDO })
}

// PATCH /entregas/:id - muda só o status do rastreamento
async function patchEntrega(id, dados) {

    const entrega = await Entrega.findByPk(id)

    if (!entrega) {
        throw new Error('Entrega não encontrada')
    }

    const permitidos = {}

    if (dados.status) {
        const statusNovo = String(dados.status).toUpperCase()

        if (!STATUS_VALIDOS.includes(statusNovo)) {
            throw new Error(`Status inválido. Use: ${STATUS_VALIDOS.join(', ')}`)
        }

        permitidos.status = statusNovo

        // Quando marca como ENTREGUE grava a data real da entrega
        if (statusNovo === 'ENTREGUE') {
            permitidos.data_entrega = new Date()
        }
    }

    if (dados.previsao_entrega) permitidos.previsao_entrega = dados.previsao_entrega
    if (dados.rua) permitidos.rua = dados.rua
    if (dados.numero) permitidos.numero = dados.numero
    if (dados.bairro) permitidos.bairro = dados.bairro
    if (dados.cidade) permitidos.cidade = dados.cidade
    if (dados.uf) permitidos.uf = String(dados.uf).toUpperCase()

    if (dados.cep) {
        const cepLimpo = somenteNumeros(dados.cep)
        if (!validaCEP(cepLimpo)) {
            throw new Error('CEP inválido')
        }
        permitidos.cep = cepLimpo
    }

    if (Object.keys(permitidos).length === 0) {
        throw new Error('Nenhum campo válido foi enviado para atualização')
    }

    await entrega.update(permitidos)

    return await Entrega.findByPk(id, { include: INCLUDE_PEDIDO })
}

async function deleteEntrega(id) {

    const entrega = await Entrega.findByPk(id)

    if (!entrega) {
        throw new Error('Entrega não encontrada')
    }

    if (entrega.status === 'ENTREGUE') {
        throw new Error('Não é possível apagar uma entrega que já foi concluída')
    }

    await entrega.destroy()

    return {
        status: true,
        message: 'Entrega apagada com sucesso'
    }
}

module.exports = {
    createEntrega,
    listEntregas,
    listMinhasEntregas,
    findEntregaById,
    searchEntregas,
    updateEntrega,
    patchEntrega,
    deleteEntrega
}
