const Estoque = require('../model/Estoque')
const Produto = require('../model/Produto')
const db = require('../db/conn')
const { Op } = require('sequelize')

const INCLUDE_PRODUTO = [{
    model: Produto,
    as: 'produtoEstoque',
    attributes: ['id', 'nome', 'estoque_atual', 'imagem_url']
}]

// POST /estoque - registra entrada ou saída manual feita pelo administrador
async function createEstoque(dados) {

    const { produto_id, tipo, quantidade, motivo, data } = dados

    if (!produto_id || !tipo || quantidade === undefined) {
        throw new Error('Produto, tipo e quantidade são obrigatórios')
    }

    const tipoMovimento = String(tipo).toUpperCase()

    if (tipoMovimento !== 'ENTRADA' && tipoMovimento !== 'SAIDA') {
        throw new Error('O tipo da movimentação deve ser ENTRADA ou SAIDA')
    }

    if (Number(quantidade) < 1) {
        throw new Error('A quantidade movimentada deve ser de pelo menos 1 item')
    }

    // Verifica a existência prévia do produto antes de mexer no estoque
    const produto = await Produto.findByPk(produto_id)

    if (!produto) {
        throw new Error('Produto não encontrado para movimentar o estoque')
    }

    const saldo_anterior = produto.estoque_atual
    let saldo_atual = saldo_anterior

    if (tipoMovimento === 'ENTRADA') {
        saldo_atual = saldo_anterior + Number(quantidade)
    } else {
        // Não deixa o saldo do estoque ficar negativo
        if (saldo_anterior < Number(quantidade)) {
            throw new Error(`Estoque insuficiente: o produto ${produto.nome} possui apenas ${saldo_anterior} unidade(s)`)
        }
        saldo_atual = saldo_anterior - Number(quantidade)
    }

    // A movimentação e o saldo do produto andam juntos dentro de uma transação
    const transacao = await db.transaction()

    try {
        const movimento = await Estoque.create({
            produto_id,
            tipo: tipoMovimento,
            quantidade: Number(quantidade),
            saldo_anterior,
            saldo_atual,
            motivo: motivo || (tipoMovimento === 'ENTRADA' ? 'Entrada manual do administrador' : 'Saída manual do administrador'),
            data: data || new Date()
        }, { transaction: transacao })

        await produto.update({ estoque_atual: saldo_atual }, { transaction: transacao })

        await transacao.commit()

        return await Estoque.findByPk(movimento.id, { include: INCLUDE_PRODUTO })
    } catch (err) {
        await transacao.rollback()
        throw err
    }
}

// GET /estoque - histórico de movimentações
async function listEstoque(filtros = {}) {

    const where = {}

    if (filtros.produto_id) {
        where.produto_id = Number(filtros.produto_id)
    }

    if (filtros.tipo) {
        where.tipo = String(filtros.tipo).toUpperCase()
    }

    return await Estoque.findAll({
        where,
        include: INCLUDE_PRODUTO,
        order: [['id', 'DESC']]
    })
}

async function findEstoqueById(id) {
    const movimento = await Estoque.findByPk(id, { include: INCLUDE_PRODUTO })

    if (!movimento) {
        throw new Error('Movimentação de estoque não encontrada')
    }

    return movimento
}

// GET /estoque/buscar?s=termo - consulta as movimentações pelo nome do produto
async function searchEstoque(busca) {

    if (!busca || typeof busca !== 'string') {
        throw new Error('Termo de busca ausente ou inválido')
    }

    const where = {}

    if (!isNaN(busca)) {
        where[Op.or] = [{ id: Number(busca) }, { produto_id: Number(busca) }]
    }

    return await Estoque.findAll({
        where,
        include: [{
            model: Produto,
            as: 'produtoEstoque',
            attributes: ['id', 'nome', 'estoque_atual', 'imagem_url'],
            where: isNaN(busca) ? { nome: { [Op.like]: `%${busca}%` } } : undefined
        }],
        order: [['id', 'DESC']]
    })
}

