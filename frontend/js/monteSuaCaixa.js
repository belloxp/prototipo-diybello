// ==========================================================
// |  DIYBELLO - MONTE SUA CAIXA (assistente em 4 passos)   |
// |  1. escolher o tema (categoria)                        |
// |  2. marcar os itens básicos do tema                    |
// |  3. adicionar extras de outros temas                   |
// |  4. presente (embrulho + mensagem do cartão)           |
// |  No fim, os itens escolhidos vão para o carrinho.      |
// ==========================================================

let categorias = []
let produtos = []

// Estado da montagem
const caixa = {
    passo: 1,
    tema: null,
    itens: new Set(),   // ids dos produtos escolhidos (básicos + extras)
    embrulho: null,
    mensagem: ''
}

const TITULOS_PASSO = {
    1: { titulo: 'Escolha o tema da sua caixa', ajuda: 'Cada tema abre uma seleção de materiais combinando.' },
    2: { titulo: 'Itens básicos do tema', ajuda: 'Marque os materiais essenciais que faltam na sua casa.' },
    3: { titulo: 'Que tal alguns extras?', ajuda: 'Itens de outros temas para deixar a caixa completa.' },
    4: { titulo: 'Toque final de presente', ajuda: 'Escolha o embrulho e escreva a mensagem do cartão.' }
}

document.addEventListener('DOMContentLoaded', () => {

    if (!protegerTela()) return

    document.getElementById('btn_voltar').addEventListener('click', voltar)
    document.getElementById('btn_avancar').addEventListener('click', avancar)

    carregarDados()
})

// Carrega categorias e produtos de uma vez
function carregarDados() {
    Promise.all([
        fetch(`${API_URL}/categorias`).then(res => res.json()),
        fetch(`${API_URL}/produtos`).then(res => res.json())
    ])
        .then(([listaCategorias, listaProdutos]) => {

            if (listaCategorias.error || listaProdutos.error) {
                mostrarMensagem('resposta', 'Não foi possível carregar os dados.', 'erro')
                return
            }

            categorias = listaCategorias
            produtos = listaProdutos

            renderizarPasso()
            atualizarResumo()
        })
        .catch((err) => {
            console.error('Erro ao carregar dados do assistente!', err)
            mostrarMensagem('resposta', 'Não foi possível carregar o assistente. Verifique a API.', 'erro')
        })
}

// ==========================================================
// |  NAVEGAÇÃO ENTRE OS PASSOS                             |
// ==========================================================
function avancar() {

    if (caixa.passo === 1 && !caixa.tema) {
        mostrarMensagem('resposta', 'Escolha um tema para continuar.', 'aviso')
        return
    }

    if (caixa.passo === 4) {
        finalizar()
        return
    }

    caixa.passo++
    limparMensagem('resposta')
    renderizarPasso()
}

function voltar() {
    if (caixa.passo === 1) return
    caixa.passo--
    limparMensagem('resposta')
    renderizarPasso()
}

// Atualiza a trilha, os botões e o conteúdo do passo atual
function renderizarPasso() {

    atualizarTrilha()

    document.getElementById('btn_voltar').disabled = caixa.passo === 1
    document.getElementById('btn_avancar').textContent = caixa.passo === 4 ? 'Adicionar à caixa' : 'Avançar'

    const info = TITULOS_PASSO[caixa.passo]

    let conteudo = `
        <div class="passo_cabecalho">
            <h2>${info.titulo}</h2>
            <p>${info.ajuda}</p>
        </div>
    `

    if (caixa.passo === 1) conteudo += montarTemas()
    if (caixa.passo === 2) conteudo += montarItens(itensDoTema(), 'Nenhum item básico cadastrado para esse tema.')
    if (caixa.passo === 3) conteudo += montarItens(itensExtras(), 'Nenhum extra disponível no momento.')
    if (caixa.passo === 4) conteudo += montarPresente()

    document.getElementById('conteudo_passo').innerHTML = conteudo

    ligarEventosDoPasso()
}

