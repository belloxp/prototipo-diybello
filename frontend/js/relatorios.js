// ==========================================================
// |  DIYBELLO - RELATÓRIOS (rota privada ADMIN)           |
// |  GET /relatorios/vendas  - faturamento e mais vendidos |
// |  GET /relatorios/estoque - saldo e reposição           |
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {

    if (!protegerTela(true)) return

    carregarVendas()
    carregarEstoque()
})

// ==========================================================
// |  RELATÓRIO DE VENDAS                                   |
// ==========================================================
function carregarVendas() {
    fetch(`${API_URL}/relatorios/vendas`, {
        headers: cabecalhoAutorizacao()
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            desenharIndicadores(dados.totais)

            // Vendas por categoria (gráfico de rosca)
            desenharGrafico(
                'grafico_categoria',
                'doughnut',
                dados.vendas_por_categoria.map(l => l.categoria),
                dados.vendas_por_categoria.map(l => l.faturamento),
                'Faturamento'
            )

            // Faturamento mensal (linha)
            desenharGrafico(
                'grafico_mensal',
                'line',
                dados.faturamento_mensal.map(l => l.mes),
                dados.faturamento_mensal.map(l => l.faturamento),
                'Faturamento mensal'
            )

            desenharMaisVendidos(dados.produtos_mais_vendidos)
        })
        .catch((err) => {
            console.error('Erro ao consultar o relatório de vendas!', err)
            mostrarMensagem('resposta', 'Não foi possível carregar o relatório de vendas.', 'erro')
        })
}

function desenharIndicadores(totais) {

    const indicadores = [
        { rotulo: 'Pedidos', valor: totais.pedidos },
        { rotulo: 'Faturamento', valor: formatarPreco(totais.faturamento) },
        { rotulo: 'Descontos concedidos', valor: formatarPreco(totais.descontos) },
        { rotulo: 'Ticket médio', valor: formatarPreco(totais.ticket_medio) }
    ]

    document.getElementById('indicadores').innerHTML = indicadores.map(i => `
        <div class="indicador">
            <span>${i.rotulo}</span>
            <strong>${i.valor}</strong>
        </div>
    `).join('')
}

function desenharMaisVendidos(lista) {

    const elemento = document.getElementById('tabela_mais_vendidos')

    if (!lista || lista.length === 0) {
        elemento.innerHTML = '<div class="vazio"><p>Ainda não há vendas registradas.</p></div>'
        return
    }

    const linhas = lista.map((linha, i) => ([
        `<strong>${i + 1}º</strong>`,
        linha.produto,
        linha.quantidade,
        formatarPreco(linha.faturamento)
    ]))

    elemento.innerHTML = montarTabela(['#', 'Produto', 'Qtd. vendida', 'Faturamento'], linhas)
}

// ==========================================================
// |  RELATÓRIO DE ESTOQUE                                  |
// ==========================================================
function carregarEstoque() {
    fetch(`${API_URL}/relatorios/estoque`, {
        headers: cabecalhoAutorizacao()
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            // Estoque por categoria (barras)
            desenharGrafico(
                'grafico_estoque',
                'bar',
                dados.saldo_por_categoria.map(l => l.categoria),
                dados.saldo_por_categoria.map(l => l.quantidade),
                'Unidades em estoque'
            )

            desenharTabelaEstoque(dados.saldo_por_produto)
        })
        .catch((err) => {
            console.error('Erro ao consultar o relatório de estoque!', err)
            mostrarMensagem('resposta', 'Não foi possível carregar o relatório de estoque.', 'erro')
        })
}

function desenharTabelaEstoque(lista) {

    const elemento = document.getElementById('tabela_estoque')

    if (!lista || lista.length === 0) {
        elemento.innerHTML = '<div class="vazio"><p>Nenhum produto cadastrado.</p></div>'
        return
    }

    const linhas = lista.map(linha => ([
        linha.id,
        linha.produto,
        linha.categoria,
        linha.estoque_atual <= 5
            ? `<span class="etiqueta vermelha">${linha.estoque_atual}</span>`
            : `<span class="etiqueta verde">${linha.estoque_atual}</span>`,
        formatarPreco(linha.valor_imobilizado)
    ]))

    elemento.innerHTML = montarTabela(['Cód.', 'Produto', 'Categoria', 'Estoque', 'Valor imobilizado'], linhas)
}
