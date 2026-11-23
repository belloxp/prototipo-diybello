// ==========================================================
// |  DIYBELLO - CONTROLE DE ESTOQUE (rota privada ADMIN)   |
// |  POST   /estoque      - dar entrada ou saída           |
// |  GET    /estoque      - histórico                      |
// |  GET    /estoque/buscar?s= - consulta                  |
// |  PUT    /estoque/:id  - corrigir a movimentação        |
// |  PATCH  /estoque/:id  - ajustar só o motivo            |
// |  DELETE /estoque/:id  - estornar                       |
// ==========================================================

let produtosCarregados = []
let movimentosCarregados = []

document.addEventListener('DOMContentLoaded', () => {

    if (!protegerTela(true)) return

    carregarProdutos()
    listarMovimentos()

    document.getElementById('btn_salvar').addEventListener('click', salvarMovimento)
    document.getElementById('btn_listar').addEventListener('click', listarMovimentos)

    document.getElementById('produto_id').addEventListener('change', mostrarSaldo)

    document.getElementById('form_busca').addEventListener('submit', (e) => {
        e.preventDefault()
        consultarMovimentos()
    })
})

// ---------------- PRODUTOS DO SELECT ----------------
function carregarProdutos() {
    fetch(`${API_URL}/produtos/admin`, {
        headers: cabecalhoAutorizacao()
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) return

            produtosCarregados = dados

            const select = document.getElementById('produto_id')
            select.innerHTML = dados
                .map(p => `<option value="${p.id}">${p.id} - ${p.nome}</option>`)
                .join('')

            // Se veio do alerta de reposição do painel já seleciona o produto
            const parametros = new URLSearchParams(window.location.search)

            if (parametros.get('produto_id')) {
                select.value = parametros.get('produto_id')
            }

            mostrarSaldo()
        })
        .catch((err) => {
            console.error('Erro ao consultar os produtos!', err)
        })
}

function mostrarSaldo() {
    const id = Number(document.getElementById('produto_id').value)
    const produto = produtosCarregados.find(p => p.id === id)
    const info = document.getElementById('saldo_atual_info')

    if (!produto) {
        info.innerHTML = ''
        return
    }

    info.innerHTML = `<div class="mensagem info">Saldo atual de "${produto.nome}": <strong>${produto.estoque_atual}</strong> unidade(s).</div>`
}

// ---------------- LISTAGEM ----------------
function listarMovimentos(manterMensagem) {

    // depois de salvar/apagar a mensagem de sucesso precisa sobreviver ao recarregar da lista
    if (!manterMensagem) limparMensagem('resposta')

    const tipo = document.getElementById('filtro_tipo').value
    const filtros = tipo ? `?tipo=${tipo}` : ''

    fetch(`${API_URL}/estoque${filtros}`, {
        headers: cabecalhoAutorizacao()
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            movimentosCarregados = dados
            desenharTabela(dados)
        })
        .catch((err) => {
            console.error('Erro ao consultar o estoque!', err)
            mostrarMensagem('resposta', 'Não foi possível carregar o histórico de estoque.', 'erro')
        })
}

function consultarMovimentos() {
    const termo = document.getElementById('busca').value.trim()

    if (!termo) {
        listarMovimentos()
        return
    }

    fetch(`${API_URL}/estoque/buscar?s=${encodeURIComponent(termo)}`, {
        headers: cabecalhoAutorizacao()
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            movimentosCarregados = dados
            desenharTabela(dados)
        })
        .catch((err) => {
            console.error('Erro ao consultar o estoque!', err)
        })
}

function desenharTabela(movimentos) {

    const elemento = document.getElementById('lista_movimentos')

    if (movimentos.length === 0) {
        elemento.innerHTML = '<div class="vazio">Nenhuma movimentação encontrada.</div>'
        return
    }

    const linhas = movimentos.map(movimento => ([
        movimento.id,
        formatarData(movimento.data),
        movimento.produtoEstoque ? movimento.produtoEstoque.nome : `Produto ${movimento.produto_id}`,
        movimento.tipo === 'ENTRADA'
            ? '<span class="etiqueta verde">Entrada</span>'
            : '<span class="etiqueta vermelha">Saída</span>',
        movimento.quantidade,
        movimento.saldo_anterior,
        `<strong>${movimento.saldo_atual}</strong>`,
        movimento.motivo || '-',
        `<div class="acoes">
            ${botaoIcone('editar', 'btn_editar', movimento.id, 'Corrigir a movimentação')}
            ${botaoIcone('estornar', 'perigo btn_estornar', movimento.id, 'Estornar a movimentação')}
        </div>`
    ]))

    elemento.innerHTML = montarTabela(
        ['Cód.', 'Data', 'Produto', 'Tipo', 'Qtd.', 'Saldo antes', 'Saldo depois', 'Motivo', 'Ações'],
        linhas
    )

    elemento.querySelectorAll('.btn_editar').forEach(botao => {
        botao.addEventListener('click', () => abrirModalCorrecao(Number(botao.dataset.id)))
    })

    elemento.querySelectorAll('.btn_estornar').forEach(botao => {
        botao.addEventListener('click', () => confirmarEstorno(Number(botao.dataset.id)))
    })
}

