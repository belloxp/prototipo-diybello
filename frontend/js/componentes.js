// ==========================================================
// |  DIYBELLO - COMPONENTES COMPARTILHADOS                 |
// |  Monta o cabeçalho e o rodapé de todas as telas        |
// |  internas e concentra os helpers de interface reusados |
// |  pelas páginas: tabelas, botões de ícone e modais.     |
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    montarCabecalho()
    montarRodape()
})


// ==========================================================
// |  CABEÇALHO                                             |
// |  O menu muda conforme o nível de acesso do usuário.    |
// ==========================================================
function montarCabecalho() {

    const elemento = document.getElementById('cabecalho')

    if (!elemento) return

    const usuario = pegarUsuario()

    // Sem usuário logado o próprio protegerTela() da página redireciona,
    // mas ainda assim evitamos quebrar a montagem do menu.
    if (!usuario) return

    const ehAdmin = usuario.nivel_acesso === 'ADMIN'

    const menu = ehAdmin ? menuAdmin() : menuCliente()

    const primeiroNome = usuario.nome ? usuario.nome.split(' ')[0] : 'Conta'
    const inicial = primeiroNome.charAt(0).toUpperCase()
    const papel = ehAdmin ? 'Administrador' : 'Cliente'

    elemento.innerHTML = `
        <div class="topo">
            <a href="${ehAdmin ? './admin.html' : './loja.html'}" class="marca">DIY<span>BELLO</span></a>

            <nav>${menu}</nav>

            <div class="conta">
                <a href="./perfil.html" class="conta_avatar" title="Meu perfil">${inicial}</a>
                <span class="conta_texto">
                    <strong>${primeiroNome}</strong>
                    <span>${papel}</span>
                </span>
                <a href="#" class="conta_sair" id="btn_sair">Sair</a>
            </div>
        </div>
    `

    document.getElementById('btn_sair').addEventListener('click', (e) => {
        e.preventDefault()
        sair()
    })

    // Atualiza o número de itens no carrinho (função do carrinho.js)
    if (typeof atualizarContadorCarrinho === 'function') {
        atualizarContadorCarrinho()
    }
}

// Cada link vira "ativo" quando bate com a página aberta no momento
function linkMenu(arquivo, rotulo, extra) {
    const atual = window.location.pathname.split('/').pop()
    const ativo = atual === arquivo ? 'ativo' : ''
    const classes = [ativo, extra || ''].join(' ').trim()

    return `<a href="./${arquivo}" class="${classes}">${rotulo}</a>`
}

function menuCliente() {
    return [
        linkMenu('loja.html', 'Loja'),
        linkMenu('catalogo.html', 'Catálogo'),
        linkMenu('monteSuaCaixa.html', 'Monte sua Caixa', 'destaque'),
        linkMenu('meusPedidos.html', 'Meus pedidos'),
        `<a href="./carrinho.html" class="${window.location.pathname.split('/').pop() === 'carrinho.html' ? 'ativo' : ''}">
            Carrinho <span class="contador_carrinho" id="contador_carrinho">0</span>
        </a>`
    ].join('')
}

function menuAdmin() {
    return [
        linkMenu('admin.html', 'Painel'),
        linkMenu('adminProdutos.html', 'Produtos'),
        linkMenu('adminCategorias.html', 'Categorias'),
        linkMenu('adminEstoque.html', 'Estoque'),
        linkMenu('adminPedidos.html', 'Pedidos'),
        linkMenu('adminUsuarios.html', 'Usuários'),
        linkMenu('relatorios.html', 'Relatórios')
    ].join('')
}


// ==========================================================
// |  RODAPÉ                                                |
// ==========================================================
function montarRodape() {

    const elemento = document.getElementById('rodape')

    if (!elemento) return

    const ano = new Date().getFullYear()

    elemento.innerHTML = `
        <img class="rodape_logo" src="../img/iconBranco.png" alt="DIYBELLO">
        <p><strong>DIYBELLO</strong></p>
        <p>Um hobby inteiro dentro de uma caixa.</p>
        <p>Projeto acadêmico de e-commerce e controle de estoque · ${ano}</p>
    `
}


// ==========================================================
// |  TABELAS DOS PAINÉIS ADMIN                             |
// |  montarTabela(['Col A', 'Col B'], [[a1, b1], [a2, b2]]) |
// ==========================================================
function montarTabela(colunas, linhas) {

    const cabecalho = colunas.map(coluna => `<th>${coluna}</th>`).join('')

    const corpo = linhas.map(linha => {
        const celulas = linha.map(celula => `<td>${celula}</td>`).join('')
        return `<tr>${celulas}</tr>`
    }).join('')

    return `
        <div class="tabela_rolagem">
            <table>
                <thead><tr>${cabecalho}</tr></thead>
                <tbody>${corpo}</tbody>
            </table>
        </div>
    `
}


// ==========================================================
// |  BOTÕES DE AÇÃO (só ícone) DAS TABELAS                 |
// |  botaoIcone('editar', 'btn_editar', 12, 'Editar')      |
// ==========================================================
const ICONES = {
    editar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
    apagar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>',
    estornar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/></svg>',
    ver: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
}

function botaoIcone(icone, classe, id, titulo) {
    return `<button type="button" class="botao_icone ${classe || ''}" data-id="${id}" title="${titulo || ''}">
        ${ICONES[icone] || ICONES.ver}
    </button>`
}