function atualizarTrilha() {

    const progresso = ((caixa.passo - 1) / 3) * 100
    document.getElementById('trilha_progresso').style.width = `${progresso}%`

    document.querySelectorAll('.trilha_passo').forEach(passo => {
        const numero = Number(passo.dataset.passo)
        passo.classList.remove('ativo', 'concluido')

        if (numero < caixa.passo) passo.classList.add('concluido')
        else if (numero === caixa.passo) passo.classList.add('ativo')
    })
}

// ==========================================================
// |  PASSO 1 - TEMAS                                       |
// ==========================================================
function montarTemas() {
    return `
        <div class="galeria_temas">
            ${categorias.map(categoria => `
                <button type="button" class="tema_card ${caixa.tema && caixa.tema.id === categoria.id ? 'escolhido' : ''}" data-id="${categoria.id}">
                    <span class="tema_foto">
                        <img src="${resolverImagem(categoria.imagem_url)}" alt="${categoria.nome}">
                        <span class="tema_check">✓</span>
                    </span>
                    <span class="tema_texto">
                        <strong>${categoria.nome}</strong>
                        <span>${categoria.descricao || ''}</span>
                    </span>
                </button>
            `).join('')}
        </div>
    `
}

// ==========================================================
// |  PASSOS 2 e 3 - ITENS                                  |
// ==========================================================

// Itens do tema escolhido (insumos avulsos da categoria)
function itensDoTema() {
    if (!caixa.tema) return []
    return produtos.filter(p => p.tipo === 'AVULSO' && p.categoria_id === caixa.tema.id)
}

// Itens avulsos das demais categorias
function itensExtras() {
    if (!caixa.tema) return produtos.filter(p => p.tipo === 'AVULSO')
    return produtos.filter(p => p.tipo === 'AVULSO' && p.categoria_id !== caixa.tema.id)
}

function montarItens(lista, textoVazio) {

    if (lista.length === 0) {
        return `<div class="vazio"><p>${textoVazio}</p></div>`
    }

    return `
        <div class="galeria_itens">
            ${lista.map(produto => {
                const esgotado = produto.estoque_atual <= 0
                const escolhido = caixa.itens.has(produto.id)

                return `
                    <button type="button" class="item_card ${escolhido ? 'escolhido' : ''} ${esgotado ? 'esgotado' : ''}" data-id="${produto.id}" ${esgotado ? 'disabled' : ''}>
                        <span class="item_foto">
                            <img src="${resolverImagem(produto.imagem_url)}" alt="${produto.nome}">
                            <span class="item_check">✓</span>
                        </span>
                        <span class="item_texto">
                            <strong>${produto.nome}</strong>
                            <span class="item_preco">${formatarPreco(produto.preco)}</span>
                            <span class="item_estoque">${esgotado ? 'Esgotado' : produto.estoque_atual + ' em estoque'}</span>
                        </span>
                    </button>
                `
            }).join('')}
        </div>
    `
}

// ==========================================================
// |  PASSO 4 - PRESENTE                                    |
// ==========================================================
function montarPresente() {
    return `
        <div class="galeria_presente">
            <button type="button" class="presente_card ${caixa.embrulho === true ? 'escolhido' : ''}" data-valor="sim">
                <span class="presente_icone">🎁</span>
                <strong>Sim, quero embrulho</strong>
                <span>Sua caixa vai embrulhada e pronta para presentear.</span>
            </button>

            <button type="button" class="presente_card ${caixa.embrulho === false ? 'escolhido' : ''}" data-valor="nao">
                <span class="presente_icone">📦</span>
                <strong>Não precisa</strong>
                <span>Entrega na embalagem padrão da DIYBELLO.</span>
            </button>
        </div>

        <div class="bloco_personalizacao ${caixa.embrulho ? '' : 'desativado'}">
            <label for="msg_cartao">Mensagem do cartão</label>
            <textarea id="msg_cartao" placeholder="Escreva um recado carinhoso...">${caixa.mensagem}</textarea>
            <span class="ajuda">Só é enviada quando você escolhe embrulhar o presente.</span>
        </div>
    `
}