// ---------------- LANÇAMENTO NOVO (POST) ----------------
function salvarMovimento() {
    limparMensagem('resposta')

    const valores = {
        produto_id: Number(document.getElementById('produto_id').value),
        tipo: document.getElementById('tipo').value,
        quantidade: Number(document.getElementById('quantidade').value),
        motivo: document.getElementById('motivo').value.trim()
    }

    if (!valores.produto_id) {
        mostrarMensagem('resposta', 'Escolha o produto da movimentação.', 'aviso')
        return
    }

    if (valores.quantidade < 1) {
        mostrarMensagem('resposta', 'A quantidade deve ser de pelo menos 1 item.', 'erro')
        return
    }

    fetch(`${API_URL}/estoque`, {
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

            mostrarMensagem('resposta',
                `${dados.message} Novo saldo: ${dados.estoque.saldo_atual} unidade(s).`, 'sucesso')

            document.getElementById('quantidade').value = 1
            document.getElementById('motivo').value = ''
            carregarProdutos()
            listarMovimentos(true)
        })
        .catch((err) => {
            console.error('Erro ao registrar a movimentação!', err)
            mostrarMensagem('resposta', 'Não foi possível registrar a movimentação.', 'erro')
        })
}

// ==========================================================
// |  CORREÇÃO NO MODAL                                     |
// |  PUT   -> muda tipo/quantidade e recalcula o saldo     |
// |  PATCH -> ajusta só o motivo do lançamento             |
// ==========================================================

const ROTULOS_ESTOQUE = { tipo: 'Tipo', quantidade: 'Quantidade', motivo: 'Motivo' }

function abrirModalCorrecao(id) {

    const movimento = movimentosCarregados.find(m => m.id === id)
    if (!movimento) return

    const produto = movimento.produtoEstoque
        ? movimento.produtoEstoque.nome
        : `Produto ${movimento.produto_id}`

    const original = {
        tipo: movimento.tipo,
        quantidade: movimento.quantidade,
        motivo: movimento.motivo || ''
    }

    abrirModal({
        titulo: `Corrigir movimentação nº ${movimento.id}`,
        subtitulo: produto,
        largura: '580px',
        corpo: `
            <div class="linha_form">
                <div class="campo">
                    <label for="m_tipo">Tipo da movimentação *</label>
                    <select id="m_tipo">
                        <option value="ENTRADA" ${movimento.tipo === 'ENTRADA' ? 'selected' : ''}>Entrada</option>
                        <option value="SAIDA" ${movimento.tipo === 'SAIDA' ? 'selected' : ''}>Saída</option>
                    </select>
                </div>

                <div class="campo">
                    <label for="m_quantidade">Quantidade *</label>
                    <input type="number" id="m_quantidade" min="1" value="${movimento.quantidade}">
                </div>
            </div>

            <div class="campo">
                <label for="m_motivo">Motivo</label>
                <input type="text" id="m_motivo" value="${(movimento.motivo || '').replace(/"/g, '&quot;')}">
            </div>

            <div class="modal_detalhe">
                Este lançamento levou o saldo de <strong>${movimento.saldo_anterior}</strong>
                para <strong>${movimento.saldo_atual}</strong>.
                Mudar o tipo ou a quantidade recalcula o saldo do produto.
            </div>

            <div id="modal_diff"></div>
        `,
        botoes: `
            <button type="button" class="botao_secundario" id="modal_cancelar">Cancelar</button>
            <button type="button" class="botao_secundario" id="modal_patch">Ajustar só o motivo (PATCH)</button>
            <button type="button" id="modal_put">Salvar correção (PUT)</button>
        `
    })

    const campos = ['tipo', 'quantidade', 'motivo']

    campos.forEach(campo => {
        const entrada = document.getElementById('m_' + campo)
        if (entrada) {
            entrada.addEventListener('input', () => mostrarDiff(original))
            entrada.addEventListener('change', () => mostrarDiff(original))
        }
    })

    document.getElementById('modal_cancelar').addEventListener('click', fecharModal)
    document.getElementById('modal_put').addEventListener('click', () => salvarCorrecao(movimento.id))
    document.getElementById('modal_patch').addEventListener('click', () => ajustarMotivo(movimento.id, original))
}

