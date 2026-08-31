const Pedido = require('../model/Pedido')
const ItemPedido = require('../model/ItemPedido')
const Produto = require('../model/Produto')
const Categoria = require('../model/Categoria')
const Usuario = require('../model/Usuario')
const Estoque = require('../model/Estoque')
const Entrega = require('../model/Entrega')
const db = require('../db/conn')
const { Op } = require('sequelize')

const { calcularDesconto, calcularFrete } = require('../utils/desconto')
const { arredondar, gerarCodigoRastreio, calcularPrevisaoEntrega } = require('../utils/function')

// Estrutura padrão devolvida ao frontend: pedido + itens + entrega
const INCLUDE_COMPLETO = [
    {
        model: ItemPedido,
        as: 'itemPedidoPedido',
        include: [{
            model: Produto,
            as: 'produtoItemPedido',
            attributes: ['id', 'nome', 'imagem_url', 'slug'],
            include: [{
                model: Categoria,
                as: 'categoriaProduto',
                attributes: ['id', 'nome']
            }]
        }]
    },
    {
        model: Entrega,
        as: 'entregaPedido'
    },
    {
        model: Usuario,
        as: 'usuarioPedido',
        attributes: ['id', 'nome', 'email']
    }
]

// ==========================================================
// |  POST /pedidos - CHECKOUT (rota privada)               |
// |  1. valida o carrinho vindo do LocalStorage            |
// |  2. confere o estoque de cada item                     |
// |  3. aplica as regras de desconto e o frete             |
// |  4. cria pedido + itens + entrega                      |
// |  5. deduz o estoque e registra a saída na tabela       |
// ==========================================================
async function createPedido(dados, usuarioLogado) {

    const { itens, cupom, forma_pagamento, observacao } = dados

    if (!Array.isArray(itens) || itens.length === 0) {
        throw new Error('O carrinho está vazio')
    }

    // Verifica a existência prévia do usuário logado
    const usuario = await Usuario.findByPk(usuarioLogado.id)

    if (!usuario) {
        throw new Error('Usuário não encontrado')
    }

    // ---------- monta os itens conferindo produto e estoque ----------
    const itensValidados = []
    let subtotal = 0
    let quantidadeTotal = 0

    for (const item of itens) {

        if (!item.produto_id || !item.quantidade) {
            throw new Error('Todo item do carrinho precisa de produto e quantidade')
        }

        if (Number(item.quantidade) < 1) {
            throw new Error('A quantidade de cada item deve ser de pelo menos 1')
        }

        // O mesmo produto não pode aparecer duas vezes no carrinho
        if (itensValidados.some(i => i.produto_id === Number(item.produto_id))) {
            throw new Error('O mesmo produto foi enviado duas vezes no carrinho')
        }

        const produto = await Produto.findByPk(item.produto_id)

        if (!produto) {
            throw new Error(`Produto de código ${item.produto_id} não encontrado`)
        }

        if (!produto.status) {
            throw new Error(`O produto ${produto.nome} não está mais disponível para venda`)
        }

        // ---------- CONTROLE DE ESTOQUE ----------
        if (produto.estoque_atual <= 0) {
            throw new Error(`O produto ${produto.nome} está esgotado`)
        }

        if (produto.estoque_atual < Number(item.quantidade)) {
            throw new Error(`Estoque insuficiente para ${produto.nome}: restam apenas ${produto.estoque_atual} unidade(s)`)
        }

        // O preço vem SEMPRE do banco, nunca do que o frontend mandou
        const preco_unitario = produto.preco
        const subtotalItem = arredondar(preco_unitario * Number(item.quantidade))

        itensValidados.push({
            produto,
            produto_id: produto.id,
            nome_produto: produto.nome,
            quantidade: Number(item.quantidade),
            preco_unitario,
            subtotal: subtotalItem
        })

        subtotal = arredondar(subtotal + subtotalItem)
        quantidadeTotal += Number(item.quantidade)
    }

    // ---------- regras de desconto e frete ----------
    const resultadoDesconto = calcularDesconto(subtotal, quantidadeTotal, cupom)
    const subtotalComDesconto = arredondar(subtotal - resultadoDesconto.desconto)
    const frete = calcularFrete(subtotalComDesconto)
    const total = arredondar(subtotalComDesconto + frete)

    if (total <= 0) {
        throw new Error('O valor total do pedido deve ser maior que zero')
    }

    // ---------- grava tudo dentro de uma transação ----------
    const transacao = await db.transaction()

    try {
        const pedido = await Pedido.create({
            usuario_id: usuario.id,
            status: 'PENDENTE',
            subtotal,
            desconto: resultadoDesconto.desconto,
            frete,
            total,
            cupom: resultadoDesconto.cupom,
            forma_pagamento: forma_pagamento || 'PIX',
            observacao: observacao || null
        }, { transaction: transacao })

        for (const item of itensValidados) {

            await ItemPedido.create({
                pedido_id: pedido.id,
                produto_id: item.produto_id,
                nome_produto: item.nome_produto,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
                subtotal: item.subtotal
            }, { transaction: transacao })

            // ---------- dedução automática do estoque ----------
            const saldo_anterior = item.produto.estoque_atual
            const saldo_atual = saldo_anterior - item.quantidade

            await item.produto.update({ estoque_atual: saldo_atual }, { transaction: transacao })

            await Estoque.create({
                produto_id: item.produto_id,
                tipo: 'SAIDA',
                quantidade: item.quantidade,
                saldo_anterior,
                saldo_atual,
                motivo: `Venda do pedido numero ${pedido.id}`,
                data: new Date()
            }, { transaction: transacao })
        }

        // ---------- gera a entrega com o endereço do cadastro ----------
        await Entrega.create({
            pedido_id: pedido.id,
            status: 'PREPARANDO',
            codigo_rastreio: gerarCodigoRastreio(pedido.id),
            cep: usuario.cep,
            rua: usuario.rua,
            numero: usuario.numero,
            bairro: usuario.bairro,
            cidade: usuario.cidade,
            uf: usuario.uf,
            previsao_entrega: calcularPrevisaoEntrega(7)
        }, { transaction: transacao })

        await transacao.commit()

        const pedidoCompleto = await Pedido.findByPk(pedido.id, { include: INCLUDE_COMPLETO })

        return {
            pedido: pedidoCompleto,
            resumo: {
                subtotal,
                desconto: resultadoDesconto.desconto,
                frete,
                total,
                regras_aplicadas: resultadoDesconto.regras
            }
        }
    } catch (err) {
        await transacao.rollback()
        throw err
    }
}

