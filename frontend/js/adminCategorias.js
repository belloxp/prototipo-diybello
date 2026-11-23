// ==========================================================
// |  DIYBELLO - GESTÃO DE CATEGORIAS (privada ADMIN)       |
// |  POST /categorias        - cadastrar (formulário)      |
// |  GET  /categorias/admin  - listar tudo                 |
// |  GET  /categorias/buscar?s= - consultar                |
// |  PUT  /categorias/:id    - substituir o registro todo  |
// |  PATCH /categorias/:id   - só o que foi alterado       |
// |  DELETE /categorias/:id  - apagar                      |
// ==========================================================

let categoriasCarregadas = []

const ROTULOS_CATEGORIA = {
    nome: 'Nome',
    descricao: 'Descrição',
    imagem_url: 'Imagem'
}

document.addEventListener('DOMContentLoaded', () => {

    if (!protegerTela(true)) return

    listarCategorias()

    document.getElementById('btn_salvar').addEventListener('click', cadastrarCategoria)
    document.getElementById('btn_listar').addEventListener('click', listarCategorias)

    document.getElementById('form_busca').addEventListener('submit', (e) => {
        e.preventDefault()
        consultarCategorias()
    })
})

// ---------------- LISTAGEM ----------------
function listarCategorias(manterMensagem) {

    // depois de salvar/apagar a mensagem de sucesso precisa sobreviver ao recarregar da lista
    if (!manterMensagem) limparMensagem('resposta')

    fetch(`${API_URL}/categorias/admin`, {
        headers: cabecalhoAutorizacao()
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            categoriasCarregadas = dados
            desenharTabela(dados)
        })
        .catch((err) => {
            console.error('Erro ao consultar as categorias!', err)
            mostrarMensagem('resposta', 'Não foi possível carregar as categorias.', 'erro')
        })
}

function consultarCategorias() {
    const termo = document.getElementById('busca').value.trim()

    if (!termo) {
        listarCategorias()
        return
    }

    fetch(`${API_URL}/categorias/buscar?s=${encodeURIComponent(termo)}`)
        .then(res => res.json())
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            categoriasCarregadas = dados
            desenharTabela(dados)
        })
        .catch((err) => {
            console.error('Erro ao consultar as categorias!', err)
        })
}

function desenharTabela(categorias) {

    const elemento = document.getElementById('lista_categorias')

    if (categorias.length === 0) {
        elemento.innerHTML = '<div class="vazio">Nenhuma categoria encontrada.</div>'
        return
    }

    const linhas = categorias.map(categoria => ([
        categoria.id,
        categoria.nome,
        categoria.slug,
        (categoria.descricao || '-').substring(0, 70),
        categoria.status
            ? '<span class="etiqueta verde">Ativa</span>'
            : '<span class="etiqueta vermelha">Inativa</span>',
        `<div class="acoes">
            ${botaoIcone('editar', 'btn_editar', categoria.id, 'Editar a categoria')}
            ${botaoIcone('ligar', `btn_status ${categoria.status ? 'ativo' : ''}`, categoria.id,
            categoria.status ? 'Desativar a categoria' : 'Ativar a categoria')}
            ${botaoIcone('apagar', 'perigo btn_apagar', categoria.id, 'Apagar a categoria')}
        </div>`
    ]))

    elemento.innerHTML = montarTabela(
        ['Cód.', 'Nome', 'Slug', 'Descrição', 'Status', 'Ações'],
        linhas
    )

    elemento.querySelectorAll('.btn_editar').forEach(botao => {
        botao.addEventListener('click', () => abrirModalEdicao(Number(botao.dataset.id)))
    })

    elemento.querySelectorAll('.btn_status').forEach(botao => {
        botao.addEventListener('click', () => confirmarStatus(Number(botao.dataset.id)))
    })

    elemento.querySelectorAll('.btn_apagar').forEach(botao => {
        botao.addEventListener('click', () => confirmarExclusao(Number(botao.dataset.id)))
    })
}

// ---------------- CADASTRO (POST) ----------------
function cadastrarCategoria() {
    limparMensagem('resposta')

    const valores = {
        nome: document.getElementById('nome').value.trim(),
        descricao: document.getElementById('descricao').value.trim(),
        imagem_url: document.getElementById('imagem_url').value.trim() || '/img/placeholder.svg'
    }

    if (!valores.nome) {
        mostrarMensagem('resposta', 'O nome da categoria é obrigatório.', 'aviso')
        return
    }

    fetch(`${API_URL}/categorias`, {
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
            document.getElementById('nome').value = ''
            document.getElementById('descricao').value = ''
            document.getElementById('imagem_url').value = ''
            listarCategorias(true)
        })
        .catch((err) => {
            console.error('Erro ao cadastrar a categoria!', err)
        })
}

