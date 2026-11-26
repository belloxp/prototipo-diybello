// ==========================================================
// |  DIYBELLO - VITRINE DA LOJA                            |
// |  Monta o banner, as categorias, as caixas em destaque  |
// |  e os combos consumindo a API pública de produtos.     |
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {

    if (!protegerTela()) return

    carregarCategorias()
    carregarProdutos()
})

// GET /categorias - trilha de categorias e imagem do banner
function carregarCategorias() {
    fetch(`${API_URL}/categorias`)
        .then(res => res.json())
        .then(dados => {
            if (dados.error) return

            const elemento = document.getElementById('lista_categorias')

            elemento.innerHTML = dados.map(categoria => `
                <a href="./catalogo.html?categoria_id=${categoria.id}" class="categoria_card">
                    <img src="${resolverImagem(categoria.imagem_url)}" alt="${categoria.nome}">
                    <div class="categoria_veu"></div>
                    <span class="categoria_nome">${categoria.nome}</span>
                </a>
            `).join('')
        })
        .catch((err) => {
            console.error('Erro ao consultar as categorias!', err)
        })
}

// GET /produtos - separa caixas e combos e monta os mosaicos
function carregarProdutos() {
    fetch(`${API_URL}/produtos`)
        .then(res => res.json())
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            const caixas = dados.filter(p => p.tipo === 'CAIXA')
            const combos = dados.filter(p => p.tipo === 'COMBO')

            montarMosaicoHero(caixas)
            renderizarProdutos('lista_destaques', caixas.slice(0, 4))
            renderizarProdutos('lista_combos', combos.slice(0, 4))
            montarChamada(combos)
        })
        .catch((err) => {
            console.error('Erro ao consultar os produtos!', err)
            mostrarMensagem('resposta', 'Não foi possível carregar a vitrine. Verifique se a API está rodando.', 'erro')
        })
}

// Mosaico de 4 imagens no banner principal
function montarMosaicoHero(caixas) {
    const elemento = document.getElementById('hero_arte')

    if (!elemento || caixas.length === 0) return

    const fotos = caixas.slice(0, 4)

    elemento.innerHTML = `
        <div class="mosaico">
            ${fotos.map(p => `
                <div class="mosaico_item">
                    <img src="${resolverImagem(p.imagem_url)}" alt="${p.nome}">
                </div>
            `).join('')}
        </div>
    `
}

// Imagem da chamada "Monte sua Caixa"
function montarChamada(combos) {
    const elemento = document.getElementById('chamada_arte')

    if (!elemento || combos.length === 0) return

    // Prioriza o Combo Night Out (sessaofinal); cai no primeiro caso não encontre
    const destaque = combos.find(c => c.imagem_url && c.imagem_url.includes('sessaofinal')) || combos[0]

    elemento.innerHTML = `<img src="${resolverImagem(destaque.imagem_url)}" alt="${destaque.nome}">`
}