// PUT /estoque/:id - corrige uma movimentação inteira e recalcula o saldo do produto
async function updateEstoque(id, dados) {

    const movimento = await Estoque.findByPk(id)

    if (!movimento) {
        throw new Error('Movimentação de estoque não encontrada')
    }

    const { tipo, quantidade, motivo } = dados

    if (!tipo || quantidade === undefined) {
        throw new Error('No PUT tipo e quantidade são obrigatórios')
    }

    const tipoMovimento = String(tipo).toUpperCase()

    if (tipoMovimento !== 'ENTRADA' && tipoMovimento !== 'SAIDA') {
        throw new Error('O tipo da movimentação deve ser ENTRADA ou SAIDA')
    }

    if (Number(quantidade) < 1) {
        throw new Error('A quantidade movimentada deve ser de pelo menos 1 item')
    }

    const produto = await Produto.findByPk(movimento.produto_id)

    if (!produto) {
        throw new Error('Produto da movimentação não existe mais')
    }

    // Desfaz o efeito antigo e aplica o efeito novo sobre o saldo atual
    const efeitoAntigo = movimento.tipo === 'ENTRADA' ? movimento.quantidade : -movimento.quantidade
    const efeitoNovo = tipoMovimento === 'ENTRADA' ? Number(quantidade) : -Number(quantidade)

    const saldo_anterior = produto.estoque_atual - efeitoAntigo
    const saldo_atual = saldo_anterior + efeitoNovo

    if (saldo_atual < 0) {
        throw new Error('A correção deixaria o estoque negativo')
    }

    const transacao = await db.transaction()

    try {
        await movimento.update({
            tipo: tipoMovimento,
            quantidade: Number(quantidade),
            saldo_anterior,
            saldo_atual,
            motivo: motivo || movimento.motivo
        }, { transaction: transacao })

        await produto.update({ estoque_atual: saldo_atual }, { transaction: transacao })

        await transacao.commit()

        return await Estoque.findByPk(id, { include: INCLUDE_PRODUTO })
    } catch (err) {
        await transacao.rollback()
        throw err
    }
}

// PATCH /estoque/:id - ajusta apenas o motivo/data do lançamento
async function patchEstoque(id, dados) {

    const movimento = await Estoque.findByPk(id)

    if (!movimento) {
        throw new Error('Movimentação de estoque não encontrada')
    }

    const permitidos = {}

    if (dados.motivo !== undefined) permitidos.motivo = dados.motivo
    if (dados.data) permitidos.data = dados.data

    if (Object.keys(permitidos).length === 0) {
        throw new Error('No PATCH só é possível ajustar o motivo e a data. Para mudar quantidade use o PUT')
    }

    await movimento.update(permitidos)

    return await Estoque.findByPk(id, { include: INCLUDE_PRODUTO })
}

// DELETE /estoque/:id - estorna a movimentação e devolve o saldo do produto
async function deleteEstoque(id) {

    const movimento = await Estoque.findByPk(id)

    if (!movimento) {
        throw new Error('Movimentação de estoque não encontrada')
    }

    const produto = await Produto.findByPk(movimento.produto_id)

    if (!produto) {
        await movimento.destroy()
        return { status: true, message: 'Movimentação apagada com sucesso' }
    }

    const efeito = movimento.tipo === 'ENTRADA' ? movimento.quantidade : -movimento.quantidade
    const saldo_atual = produto.estoque_atual - efeito

    if (saldo_atual < 0) {
        throw new Error('Não é possível estornar: o estoque ficaria negativo')
    }

    const transacao = await db.transaction()

    try {
        await produto.update({ estoque_atual: saldo_atual }, { transaction: transacao })
        await movimento.destroy({ transaction: transacao })

        await transacao.commit()

        return {
            status: true,
            message: 'Movimentação estornada e apagada com sucesso'
        }
    } catch (err) {
        await transacao.rollback()
        throw err
    }
}

module.exports = {
    createEstoque,
    listEstoque,
    findEstoqueById,
    searchEstoque,
    updateEstoque,
    patchEstoque,
    deleteEstoque
}
