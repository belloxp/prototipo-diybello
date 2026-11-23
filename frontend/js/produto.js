// ==========================================================
// |  DIYBELLO - DETALHE DO PRODUTO                         |
// |  GET /produtos/:id - mostra a caixa escolhida e sugere |
// |  outros produtos da mesma categoria.                   |
// ==========================================================

let produtoAtual = null

document.addEventListener('DOMContentLoaded', () => {

    if (!protegerTela()) return

    const id = new URLSearchParams(window.location.search).get('id')

    if (!id) {
        mostrarMensagem('resposta', 'Produto não informado.', 'erro')
        return
    }

    carregarProduto(id)
})

// GET /produtos/:id
function carregarProduto(id) {
    fetch(`${API_URL}/produtos/${id}`)
        .then(res => res.json())
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            produtoAtual = dados
            desenharProduto(dados)
            carregarRelacionados(dados)
        })
        .catch((err) => {
            console.error('Erro ao consultar o produto!', err)
            mostrarMensagem('resposta', 'Não foi possível carregar o produto.', 'erro')
        })
}

function desenharProduto(produto) {

    document.title = `${produto.nome} - DIYBELLO`

    const esgotado = produto.estoque_atual <= 0
    const categoria = produto.categoriaProduto ? produto.categoriaProduto.nome : 'DIYBELLO'

    const botao = esgotado
        ? '<button class="botao_bloco" disabled>Produto esgotado</button>'
        : '<button class="botao_bloco" id="btn_adicionar">Adicionar ao carrinho</button>'

    document.getElementById('detalhe_produto').innerHTML = `
        <img src="${resolverImagem(produto.imagem_url)}" alt="${produto.nome}">

        <div>
            <span class="card_categoria">${categoria}</span>
            <h1>${produto.nome}</h1>

            <div class="card_info" style="margin: 12px 0;">
                <span class="etiqueta azul">${produto.tipo}</span>
                <span class="etiqueta dourada">${formatarNivel(produto.nivel)}</span>
                <span class="etiqueta">${produto.tempo_minutos} min de projeto</span>
                ${esgotado
                    ? '<span class="etiqueta vermelha">Esgotado</span>'
                    : `<span class="etiqueta verde">${produto.estoque_atual} em estoque</span>`}
            </div>

            <p>${produto.descricao || 'Sem descrição cadastrada.'}</p>

            <div class="detalhe_preco">${formatarPreco(produto.preco)}</div>

            <div class="hero_botoes">
                ${botao}
                <a href="./carrinho.html" class="botao botao_secundario">Ver carrinho</a>
            </div>
        </div>
    `

    if (!esgotado) {
        document.getElementById('btn_adicionar').addEventListener('click', () => {
            if (adicionarAoCarrinho(produto)) {
                mostrarMensagem('resposta', `"${produto.nome}" foi adicionado ao carrinho.`, 'sucesso')
            }
        })
    }
}

// Outros produtos da mesma categoria
function carregarRelacionados(produto) {
    fetch(`${API_URL}/produtos?categoria_id=${produto.categoria_id}`)
        .then(res => res.json())
        .then(dados => {
            if (dados.error) return

            const relacionados = dados.filter(p => p.id !== produto.id).slice(0, 4)

            renderizarProdutos('lista_relacionados', relacionados)
        })
        .catch((err) => {
            console.error('Erro ao consultar os relacionados!', err)
        })
}
