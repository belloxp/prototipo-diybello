// ==========================================================
// |  DIYBELLO - MOVIMENTAÇÃO DE VENDAS (privada ADMIN)     |
// |  GET    /pedidos          - todos os pedidos           |
// |  GET    /pedidos/buscar?s= - consulta                  |
// |  PATCH  /pedidos/:id      - muda o status do pedido    |
// |  DELETE /pedidos/:id      - cancela e estorna estoque  |
// |  PATCH  /entregas/:id     - muda o status da entrega   |
// ==========================================================

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

let pedidosCarregados = []

document.addEventListener('DOMContentLoaded', () => {

    if (!protegerTela(true)) return

    listarPedidos()

    document.getElementById('btn_listar').addEventListener('click', listarPedidos)

    document.getElementById('form_busca').addEventListener('submit', (e) => {
        e.preventDefault()
        consultarPedidos()
    })
})

function listarPedidos(manterMensagem) {

    // depois de salvar/apagar a mensagem de sucesso precisa sobreviver ao recarregar da lista
    if (!manterMensagem) limparMensagem('resposta')

    const status = document.getElementById('filtro_status').value
    const filtros = status ? `?status=${status}` : ''

    fetch(`${API_URL}/pedidos${filtros}`, {
        headers: cabecalhoAutorizacao()
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            pedidosCarregados = dados
            desenharIndicadores(dados)
            desenharPedidos(dados)
        })
        .catch((err) => {
            console.error('Erro ao consultar os pedidos!', err)
            mostrarMensagem('resposta', 'Não foi possível carregar os pedidos.', 'erro')
        })
}

function consultarPedidos() {
    const termo = document.getElementById('busca').value.trim()

    if (!termo) {
        listarPedidos()
        return
    }

    fetch(`${API_URL}/pedidos/buscar?s=${encodeURIComponent(termo)}`, {
        headers: cabecalhoAutorizacao()
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            pedidosCarregados = dados
            desenharPedidos(dados)
        })
        .catch((err) => {
            console.error('Erro ao consultar os pedidos!', err)
        })
}

function desenharIndicadores(pedidos) {

    const faturamento = pedidos
        .filter(p => p.status !== 'CANCELADO')
        .reduce((soma, p) => soma + p.total, 0)

    const pagos = pedidos.filter(p => p.status === 'PAGO').length
    const pendentes = pedidos.filter(p => p.status === 'PENDENTE').length

    document.getElementById('indicadores').innerHTML = `
        <div class="indicador"><span>Pedidos</span><strong>${pedidos.length}</strong></div>
        <div class="indicador"><span>Pagos</span><strong>${pagos}</strong></div>
        <div class="indicador"><span>Aguardando pagamento</span><strong>${pendentes}</strong></div>
        <div class="indicador"><span>Faturamento</span><strong>${formatarPreco(faturamento)}</strong></div>
    `
}

function desenharPedidos(pedidos) {

    const lista = document.getElementById('lista_pedidos')

    if (pedidos.length === 0) {
        lista.innerHTML = '<div class="vazio">Nenhum pedido encontrado.</div>'
        return
    }

    lista.innerHTML = pedidos.map(pedido => {

        const cliente = pedido.usuarioPedido
        const entrega = pedido.entregaPedido

        const itens = (pedido.itemPedidoPedido || []).map(item => ([
            item.produto_id,
            item.nome_produto,
            item.quantidade,
            formatarPreco(item.preco_unitario),
            formatarPreco(item.subtotal)
        ]))

        let blocoEntrega = '<p class="ajuda">Sem entrega registrada.</p>'

        if (entrega) {
            blocoEntrega = `
                <p class="ajuda">
                    Rastreio <strong>${entrega.codigo_rastreio}</strong><br>
                    ${entrega.rua}, ${entrega.numero} - ${entrega.bairro}<br>
                    ${entrega.cidade} / ${entrega.uf} - CEP ${entrega.cep}<br>
                    Previsão: ${formatarData(entrega.previsao_entrega)}
                </p>
                <div class="campo" style="margin-top: 10px;">
                    <label for="entrega_${entrega.id}">Status da entrega</label>
                    <select id="entrega_${entrega.id}" class="select_entrega" data-id="${entrega.id}">
                        <option value="PREPARANDO" ${entrega.status === 'PREPARANDO' ? 'selected' : ''}>Preparando</option>
                        <option value="EM_TRANSITO" ${entrega.status === 'EM_TRANSITO' ? 'selected' : ''}>Em trânsito</option>
                        <option value="ENTREGUE" ${entrega.status === 'ENTREGUE' ? 'selected' : ''}>Entregue</option>
                        <option value="CANCELADA" ${entrega.status === 'CANCELADA' ? 'selected' : ''}>Cancelada</option>
                    </select>
                </div>
            `
        }

        return `
            <section class="painel">
                <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h2>Pedido número ${pedido.id}</h2>
                        <p class="ajuda">
                            Cliente: <strong>${cliente ? cliente.nome : '-'}</strong> (${cliente ? cliente.email : '-'})<br>
                            Data: ${formatarData(pedido.createdAt)} - pagamento via ${pedido.forma_pagamento}
                            ${pedido.cupom ? `- cupom ${pedido.cupom}` : ''}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <span class="etiqueta ${CORES_STATUS_PEDIDO[pedido.status]}">${pedido.status}</span>
                        ${entrega ? `<br><span class="etiqueta ${CORES_STATUS_ENTREGA[entrega.status]}" style="margin-top: 6px;">${formatarStatusEntrega(entrega.status)}</span>` : ''}
                    </div>
                </div>

                <div class="duas_colunas" style="margin-top: 14px;">
                    <div>
                        ${montarTabela(['Cód.', 'Produto', 'Qtd.', 'Unitário', 'Subtotal'], itens)}

                        <div style="margin-top: 12px;">
                            <div class="resumo_linha"><span>Subtotal</span><span>${formatarPreco(pedido.subtotal)}</span></div>
                            <div class="resumo_linha"><span>Desconto</span><span>- ${formatarPreco(pedido.desconto)}</span></div>
                            <div class="resumo_linha"><span>Frete</span><span>${pedido.frete === 0 ? 'Grátis' : formatarPreco(pedido.frete)}</span></div>
                            <div class="resumo_linha total"><span>Total</span><span>${formatarPreco(pedido.total)}</span></div>
                        </div>

                        ${pedido.observacao ? `<div class="regras_desconto"><strong>Observação do cliente:</strong><br>${pedido.observacao}</div>` : ''}
                    </div>

                    <div>
                        <h3>Entrega</h3>
                        ${blocoEntrega}

                        <div class="campo" style="margin-top: 14px;">
                            <label for="pedido_${pedido.id}">Status do pedido</label>
                            <select id="pedido_${pedido.id}" class="select_pedido" data-id="${pedido.id}">
                                <option value="PENDENTE" ${pedido.status === 'PENDENTE' ? 'selected' : ''}>Pendente</option>
                                <option value="PAGO" ${pedido.status === 'PAGO' ? 'selected' : ''}>Pago</option>
                                <option value="CANCELADO" ${pedido.status === 'CANCELADO' ? 'selected' : ''}>Cancelado</option>
                            </select>
                        </div>

                        <button class="botao_perigo botao_bloco btn_cancelar_pedido" data-id="${pedido.id}">
                            Cancelar pedido e devolver ao estoque
                        </button>
                    </div>
                </div>
            </section>
        `
    }).join('')

    ligarEventos()
}