// GET /pedidos - todos os pedidos da loja (somente ADMIN)
async function listPedidos(filtros = {}) {

    const where = {}

    if (filtros.status) {
        where.status = String(filtros.status).toUpperCase()
    }

    if (filtros.usuario_id) {
        where.usuario_id = Number(filtros.usuario_id)
    }

    return await Pedido.findAll({
        where,
        include: INCLUDE_COMPLETO,
        order: [['id', 'DESC']]
    })
}

// GET /pedidos/meus-pedidos - histórico de compras do cliente logado
async function listMeusPedidos(usuario_id) {
    return await Pedido.findAll({
        where: { usuario_id },
        include: INCLUDE_COMPLETO,
        order: [['id', 'DESC']]
    })
}

// GET /pedidos/:id - o cliente só enxerga o próprio pedido
async function findPedidoById(id, usuarioLogado) {

    const pedido = await Pedido.findByPk(id, { include: INCLUDE_COMPLETO })

    if (!pedido) {
        throw new Error('Pedido não encontrado')
    }

    if (pedido.usuario_id !== Number(usuarioLogado.id) && usuarioLogado.nivel_acesso !== 'ADMIN') {
        throw new Error('Você não tem permissão para ver esse pedido')
    }

    return pedido
}

// GET /pedidos/buscar?s=termo - consulta por código do pedido ou nome do cliente
async function searchPedidos(busca) {

    if (!busca || typeof busca !== 'string') {
        throw new Error('Termo de busca ausente ou inválido')
    }

    if (!isNaN(busca)) {
        return await Pedido.findAll({
            where: { id: Number(busca) },
            include: INCLUDE_COMPLETO
        })
    }

    return await Pedido.findAll({
        include: [
            {
                model: Usuario,
                as: 'usuarioPedido',
                attributes: ['id', 'nome', 'email'],
                where: {
                    [Op.or]: [
                        { nome: { [Op.like]: `%${busca}%` } },
                        { email: { [Op.like]: `%${busca}%` } }
                    ]
                }
            },
            {
                model: ItemPedido,
                as: 'itemPedidoPedido'
            },
            {
                model: Entrega,
                as: 'entregaPedido'
            }
        ],
        order: [['id', 'DESC']]
    })
}