// ==========================================================
// |  MODAL GENÉRICO                                        |
// |  abrirModal({ titulo, subtitulo, corpo, botoes })      |
// ==========================================================
function abrirModal({ titulo, subtitulo, corpo, botoes }) {

    fecharModal()

    const fundo = document.createElement('div')
    fundo.className = 'modal_fundo'
    fundo.id = 'modal_fundo'

    fundo.innerHTML = `
        <div class="modal">
            <div class="modal_topo">
                <div>
                    <h2>${titulo || ''}</h2>
                    ${subtitulo ? `<p>${subtitulo}</p>` : ''}
                </div>
                <button type="button" class="modal_fechar" id="modal_fechar" title="Fechar">&times;</button>
            </div>

            <div class="modal_corpo">
                <div id="modal_mensagem"></div>
                ${corpo || ''}
            </div>

            <div class="modal_rodape">${botoes || ''}</div>
        </div>
    `

    document.body.appendChild(fundo)
    document.body.classList.add('travado')

    document.getElementById('modal_fechar').addEventListener('click', fecharModal)

    // Clicar fora do modal (no fundo escuro) também fecha
    fundo.addEventListener('click', (e) => {
        if (e.target === fundo) fecharModal()
    })
}

function fecharModal() {
    const fundo = document.getElementById('modal_fundo')

    if (fundo) fundo.remove()

    document.body.classList.remove('travado')
}

// Mensagem dentro do modal (não fecha a janela)
function mensagemModal(texto, tipo) {
    const alvo = document.getElementById('modal_mensagem')

    if (alvo) {
        alvo.innerHTML = `<div class="mensagem ${tipo || 'info'}">${texto}</div>`
    }
}


// ==========================================================
// |  CONFIRMAÇÃO DE AÇÃO (apagar, estornar, etc.)          |
// |  confirmarAcao({ titulo, mensagem, detalhe,            |
// |    textoConfirmar, perigo, aoConfirmar })              |
// ==========================================================
function confirmarAcao({ titulo, mensagem, detalhe, textoConfirmar, perigo, aoConfirmar }) {

    abrirModal({
        titulo: titulo || 'Confirmar ação',
        corpo: `
            <p class="modal_texto">${mensagem || 'Deseja mesmo continuar?'}</p>
            ${detalhe ? `<div class="modal_detalhe">${detalhe}</div>` : ''}
        `,
        botoes: `
            <button type="button" class="botao_secundario" id="modal_cancelar">Cancelar</button>
            <button type="button" class="${perigo ? 'botao_perigo' : ''}" id="modal_confirmar">${textoConfirmar || 'Confirmar'}</button>
        `
    })

    document.getElementById('modal_cancelar').addEventListener('click', fecharModal)

    document.getElementById('modal_confirmar').addEventListener('click', () => {
        fecharModal()
        if (typeof aoConfirmar === 'function') aoConfirmar()
    })
}


// ==========================================================
// |  GRADE DE CARTÕES DE PRODUTO (loja e catálogo)         |
// |  renderizarProdutos('lista_produtos', [ ...produtos ]) |
// ==========================================================
function renderizarProdutos(id, produtos) {

    const elemento = document.getElementById(id)

    if (!elemento) return

    if (!produtos || produtos.length === 0) {
        elemento.innerHTML = '<div class="vazio"><p>Nenhum produto encontrado por aqui.</p></div>'
        return
    }

    elemento.innerHTML = produtos.map(produto => cartaoProduto(produto)).join('')

    // Liga o botão "Adicionar" de cada card ao carrinho
    elemento.querySelectorAll('.btn_adicionar').forEach(botao => {
        botao.addEventListener('click', () => {
            const produto = produtos.find(p => p.id === Number(botao.dataset.id))
            if (!produto) return

            if (adicionarAoCarrinho(produto)) {
                botao.textContent = 'Adicionado ✓'
                botao.classList.add('feito')
                setTimeout(() => {
                    botao.textContent = 'Adicionar'
                    botao.classList.remove('feito')
                }, 1200)
            }
        })
    })
}

// Monta o HTML de um único card de produto
function cartaoProduto(produto) {

    const esgotado = produto.estoque_atual <= 0
    const ultimas = !esgotado && produto.estoque_atual <= 5
    const categoria = produto.categoriaProduto ? produto.categoriaProduto.nome : 'DIYBELLO'

    let aviso = ''
    if (esgotado) aviso = '<span class="card_aviso esgotado">Esgotado</span>'
    else if (ultimas) aviso = '<span class="card_aviso ultimas">Últimas unidades</span>'

    const botao = esgotado
        ? '<button class="card_botao" disabled>Esgotado</button>'
        : `<button class="card_botao btn_adicionar" data-id="${produto.id}">Adicionar</button>`

    return `
        <article class="card ${esgotado ? 'card_indisponivel' : ''}">
            <a href="./produto.html?id=${produto.id}" class="card_midia">
                <span class="card_tipo">${produto.tipo}</span>
                ${aviso}
                <img src="${resolverImagem(produto.imagem_url)}" alt="${produto.nome}">
            </a>

            <div class="card_corpo">
                <span class="card_categoria">${categoria}</span>
                <a href="./produto.html?id=${produto.id}" class="card_link">
                    <span class="card_nome">${produto.nome}</span>
                </a>
                <span class="card_meta">${formatarNivel(produto.nivel)} · ${produto.tempo_minutos} min</span>

                <div class="card_rodape">
                    <span class="card_preco">${formatarPreco(produto.preco)}</span>
                    ${botao}
                </div>
            </div>
        </article>
    `
}
