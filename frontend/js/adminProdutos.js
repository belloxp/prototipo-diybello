// ==========================================================
// |  DIYBELLO - GESTÃO DO CATÁLOGO (rota privada ADMIN)    |
// |  POST   /produtos       - cadastrar (formulário)       |
// |  GET    /produtos/admin - listar tudo                  |
// |  GET    /produtos/buscar?s= - consultar código/nome    |
// |  PUT    /produtos/:id   - substituir o registro todo   |
// |  PATCH  /produtos/:id   - enviar SÓ o que foi alterado |
// |  DELETE /produtos/:id   - apagar                       |
// |                                                        |
// |  A edição acontece em um modal. O botão de salvar      |
// |  compara o formulário com o registro original e manda  |
// |  apenas os campos alterados no PATCH.                  |
// ==========================================================

let produtosCarregados = []
let categoriasCarregadas = []

// Campos do produto que o administrador pode editar
const CAMPOS_PRODUTO = [
    'nome', 'descricao', 'preco', 'categoria_id',
    'tipo', 'nivel', 'tempo_minutos', 'imagem_url'
]

const ROTULOS_PRODUTO = {
    nome: 'Nome',
    descricao: 'Descrição',
    preco: 'Preço',
    categoria_id: 'Categoria',
    tipo: 'Tipo',
    nivel: 'Nível',
    tempo_minutos: 'Tempo do projeto',
    imagem_url: 'Imagem'
}

document.addEventListener('DOMContentLoaded', () => {

    if (!protegerTela(true)) return

    carregarCategorias()
    listarProdutos()

    document.getElementById('btn_salvar').addEventListener('click', cadastrarProduto)
    document.getElementById('btn_listar').addEventListener('click', listarProdutos)

    document.getElementById('form_busca').addEventListener('submit', (e) => {
        e.preventDefault()
        consultarProdutos()
    })
})

// ---------------- CATEGORIAS DO SELECT ----------------
function carregarCategorias() {
    fetch(`${API_URL}/categorias`)
        .then(res => res.json())
        .then(dados => {
            if (dados.error) return

            categoriasCarregadas = dados

            document.getElementById('categoria_id').innerHTML = dados
                .map(c => `<option value="${c.id}">${c.nome}</option>`)
                .join('')
        })
        .catch((err) => {
            console.error('Erro ao consultar as categorias!', err)
        })
}

function opcoesCategoria(selecionada) {
    return categoriasCarregadas
        .map(c => `<option value="${c.id}" ${Number(c.id) === Number(selecionada) ? 'selected' : ''}>${c.nome}</option>`)
        .join('')
}

// ---------------- LISTAGEM ----------------
function listarProdutos(manterMensagem) {

    // depois de salvar/apagar a mensagem de sucesso precisa sobreviver ao recarregar da lista
    if (!manterMensagem) limparMensagem('resposta')

    fetch(`${API_URL}/produtos/admin`, {
        headers: cabecalhoAutorizacao()
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            produtosCarregados = dados
            desenharTabela(dados)
        })
        .catch((err) => {
            console.error('Erro ao consultar os produtos!', err)
            mostrarMensagem('resposta', 'Não foi possível carregar o catálogo.', 'erro')
        })
}

// ---------------- CONSULTA POR CÓDIGO OU NOME ----------------
function consultarProdutos() {
    const termo = document.getElementById('busca').value.trim()

    if (!termo) {
        listarProdutos()
        return
    }

    fetch(`${API_URL}/produtos/buscar?s=${encodeURIComponent(termo)}`)
        .then(res => res.json())
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            produtosCarregados = dados
            desenharTabela(dados)
        })
        .catch((err) => {
            console.error('Erro ao consultar os produtos!', err)
        })
}