// PUT /pedidos/:id - o admin atualiza status e forma de pagamento
async function updatePedido(id, dados) {

    const pedido = await Pedido.findByPk(id)

    if (!pedido) {
        throw new Error('Pedido não encontrado')
    }

    const { status, forma_pagamento } = dados

    if (!status || !forma_pagamento) {
        throw new Error('No PUT status e forma de pagamento são obrigatórios')
    }

    const statusValidos = ['PENDENTE', 'PAGO', 'CANCELADO']

    if (!statusValidos.includes(String(status).toUpperCase())) {
        throw new Error('Status inválido. Use PENDENTE, PAGO ou CANCELADO')
    }

    await pedido.update({
        status: String(status).toUpperCase(),
        forma_pagamento: String(forma_pagamento).toUpperCase()
    })

    return await Pedido.findByPk(id, { include: INCLUDE_COMPLETO })
}

// PATCH /pedidos/:id - troca apenas o status do pedido
async function patchPedido(id, dados) {

    const pedido = await Pedido.findByPk(id)

    if (!pedido) {
        throw new Error('Pedido não encontrado')
    }

    const permitidos = {}

    if (dados.status) {
        const statusValidos = ['PENDENTE', 'PAGO', 'CANCELADO']
        if (!statusValidos.includes(String(dados.status).toUpperCase())) {
            throw new Error('Status inválido. Use PENDENTE, PAGO ou CANCELADO')
        }
        permitidos.status = String(dados.status).toUpperCase()
    }

    if (dados.forma_pagamento) permitidos.forma_pagamento = String(dados.forma_pagamento).toUpperCase()
    if (dados.observacao !== undefined) permitidos.observacao = dados.observacao

    if (Object.keys(permitidos).length === 0) {
        throw new Error('Nenhum campo válido foi enviado para atualização')
    }

    await pedido.update(permitidos)

    return await Pedido.findByPk(id, { include: INCLUDE_COMPLETO })
}

// DELETE /pedidos/:id - cancela o pedido e devolve os itens para o estoque
async function deletePedido(id) {

    const pedido = await Pedido.findByPk(id, {
        include: [{ model: ItemPedido, as: 'itemPedidoPedido' }]
    })

    if (!pedido) {
        throw new Error('Pedido não encontrado')
    }

    const transacao = await db.transaction()

    try {
        // Devolve para o estoque tudo que foi vendido nesse pedido
        for (const item of pedido.itemPedidoPedido) {

            const produto = await Produto.findByPk(item.produto_id)

            if (produto) {
                const saldo_anterior = produto.estoque_atual
                const saldo_atual = saldo_anterior + item.quantidade

                await produto.update({ estoque_atual: saldo_atual }, { transaction: transacao })

                await Estoque.create({
                    produto_id: item.produto_id,
                    tipo: 'ENTRADA',
                    quantidade: item.quantidade,
                    saldo_anterior,
                    saldo_atual,
                    motivo: `Estorno do cancelamento do pedido numero ${pedido.id}`,
                    data: new Date()
                }, { transaction: transacao })
            }
        }

        await pedido.destroy({ transaction: transacao })

        await transacao.commit()

        return {
            status: true,
            message: 'Pedido cancelado e estoque devolvido com sucesso'
        }
    } catch (err) {
        await transacao.rollback()
        throw err
    }
}

module.exports = {
    createPedido,
    listPedidos,
    listMeusPedidos,
    findPedidoById,
    searchPedidos,
    updatePedido,
    patchPedido,
    deletePedido
}
