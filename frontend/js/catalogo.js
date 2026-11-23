// ==========================================================
// |  DIYBELLO - CATÁLOGO PÚBLICO                           |
// |  Busca por nome e filtro por categoria/nível/tempo     |
// |  sem exigir autenticação.                              |
// ==========================================================

let form_filtros = null

document.addEventListener('DOMContentLoaded', () => {

    if (!protegerTela()) return


    form_filtros = document.getElementById('form_filtros')

    // Se veio da vitrine com ?tipo=COMBO já aplica o filtro
    const parametros = new URLSearchParams(window.location.search)

    if (parametros.get('tipo')) {
        document.getElementById('tipo').value = parametros.get('tipo')
    }

    // O filtro de categoria só pode ser marcado depois que o select estiver preenchido
    carregarCategorias(parametros.get('categoria_id'))

    form_filtros.addEventListener('submit', (e) => {
        e.preventDefault()
        carregarProdutos()
    })

    document.getElementById('btn_limpar').addEventListener('click', () => {
        form_filtros.reset()
        carregarProdutos()
    })
})

// GET /categorias - preenche o select de filtro e depois carrega a vitrine
function carregarCategorias(categoriaSelecionada) {
    fetch(`${API_URL}/categorias`)
        .then(res => res.json())
        .then(dados => {
            if (!dados.error) {
                const select = document.getElementById('categoria_id')

                dados.forEach(categoria => {
                    select.innerHTML += `<option value="${categoria.id}">${categoria.nome}</option>`
                })

                if (categoriaSelecionada) {
                    select.value = categoriaSelecionada
                }
            }

            // Só busca os produtos depois que o filtro de categoria já está aplicado
            carregarProdutos()
        })
        .catch((err) => {
            console.error('Erro ao consultar as categorias!', err)
            carregarProdutos()
        })
}

// GET /produtos com os filtros montados na query string
function carregarProdutos() {

    limparMensagem('resposta')

    const busca = document.getElementById('busca').value.trim()
    const categoria_id = document.getElementById('categoria_id').value
    const tipo = document.getElementById('tipo').value
    const nivel = document.getElementById('nivel').value
    const tempo = document.getElementById('tempo').value

    const filtros = new URLSearchParams()

    if (busca) filtros.append('nome', busca)
    if (categoria_id) filtros.append('categoria_id', categoria_id)
    if (tipo) filtros.append('tipo', tipo)
    if (nivel) filtros.append('nivel', nivel)
    if (tempo) filtros.append('tempo', tempo)

    fetch(`${API_URL}/produtos?${filtros.toString()}`)
        .then(res => res.json())
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            renderizarProdutos('lista_produtos', dados)
        })
        .catch((err) => {
            console.error('Erro ao consultar os produtos!', err)
            mostrarMensagem('resposta', 'Não foi possível carregar os produtos. Verifique se a API está rodando.', 'erro')
        })
}