function ligarEventos() {

    // PATCH /pedidos/:id
    document.querySelectorAll('.select_pedido').forEach(select => {
        select.addEventListener('change', () => {
            atualizarStatusPedido(select.dataset.id, select.value)
        })
    })

    // PATCH /entregas/:id
    document.querySelectorAll('.select_entrega').forEach(select => {
        select.addEventListener('change', () => {
            atualizarStatusEntrega(select.dataset.id, select.value)
        })
    })

    // DELETE /pedidos/:id
    document.querySelectorAll('.btn_cancelar_pedido').forEach(botao => {
        botao.addEventListener('click', () => {
            confirmarCancelamento(botao.dataset.id)
        })
    })
}

function atualizarStatusPedido(id, status) {
    fetch(`${API_URL}/pedidos/${id}`, {
        method: 'PATCH',
        headers: cabecalhoAutorizacao(),
        body: JSON.stringify({ status: status })
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            mostrarMensagem('resposta', `Pedido ${id} atualizado para ${status}.`, 'sucesso')
            listarPedidos(true)
        })
        .catch((err) => {
            console.error('Erro ao atualizar o pedido!', err)
        })
}

function atualizarStatusEntrega(id, status) {
    fetch(`${API_URL}/entregas/${id}`, {
        method: 'PATCH',
        headers: cabecalhoAutorizacao(),
        body: JSON.stringify({ status: status })
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            mostrarMensagem('resposta', `Entrega ${id} atualizada para ${formatarStatusEntrega(status)}.`, 'sucesso')
            listarPedidos(true)
        })
        .catch((err) => {
            console.error('Erro ao atualizar a entrega!', err)
        })
}

// DELETE /pedidos/:id - confirmação em modal
function confirmarCancelamento(id) {

    const pedido = pedidosCarregados.find(p => p.id === Number(id))

    const itens = pedido && pedido.itemPedidoPedido
        ? pedido.itemPedidoPedido
            .map(i => `${i.quantidade}x ${i.nome_produto}`)
            .join('<br>')
        : ''

    confirmarAcao({
        titulo: 'Cancelar pedido',
        mensagem: `Cancelar o pedido nº <strong>${id}</strong>${pedido && pedido.usuarioPedido ? ` de <strong>${pedido.usuarioPedido.nome}</strong>` : ''}?`,
        detalhe: `Os itens abaixo voltam para o estoque e o pedido sai do histórico:<br><br>${itens || 'Sem itens registrados.'}`,
        textoConfirmar: 'Cancelar pedido',
        perigo: true,
        aoConfirmar: () => cancelarPedido(id)
    })
}

function cancelarPedido(id) {

    fetch(`${API_URL}/pedidos/${id}`, {
        method: 'DELETE',
        headers: cabecalhoAutorizacao()
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            mostrarMensagem('resposta', dados.message, 'sucesso')
            listarPedidos(true)
        })
        .catch((err) => {
            console.error('Erro ao cancelar o pedido!', err)
        })
}