// ==========================================================
// |  EVENTOS DE CADA PASSO                                 |
// ==========================================================
function ligarEventosDoPasso() {

    // Passo 1 - temas
    document.querySelectorAll('.tema_card').forEach(botao => {
        botao.addEventListener('click', () => {
            caixa.tema = categorias.find(c => c.id === Number(botao.dataset.id))
            renderizarPasso()
            atualizarResumo()
        })
    })

    // Passos 2 e 3 - itens
    document.querySelectorAll('.item_card:not(.esgotado)').forEach(botao => {
        botao.addEventListener('click', () => {
            const id = Number(botao.dataset.id)

            if (caixa.itens.has(id)) caixa.itens.delete(id)
            else caixa.itens.add(id)

            botao.classList.toggle('escolhido')
            atualizarResumo()
        })
    })

    // Passo 4 - presente
    document.querySelectorAll('.presente_card').forEach(botao => {
        botao.addEventListener('click', () => {
            caixa.embrulho = botao.dataset.valor === 'sim'
            renderizarPasso()
        })
    })

    const textarea = document.getElementById('msg_cartao')
    if (textarea) {
        textarea.addEventListener('input', () => { caixa.mensagem = textarea.value })
    }
}

// ==========================================================
// |  RESUMO LATERAL                                        |
// ==========================================================
function itensEscolhidos() {
    return produtos.filter(p => caixa.itens.has(p.id))
}

function atualizarResumo() {

    const escolhidos = itensEscolhidos()
    const subtotal = escolhidos.reduce((soma, p) => soma + p.preco, 0)

    document.getElementById('resumo_contagem').textContent = `${escolhidos.length} ${escolhidos.length === 1 ? 'item' : 'itens'}`

    const elemento = document.getElementById('resumo_caixa')

    if (!caixa.tema && escolhidos.length === 0) {
        elemento.innerHTML = `
            <div class="resumo_vazio">
                <span>📦</span>
                <p>Escolha um tema e comece a montar a sua caixa.</p>
            </div>
        `
        return
    }

    const tema = caixa.tema
        ? `
            <div class="resumo_tema">
                <img src="${resolverImagem(caixa.tema.imagem_url)}" alt="${caixa.tema.nome}">
                <span>
                    <small>Tema</small>
                    <strong>${caixa.tema.nome}</strong>
                </span>
            </div>
        `
        : ''

    const itens = escolhidos.length > 0
        ? `
            <div class="resumo_itens">
                ${escolhidos.map(p => `
                    <div class="resumo_item">
                        <img src="${resolverImagem(p.imagem_url)}" alt="${p.nome}">
                        <span class="resumo_item_nome">${p.nome}</span>
                        <span class="resumo_item_preco">${formatarPreco(p.preco)}</span>
                    </div>
                `).join('')}
            </div>

            <div class="resumo_valores">
                <div class="resumo_linha total"><span>Subtotal</span><span>${formatarPreco(subtotal)}</span></div>
            </div>
        `
        : '<div class="resumo_regra">Marque os itens que quer na caixa.</div>'

    elemento.innerHTML = tema + itens
}

// ==========================================================
// |  FINALIZAR - joga os itens no carrinho                 |
// ==========================================================
function finalizar() {

    const escolhidos = itensEscolhidos()

    if (escolhidos.length === 0) {
        mostrarMensagem('resposta', 'Escolha pelo menos um item para montar a caixa.', 'aviso')
        return
    }

    escolhidos.forEach(produto => adicionarAoCarrinho(produto))

    mostrarMensagem('resposta', 'Caixa montada! Redirecionando para o carrinho...', 'sucesso')

    setTimeout(() => {
        window.location.href = './carrinho.html'
    }, 1200)
}