// ---------------- TABELA ----------------
function desenharTabela(produtos) {

    const elemento = document.getElementById('lista_produtos')

    if (produtos.length === 0) {
        elemento.innerHTML = '<div class="vazio">Nenhum produto encontrado.</div>'
        return
    }

    const linhas = produtos.map(produto => ([
        produto.id,
        `<img src="${resolverImagem(produto.imagem_url)}" alt="${produto.nome}" style="width: 52px; height: 52px; object-fit: cover;">`,
        produto.nome,
        produto.categoriaProduto ? produto.categoriaProduto.nome : '-',
        produto.tipo,
        formatarNivel(produto.nivel),
        formatarPreco(produto.preco),
        produto.estoque_atual,
        produto.status
            ? '<span class="etiqueta verde">Ativo</span>'
            : '<span class="etiqueta vermelha">Inativo</span>',
        `<div class="acoes">
            ${botaoIcone('editar', 'btn_editar', produto.id, 'Editar o produto')}
            ${botaoIcone('apagar', 'perigo btn_apagar', produto.id, 'Apagar o produto')}
        </div>`
    ]))

    elemento.innerHTML = montarTabela(
        ['Cód.', 'Foto', 'Produto', 'Categoria', 'Tipo', 'Nível', 'Preço', 'Estoque', 'Status', 'Ações'],
        linhas
    )

    elemento.querySelectorAll('.btn_editar').forEach(botao => {
        botao.addEventListener('click', () => abrirModalEdicao(Number(botao.dataset.id)))
    })

    elemento.querySelectorAll('.btn_apagar').forEach(botao => {
        botao.addEventListener('click', () => confirmarExclusao(Number(botao.dataset.id)))
    })
}

// ==========================================================
// |  CADASTRO (POST) - formulário do topo da página        |
// ==========================================================
function cadastrarProduto() {
    limparMensagem('resposta')

    const valores = {
        nome: document.getElementById('nome').value.trim(),
        descricao: document.getElementById('descricao').value.trim(),
        preco: Number(document.getElementById('preco').value),
        categoria_id: Number(document.getElementById('categoria_id').value),
        tipo: document.getElementById('tipo').value,
        nivel: document.getElementById('nivel').value,
        tempo_minutos: Number(document.getElementById('tempo_minutos').value),
        estoque_atual: Number(document.getElementById('estoque_atual').value),
        imagem_url: document.getElementById('imagem_url').value.trim() || '/img/placeholder.svg'
    }

    if (!valores.nome || !valores.preco || !valores.categoria_id) {
        mostrarMensagem('resposta', 'Preencha nome, preço e categoria.', 'aviso')
        return
    }

    if (valores.preco <= 0) {
        mostrarMensagem('resposta', 'O preço deve ser maior que zero.', 'erro')
        return
    }

    fetch(`${API_URL}/produtos`, {
        method: 'POST',
        headers: cabecalhoAutorizacao(),
        body: JSON.stringify(valores)
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            mostrarMensagem('resposta', dados.message, 'sucesso')
            limparFormulario()
            listarProdutos(true)
        })
        .catch((err) => {
            console.error('Erro ao cadastrar o produto!', err)
            mostrarMensagem('resposta', 'Não foi possível cadastrar o produto.', 'erro')
        })
}

function limparFormulario() {
    document.getElementById('nome').value = ''
    document.getElementById('descricao').value = ''
    document.getElementById('preco').value = ''
    document.getElementById('tempo_minutos').value = 45
    document.getElementById('estoque_atual').value = 0
    document.getElementById('imagem_url').value = ''
}

