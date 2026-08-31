const Pedido = require('../model/Pedido')
const ItemPedido = require('../model/ItemPedido')
const Produto = require('../model/Produto')
const Categoria = require('../model/Categoria')
const Estoque = require('../model/Estoque')
const { Op } = require('sequelize')

const { arredondar } = require('../utils/function')

// Os agrupamentos são feitos em JavaScript depois de buscar os registros.
// Fica mais simples de ler e não depende de função específica do MySQL.

// =====================================================
// |  RELATÓRIO 1 - VENDAS                             |
// |  - vendas por categoria de hobby                  |
// |  - faturamento mensal                             |
// |  - produtos mais vendidos                         |
// =====================================================
async function relatorioVendas() {

    // Todos os pedidos que não foram cancelados
    const pedidos = await Pedido.findAll({
        where: { status: { [Op.ne]: 'CANCELADO' } },
        include: [{
            model: ItemPedido,
            as: 'itemPedidoPedido',
            include: [{
                model: Produto,
                as: 'produtoItemPedido',
                attributes: ['id', 'nome', 'categoria_id'],
                include: [{
                    model: Categoria,
                    as: 'categoriaProduto',
                    attributes: ['id', 'nome']
                }]
            }]
        }],
        order: [['createdAt', 'ASC']]
    })

    // ---------- vendas por categoria ----------
    const mapaCategorias = {}

    // ---------- produtos mais vendidos ----------
    const mapaProdutos = {}

    // ---------- faturamento mensal ----------
    const mapaMeses = {}

    pedidos.forEach(pedido => {

        // Mês no formato AAAA-MM
        const data = new Date(pedido.createdAt)
        const mes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`

        if (!mapaMeses[mes]) {
            mapaMeses[mes] = { mes, pedidos: 0, faturamento: 0 }
        }

        mapaMeses[mes].pedidos += 1
        mapaMeses[mes].faturamento += pedido.total

        pedido.itemPedidoPedido.forEach(item => {

            const produto = item.produtoItemPedido
            const categoria = produto && produto.categoriaProduto
                ? produto.categoriaProduto.nome
                : 'Sem categoria'

            if (!mapaCategorias[categoria]) {
                mapaCategorias[categoria] = { categoria, quantidade: 0, faturamento: 0 }
            }

            mapaCategorias[categoria].quantidade += item.quantidade
            mapaCategorias[categoria].faturamento += item.subtotal

            if (!mapaProdutos[item.nome_produto]) {
                mapaProdutos[item.nome_produto] = { produto: item.nome_produto, quantidade: 0, faturamento: 0 }
            }

            mapaProdutos[item.nome_produto].quantidade += item.quantidade
            mapaProdutos[item.nome_produto].faturamento += item.subtotal
        })
    })

    const vendas_por_categoria = Object.values(mapaCategorias)
        .map(linha => ({
            categoria: linha.categoria,
            quantidade: linha.quantidade,
            faturamento: arredondar(linha.faturamento)
        }))
        .sort((a, b) => b.faturamento - a.faturamento)

    const faturamento_mensal = Object.values(mapaMeses)
        .map(linha => ({
            mes: linha.mes,
            pedidos: linha.pedidos,
            faturamento: arredondar(linha.faturamento)
        }))
        .sort((a, b) => a.mes.localeCompare(b.mes))

    const produtos_mais_vendidos = Object.values(mapaProdutos)
        .map(linha => ({
            produto: linha.produto,
            quantidade: linha.quantidade,
            faturamento: arredondar(linha.faturamento)
        }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5)

    // ---------- totalizadores do painel ----------
    const totalPedidos = await Pedido.count()
    const totalFaturado = pedidos.reduce((soma, pedido) => soma + pedido.total, 0)
    const totalDescontos = await Pedido.sum('desconto')

    return {
        vendas_por_categoria,
        faturamento_mensal,
        produtos_mais_vendidos,
        totais: {
            pedidos: totalPedidos,
            faturamento: arredondar(totalFaturado),
            descontos: arredondar(totalDescontos || 0),
            ticket_medio: pedidos.length > 0 ? arredondar(totalFaturado / pedidos.length) : 0
        }
    }
}

// =====================================================
// |  RELATÓRIO 2 - ESTOQUE                            |
// |  - saldo atual por produto e por categoria        |
// |  - entradas x saídas do período                   |
// =====================================================
async function relatorioEstoque() {

    // ---------- saldo atual de cada produto ----------
    const produtosBanco = await Produto.findAll({
        attributes: ['id', 'nome', 'estoque_atual', 'preco'],
        include: [{
            model: Categoria,
            as: 'categoriaProduto',
            attributes: ['id', 'nome']
        }],
        order: [['estoque_atual', 'ASC']]
    })

    const saldo_por_produto = produtosBanco.map(produto => ({
        id: produto.id,
        produto: produto.nome,
        categoria: produto.categoriaProduto ? produto.categoriaProduto.nome : '-',
        estoque_atual: produto.estoque_atual,
        valor_imobilizado: arredondar(produto.estoque_atual * produto.preco)
    }))

    // ---------- saldo agrupado por categoria ----------
    const mapaCategorias = {}

    saldo_por_produto.forEach(linha => {
        if (!mapaCategorias[linha.categoria]) {
            mapaCategorias[linha.categoria] = { categoria: linha.categoria, quantidade: 0 }
        }
        mapaCategorias[linha.categoria].quantidade += linha.estoque_atual
    })

    // ---------- entradas x saídas ----------
    const movimentosBanco = await Estoque.findAll({
        attributes: ['tipo', 'quantidade']
    })

    const mapaMovimentos = {
        ENTRADA: { tipo: 'ENTRADA', lancamentos: 0, quantidade: 0 },
        SAIDA: { tipo: 'SAIDA', lancamentos: 0, quantidade: 0 }
    }

    movimentosBanco.forEach(movimento => {
        mapaMovimentos[movimento.tipo].lancamentos += 1
        mapaMovimentos[movimento.tipo].quantidade += movimento.quantidade
    })

    // Alerta de reposição: produtos com 5 unidades ou menos
    const estoque_baixo = saldo_por_produto.filter(linha => linha.estoque_atual <= 5)

    return {
        saldo_por_produto,
        saldo_por_categoria: Object.values(mapaCategorias),
        movimentacoes: Object.values(mapaMovimentos),
        estoque_baixo,
        totais: {
            produtos_cadastrados: saldo_por_produto.length,
            itens_em_estoque: saldo_por_produto.reduce((soma, linha) => soma + linha.estoque_atual, 0),
            valor_imobilizado: arredondar(saldo_por_produto.reduce((soma, linha) => soma + linha.valor_imobilizado, 0)),
            produtos_esgotados: saldo_por_produto.filter(linha => linha.estoque_atual === 0).length
        }
    }
}

module.exports = {
    relatorioVendas,
    relatorioEstoque
}
