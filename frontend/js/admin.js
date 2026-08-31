// ==========================================================
// |  DIYBELLO - PAINEL ADMINISTRATIVO (rota privada ADMIN) |
// |  Junta os indicadores de vendas e de estoque.          |
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {

    if (!protegerTela(true)) return

    document.getElementById('boas_vindas').textContent =
        `Bem-vindo(a), ${pegarUsuario().nome}. Aqui você gerencia o catálogo, o estoque e as vendas.`

    carregarIndicadores()
})

function carregarIndicadores() {

    // GET /relatorios/vendas e GET /relatorios/estoque
    Promise.all([
        fetch(`${API_URL}/relatorios/vendas`, { headers: cabecalhoAutorizacao() }).then(tratarResposta),
        fetch(`${API_URL}/relatorios/estoque`, { headers: cabecalhoAutorizacao() }).then(tratarResposta)
    ])
        .then(([vendas, estoque]) => {

            if (vendas.error || estoque.error) {
                mostrarMensagem('resposta', vendas.error || estoque.error, 'erro')
                return
            }

            document.getElementById('indicadores').innerHTML = `
                <div class="indicador"><span>Pedidos realizados</span><strong>${vendas.totais.pedidos}</strong></div>
                <div class="indicador"><span>Faturamento</span><strong>${formatarPreco(vendas.totais.faturamento)}</strong></div>
                <div class="indicador"><span>Ticket médio</span><strong>${formatarPreco(vendas.totais.ticket_medio)}</strong></div>
                <div class="indicador"><span>Descontos concedidos</span><strong>${formatarPreco(vendas.totais.descontos)}</strong></div>
                <div class="indicador"><span>Produtos no catálogo</span><strong>${estoque.totais.produtos_cadastrados}</strong></div>
                <div class="indicador"><span>Itens em estoque</span><strong>${estoque.totais.itens_em_estoque}</strong></div>
                <div class="indicador"><span>Valor imobilizado</span><strong>${formatarPreco(estoque.totais.valor_imobilizado)}</strong></div>
                <div class="indicador"><span>Produtos esgotados</span><strong>${estoque.totais.produtos_esgotados}</strong></div>
            `

            desenharEstoqueBaixo(estoque.estoque_baixo)
        })
        .catch((err) => {
            console.error('Erro ao consultar os relatórios!', err)
            mostrarMensagem('resposta', 'Não foi possível carregar os indicadores.', 'erro')
        })
}

function desenharEstoqueBaixo(produtos) {

    const elemento = document.getElementById('estoque_baixo')

    if (!produtos || produtos.length === 0) {
        elemento.innerHTML = '<div class="vazio">Nenhum produto precisa de reposição no momento.</div>'
        return
    }

    const linhas = produtos.map(produto => ([
        produto.id,
        produto.produto,
        produto.categoria,
        produto.estoque_atual === 0
            ? '<span class="etiqueta vermelha">Esgotado</span>'
            : `<span class="etiqueta dourada">${produto.estoque_atual} restantes</span>`,
        `<a href="./adminEstoque.html?produto_id=${produto.id}" class="botao botao_pequeno">Dar entrada</a>`
    ]))

    elemento.innerHTML = montarTabela(
        ['Código', 'Produto', 'Categoria', 'Saldo', 'Ação'],
        linhas
    )
}