function lerModal() {
    return {
        tipo: document.getElementById('m_tipo').value,
        quantidade: Number(document.getElementById('m_quantidade').value),
        motivo: document.getElementById('m_motivo').value.trim()
    }
}

// Mostra em tempo real o que foi alterado
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
            <strong>Campos alterados:</strong>
            <ul>${Object.keys(alterados).map(c =>
        `<li>${ROTULOS_ESTOQUE[c] || c}: <code>${original[c] || '(vazio)'}</code> &rarr; <code>${alterados[c]}</code></li>`
    ).join('')}</ul>
        </div>
    `
}

// PUT - corrige tipo/quantidade e recalcula o saldo do produto
function salvarCorrecao(id) {

    const atual = lerModal()

    if (atual.quantidade < 1) {
        mensagemModal('A quantidade deve ser de pelo menos 1 item.', 'erro')
        return
    }

    fetch(`${API_URL}/estoque/${id}`, {
        method: 'PUT',
        headers: cabecalhoAutorizacao(),
        body: JSON.stringify(atual)
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mensagemModal(dados.error, 'erro')
                return
            }

            fecharModal()
            mostrarMensagem('resposta',
                `${dados.message} Saldo recalculado para ${dados.estoque.saldo_atual} unidade(s).`, 'sucesso')
            carregarProdutos()
            listarMovimentos(true)
        })
        .catch((err) => {
            console.error('Erro ao corrigir a movimentação!', err)
            mensagemModal('Não foi possível salvar a correção.', 'erro')
        })
}

// PATCH - ajusta apenas o motivo, sem mexer no saldo
function ajustarMotivo(id, original) {

    const alterados = camposAlterados(original, lerModal())

    if (alterados.tipo !== undefined || alterados.quantidade !== undefined) {
        mensagemModal('Tipo e quantidade mexem no saldo, então precisam do PUT. Use "Salvar correção".', 'aviso')
        return
    }

    if (alterados.motivo === undefined) {
        mensagemModal('Nenhum campo foi alterado.', 'aviso')
        return
    }

    fetch(`${API_URL}/estoque/${id}`, {
        method: 'PATCH',
        headers: cabecalhoAutorizacao(),
        body: JSON.stringify({ motivo: alterados.motivo })
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mensagemModal(dados.error, 'erro')
                return
            }

            fecharModal()
            mostrarMensagem('resposta', `${dados.message} Campo enviado: Motivo.`, 'sucesso')
            listarMovimentos(true)
        })
        .catch((err) => {
            console.error('Erro ao ajustar o motivo!', err)
            mensagemModal('Não foi possível ajustar o motivo.', 'erro')
        })
}

// ==========================================================
// |  ESTORNO (DELETE) - confirmação em modal               |
// ==========================================================
function confirmarEstorno(id) {

    const movimento = movimentosCarregados.find(m => m.id === id)
    if (!movimento) return

    const produto = movimento.produtoEstoque
        ? movimento.produtoEstoque.nome
        : `Produto ${movimento.produto_id}`

    const efeito = movimento.tipo === 'ENTRADA'
        ? `serão retiradas ${movimento.quantidade} unidade(s) do saldo`
        : `serão devolvidas ${movimento.quantidade} unidade(s) ao saldo`

    confirmarAcao({
        titulo: 'Estornar movimentação',
        mensagem: `Estornar a movimentação nº <strong>${movimento.id}</strong> de <strong>${produto}</strong>?`,
        detalhe: `Era uma ${movimento.tipo === 'ENTRADA' ? 'entrada' : 'saída'} de ${movimento.quantidade} unidade(s), então ${efeito}. O lançamento sai do histórico.`,
        textoConfirmar: 'Estornar',
        perigo: true,
        aoConfirmar: () => estornarMovimento(id)
    })
}

function estornarMovimento(id) {
    fetch(`${API_URL}/estoque/${id}`, {
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
            carregarProdutos()
            listarMovimentos(true)
        })
        .catch((err) => {
            console.error('Erro ao estornar a movimentação!', err)
        })
}