// ---------------- EDIÇÃO NO MODAL ----------------
function abrirModalEdicao(id) {

    const categoria = categoriasCarregadas.find(c => c.id === id)
    if (!categoria) return

    const original = {
        nome: categoria.nome,
        descricao: categoria.descricao || '',
        imagem_url: categoria.imagem_url || ''
    }

    abrirModal({
        titulo: `Editar categoria nº ${categoria.id}`,
        subtitulo: 'Altere só o que precisa. O sistema envia apenas os campos modificados.',
        largura: '560px',
        corpo: `
            <div class="campo">
                <label for="m_nome">Nome da categoria *</label>
                <input type="text" id="m_nome" value="${categoria.nome.replace(/"/g, '&quot;')}">
                <span class="ajuda">Mudar o nome também atualiza o slug usado na URL.</span>
            </div>

            <div class="campo">
                <label for="m_descricao">Descrição</label>
                <textarea id="m_descricao">${categoria.descricao || ''}</textarea>
            </div>

            <div class="campo">
                <label for="m_imagem_url">Imagem</label>
                <input type="text" id="m_imagem_url" value="${(categoria.imagem_url || '').replace(/"/g, '&quot;')}">
            </div>

            <div id="modal_diff"></div>
        `,
        botoes: `
            <button type="button" class="botao_secundario" id="modal_cancelar">Cancelar</button>
            <button type="button" class="botao_secundario" id="modal_put">Substituir tudo (PUT)</button>
            <button type="button" id="modal_patch">Salvar alterações (PATCH)</button>
        `
    })

    Object.keys(original).forEach(campo => {
        const entrada = document.getElementById('m_' + campo)
        if (entrada) entrada.addEventListener('input', () => mostrarDiff(original))
    })

    document.getElementById('modal_cancelar').addEventListener('click', fecharModal)
    document.getElementById('modal_patch').addEventListener('click', () => salvarPatch(categoria.id, original))
    document.getElementById('modal_put').addEventListener('click', () => salvarPut(categoria.id))
}

function lerModal() {
    return {
        nome: document.getElementById('m_nome').value.trim(),
        descricao: document.getElementById('m_descricao').value.trim(),
        imagem_url: document.getElementById('m_imagem_url').value.trim()
    }
}

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
            <ul>${Object.keys(alterados).map(c =>
        `<li>${ROTULOS_CATEGORIA[c] || c}: <code>${original[c] || '(vazio)'}</code> → <code>${alterados[c]}</code></li>`
    ).join('')}</ul>
        </div>
    `
}

function salvarPatch(id, original) {

    const atual = lerModal()

    if (!atual.nome) {
        mensagemModal('O nome da categoria não pode ficar vazio.', 'aviso')
        return
    }

    const alterados = camposAlterados(original, atual)

    if (Object.keys(alterados).length === 0) {
        mensagemModal('Nenhum campo foi alterado.', 'aviso')
        return
    }

    fetch(`${API_URL}/categorias/${id}`, {
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
                `${dados.message} Campos enviados: ${Object.keys(alterados).map(c => ROTULOS_CATEGORIA[c] || c).join(', ')}.`,
                'sucesso')
            listarCategorias(true)
        })
        .catch((err) => {
            console.error('Erro ao atualizar a categoria!', err)
            mensagemModal('Não foi possível salvar as alterações.', 'erro')
        })
}

function salvarPut(id) {

    const atual = lerModal()

    if (!atual.nome) {
        mensagemModal('No PUT o nome da categoria é obrigatório.', 'aviso')
        return
    }

    fetch(`${API_URL}/categorias/${id}`, {
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
            listarCategorias(true)
        })
        .catch((err) => {
            console.error('Erro ao atualizar a categoria!', err)
            mensagemModal('Não foi possível substituir a categoria.', 'erro')
        })
}

// ---------------- ATIVAR / DESATIVAR (PATCH) ----------------
function confirmarStatus(id) {

    const categoria = categoriasCarregadas.find(c => c.id === id)
    if (!categoria) return

    confirmarAcao({
        titulo: categoria.status ? 'Desativar categoria' : 'Ativar categoria',
        mensagem: categoria.status
            ? `Desativar <strong>${categoria.nome}</strong>?`
            : `Ativar <strong>${categoria.nome}</strong> de novo?`,
        detalhe: categoria.status
            ? 'A categoria some dos filtros da loja, mas os produtos dela continuam cadastrados.'
            : 'A categoria volta a aparecer nos filtros da loja.',
        textoConfirmar: categoria.status ? 'Desativar' : 'Ativar',
        aoConfirmar: () => alternarStatus(id, !categoria.status)
    })
}

function alternarStatus(id, novoStatus) {
    fetch(`${API_URL}/categorias/${id}`, {
        method: 'PATCH',
        headers: cabecalhoAutorizacao(),
        body: JSON.stringify({ status: novoStatus })
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            mostrarMensagem('resposta', dados.message, 'sucesso')
            listarCategorias(true)
        })
        .catch((err) => {
            console.error('Erro ao atualizar a categoria!', err)
        })
}

// ---------------- EXCLUSÃO (DELETE) ----------------
function confirmarExclusao(id) {

    const categoria = categoriasCarregadas.find(c => c.id === id)
    if (!categoria) return

    confirmarAcao({
        titulo: 'Apagar categoria',
        mensagem: `Tem certeza que deseja apagar <strong>${categoria.nome}</strong>?`,
        detalhe: 'Categorias com produtos vinculados não podem ser apagadas. Nesse caso, desative em vez de apagar.',
        textoConfirmar: 'Apagar categoria',
        perigo: true,
        aoConfirmar: () => apagarCategoria(id)
    })
}

function apagarCategoria(id) {
    fetch(`${API_URL}/categorias/${id}`, {
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
            listarCategorias(true)
        })
        .catch((err) => {
            console.error('Erro ao apagar a categoria!', err)
        })
}