// ==========================================================
// |  EDIÇÃO NO MODAL (PATCH do que mudou / PUT completo)   |
// ==========================================================
function abrirModalEdicao(id) {

    const produto = produtosCarregados.find(p => p.id === id)
    if (!produto) return

    // guarda o estado original para saber depois o que realmente mudou
    const original = {
        nome: produto.nome,
        descricao: produto.descricao || '',
        preco: produto.preco,
        categoria_id: produto.categoria_id,
        tipo: produto.tipo,
        nivel: produto.nivel,
        tempo_minutos: produto.tempo_minutos,
        imagem_url: produto.imagem_url
    }

    abrirModal({
        titulo: `Editar produto nº ${produto.id}`,
        subtitulo: 'Altere só o que precisa. O sistema envia apenas os campos modificados.',
        corpo: `
            <div class="campo">
                <label for="m_nome">Nome do produto *</label>
                <input type="text" id="m_nome" value="${produto.nome.replace(/"/g, '&quot;')}">
            </div>

            <div class="campo">
                <label for="m_descricao">Descrição</label>
                <textarea id="m_descricao">${produto.descricao || ''}</textarea>
            </div>

            <div class="linha_form">
                <div class="campo">
                    <label for="m_preco">Preço (R$) *</label>
                    <input type="number" id="m_preco" step="0.01" min="0.01" value="${produto.preco}">
                </div>

                <div class="campo">
                    <label for="m_categoria_id">Categoria *</label>
                    <select id="m_categoria_id">${opcoesCategoria(produto.categoria_id)}</select>
                </div>
            </div>

            <div class="linha_form">
                <div class="campo">
                    <label for="m_tipo">Tipo *</label>
                    <select id="m_tipo">
                        <option value="CAIXA" ${produto.tipo === 'CAIXA' ? 'selected' : ''}>Caixa pré-pronta</option>
                        <option value="COMBO" ${produto.tipo === 'COMBO' ? 'selected' : ''}>Combo temático</option>
                        <option value="AVULSO" ${produto.tipo === 'AVULSO' ? 'selected' : ''}>Insumo avulso</option>
                    </select>
                </div>

                <div class="campo">
                    <label for="m_nivel">Nível *</label>
                    <select id="m_nivel">
                        <option value="INICIANTE" ${produto.nivel === 'INICIANTE' ? 'selected' : ''}>Iniciante</option>
                        <option value="INTERMEDIARIO" ${produto.nivel === 'INTERMEDIARIO' ? 'selected' : ''}>Intermediário</option>
                        <option value="AVANCADO" ${produto.nivel === 'AVANCADO' ? 'selected' : ''}>Avançado</option>
                    </select>
                </div>

                <div class="campo">
                    <label for="m_tempo_minutos">Tempo (min) *</label>
                    <input type="number" id="m_tempo_minutos" min="0" value="${produto.tempo_minutos}">
                </div>
            </div>

            <div class="campo">
                <label for="m_imagem_url">Imagem</label>
                <input type="text" id="m_imagem_url" value="${(produto.imagem_url || '').replace(/"/g, '&quot;')}">
            </div>

            <div class="modal_detalhe">
                O estoque deste produto é <strong>${produto.estoque_atual}</strong> unidade(s) e não muda por aqui.
                Use a tela de <a href="./adminEstoque.html?produto_id=${produto.id}">Movimentação de Estoque</a>.
            </div>

            <div id="modal_diff"></div>
        `,
        botoes: `
            <button type="button" class="botao_secundario" id="modal_cancelar">Cancelar</button>
            <button type="button" class="botao_secundario" id="modal_put">Substituir tudo (PUT)</button>
            <button type="button" id="modal_patch">Salvar alterações (PATCH)</button>
        `
    })

    // mostra em tempo real quais campos serão enviados no PATCH
    CAMPOS_PRODUTO.forEach(campo => {
        const entrada = document.getElementById('m_' + campo)
        if (entrada) entrada.addEventListener('input', () => mostrarDiff(original))
        if (entrada && entrada.tagName === 'SELECT') entrada.addEventListener('change', () => mostrarDiff(original))
    })

    document.getElementById('modal_cancelar').addEventListener('click', fecharModal)
    document.getElementById('modal_patch').addEventListener('click', () => salvarPatch(produto.id, original))
    document.getElementById('modal_put').addEventListener('click', () => salvarPut(produto.id))
}

function lerModal() {
    return {
        nome: document.getElementById('m_nome').value.trim(),
        descricao: document.getElementById('m_descricao').value.trim(),
        preco: Number(document.getElementById('m_preco').value),
        categoria_id: Number(document.getElementById('m_categoria_id').value),
        tipo: document.getElementById('m_tipo').value,
        nivel: document.getElementById('m_nivel').value,
        tempo_minutos: Number(document.getElementById('m_tempo_minutos').value),
        imagem_url: document.getElementById('m_imagem_url').value.trim()
    }
}

