// ==========================================================
// |  DIYBELLO - MEUS PEDIDOS (cliente logado)              |
// |  GET /pedidos/meus-pedidos - histórico de compras com  |
// |  o status do pedido e o rastreio da entrega.           |
// ==========================================================

// Cor da etiqueta conforme o status do pedido
const CORES_STATUS_PEDIDO = {
    PENDENTE: 'dourada',
    PAGO: 'verde',
    CANCELADO: 'vermelha'
}

const CORES_STATUS_ENTREGA = {
    PREPARANDO: 'dourada',
    EM_TRANSITO: 'azul',
    ENTREGUE: 'verde',
    CANCELADA: 'vermelha'
}

document.addEventListener('DOMContentLoaded', () => {

    if (!protegerTela()) return

    carregarPedidos()
})

// GET /pedidos/meus-pedidos
function carregarPedidos() {

    limparMensagem('resposta')

    fetch(`${API_URL}/pedidos/meus-pedidos`, {
        headers: cabecalhoAutorizacao()
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            desenharIndicadores(dados)
            desenharPedidos(dados)
        })
        .catch((err) => {
            console.error('Erro ao consultar os pedidos!', err)
            mostrarMensagem('resposta', 'Não foi possível carregar seus pedidos.', 'erro')
        })
}

// Painel com os números gerais das compras
function desenharIndicadores(pedidos) {

    const totalGasto = pedidos
        .filter(p => p.status !== 'CANCELADO')
        .reduce((soma, p) => soma + p.total, 0)

    const entregues = pedidos.filter(p => p.entregaPedido && p.entregaPedido.status === 'ENTREGUE').length
    const emAndamento = pedidos.filter(p => p.entregaPedido &&
        ['PREPARANDO', 'EM_TRANSITO'].includes(p.entregaPedido.status)).length

    const indicadores = [
        { rotulo: 'Pedidos feitos', valor: pedidos.length },
        { rotulo: 'Total investido', valor: formatarPreco(totalGasto) },
        { rotulo: 'A caminho', valor: emAndamento },
        { rotulo: 'Já entregues', valor: entregues }
    ]

    document.getElementById('indicadores').innerHTML = indicadores.map(i => `
        <div class="indicador">
            <span>${i.rotulo}</span>
            <strong>${i.valor}</strong>
        </div>
    `).join('')
}

// Lista de pedidos, um painel por compra
function desenharPedidos(pedidos) {

    const elemento = document.getElementById('lista_pedidos')

    if (pedidos.length === 0) {
        elemento.innerHTML = `
            <div class="vazio">
                <p>Você ainda não fez nenhum pedido.</p>
                <p><a href="./loja.html">Ir para a loja</a> e escolher a sua primeira caixa!</p>
            </div>
        `
        return
    }

    elemento.innerHTML = pedidos.map(pedido => {

        const itens = (pedido.itemPedidoPedido || []).map(item => `
            <div class="resumo_item">
                <img src="${resolverImagem(item.produtoItemPedido ? item.produtoItemPedido.imagem_url : '')}" alt="${item.nome_produto}">
                <span class="resumo_item_nome">${item.quantidade}x ${item.nome_produto}</span>
                <span class="resumo_item_preco">${formatarPreco(item.subtotal)}</span>
            </div>
        `).join('')

        const entrega = pedido.entregaPedido
            ? `
                <div class="regras_desconto" style="margin-top: 16px;">
                    <strong>Entrega</strong>
                    <span class="etiqueta ${CORES_STATUS_ENTREGA[pedido.entregaPedido.status] || ''}">
                        ${formatarStatusEntrega(pedido.entregaPedido.status)}
                    </span>
                    <p style="margin-top: 8px;">
                        Rastreio: <strong>${pedido.entregaPedido.codigo_rastreio}</strong><br>
                        Destino: ${pedido.entregaPedido.cidade}/${pedido.entregaPedido.uf}<br>
                        Previsão: ${formatarData(pedido.entregaPedido.previsao_entrega)}
                    </p>
                </div>
            `
            : ''

        return `
            <div class="painel">
                <div class="secao_topo" style="margin-bottom: 16px;">
                    <div>
                        <h2>Pedido #${pedido.id}</h2>
                        <p>${formatarData(pedido.createdAt)} · ${pedido.forma_pagamento}</p>
                    </div>
                    <span class="etiqueta ${CORES_STATUS_PEDIDO[pedido.status] || ''}">${pedido.status}</span>
                </div>

                <div class="resumo_itens" style="max-height: none;">${itens}</div>

                <div class="resumo_valores">
                    <div class="resumo_linha"><span>Subtotal</span><span>${formatarPreco(pedido.subtotal)}</span></div>
                    ${pedido.desconto > 0 ? `<div class="resumo_linha"><span>Desconto${pedido.cupom ? ` (${pedido.cupom})` : ''}</span><span>- ${formatarPreco(pedido.desconto)}</span></div>` : ''}
                    <div class="resumo_linha"><span>Frete</span><span>${pedido.frete > 0 ? formatarPreco(pedido.frete) : 'Grátis'}</span></div>
                    <div class="resumo_linha total"><span>Total</span><span>${formatarPreco(pedido.total)}</span></div>
                </div>

                ${entrega}
            </div>
        `
    }).join('')
}