// Lista para o usuário o que mudou, antes de ele salvar
function mostrarDiff(original) {
    const alterados = camposAlterados(original, lerModal())
    const alvo = document.getElementById('modal_diff')

    if (!alvo) return

    if (Object.keys(alterados).length === 0) {
        alvo.innerHTML = ''
        return
    }

    alvo.innerHTML = `
        <div class="modal_diff">
            <strong>O PATCH vai enviar ${Object.keys(alterados).length} campo(s):</strong>
            <ul>
                ${Object.keys(alterados).map(c => `
                    <li>${ROTULOS_PRODUTO[c] || c}: <code>${original[c] || '(vazio)'}</code> → <code>${alterados[c]}</code></li>
                `).join('')}
            </ul>
        </div>
    `
}

// PATCH - manda somente os campos alterados
function salvarPatch(id, original) {

    const atual = lerModal()

    if (!atual.nome || !atual.preco) {
        mensagemModal('Nome e preço não podem ficar vazios.', 'aviso')
        return
    }

    if (atual.preco <= 0) {
        mensagemModal('O preço deve ser maior que zero.', 'erro')
        return
    }

    const alterados = camposAlterados(original, atual)

    if (Object.keys(alterados).length === 0) {
        mensagemModal('Nenhum campo foi alterado.', 'aviso')
        return
    }

    fetch(`${API_URL}/produtos/${id}`, {
        method: 'PATCH',
        headers: cabecalhoAutorizacao(),
        body: JSON.stringify(alterados)
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mensagemModal(dados.error, 'erro')
                return
            }

            fecharModal()
            mostrarMensagem('resposta',
                `${dados.message} Campos enviados: ${Object.keys(alterados).map(c => ROTULOS_PRODUTO[c] || c).join(', ')}.`,
                'sucesso')
            listarProdutos(true)
        })
        .catch((err) => {
            console.error('Erro ao atualizar o produto!', err)
            mensagemModal('Não foi possível salvar as alterações.', 'erro')
        })
}

// PUT - substitui o registro inteiro
function salvarPut(id) {

    const atual = lerModal()

    if (!atual.nome || !atual.preco || !atual.categoria_id || !atual.imagem_url) {
        mensagemModal('No PUT nome, preço, categoria e imagem são obrigatórios.', 'aviso')
        return
    }

    fetch(`${API_URL}/produtos/${id}`, {
        method: 'PUT',
        headers: cabecalhoAutorizacao(),
        body: JSON.stringify({ ...atual, status: true })
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mensagemModal(dados.error, 'erro')
                return
            }

            fecharModal()
            mostrarMensagem('resposta', `${dados.message} (registro inteiro substituído pelo PUT)`, 'sucesso')
            listarProdutos(true)
        })
        .catch((err) => {
            console.error('Erro ao atualizar o produto!', err)
            mensagemModal('Não foi possível substituir o produto.', 'erro')
        })
}

// ==========================================================
// |  EXCLUSÃO (DELETE) - confirmação em modal              |
// ==========================================================
function confirmarExclusao(id) {

    const produto = produtosCarregados.find(p => p.id === id)
    if (!produto) return

    confirmarAcao({
        titulo: 'Apagar produto',
        mensagem: `Tem certeza que deseja apagar <strong>${produto.nome}</strong>?`,
        detalhe: 'Se o produto já tiver vendas registradas, ele não é apagado: fica apenas desativado da vitrine, para não quebrar o histórico dos pedidos.',
        textoConfirmar: 'Apagar produto',
        perigo: true,
        aoConfirmar: () => apagarProduto(id)
    })
}

function apagarProduto(id) {
    fetch(`${API_URL}/produtos/${id}`, {
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
            listarProdutos(true)
        })
        .catch((err) => {
            console.error('Erro ao apagar o produto!', err)
            mostrarMensagem('resposta', 'Não foi possível apagar o produto.', 'erro')
        })
}
