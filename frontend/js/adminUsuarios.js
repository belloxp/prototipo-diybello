// ==========================================================
// |  DIYBELLO - CLIENTES CADASTRADOS (privada ADMIN)       |
// |  GET /usuarios | GET /usuarios/buscar?s=               |
// |  PATCH /usuarios/:id (ativar/desativar e nível)        |
// |  DELETE /usuarios/:id                                  |
// ==========================================================

let usuariosCarregados = []

document.addEventListener('DOMContentLoaded', () => {

    if (!protegerTela(true)) return

    listarUsuarios()

    document.getElementById('btn_listar').addEventListener('click', listarUsuarios)

    document.getElementById('form_busca').addEventListener('submit', (e) => {
        e.preventDefault()
        consultarUsuarios()
    })
})

function listarUsuarios(manterMensagem) {

    // depois de salvar/apagar a mensagem de sucesso precisa sobreviver ao recarregar da lista
    if (!manterMensagem) limparMensagem('resposta')

    fetch(`${API_URL}/usuarios`, {
        headers: cabecalhoAutorizacao()
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            usuariosCarregados = dados
            desenharTabela(dados)
        })
        .catch((err) => {
            console.error('Erro ao consultar os usuários!', err)
            mostrarMensagem('resposta', 'Não foi possível carregar os clientes.', 'erro')
        })
}

function consultarUsuarios() {
    const termo = document.getElementById('busca').value.trim()

    if (!termo) {
        listarUsuarios()
        return
    }

    fetch(`${API_URL}/usuarios/buscar?s=${encodeURIComponent(termo)}`, {
        headers: cabecalhoAutorizacao()
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            usuariosCarregados = dados
            desenharTabela(dados)
        })
        .catch((err) => {
            console.error('Erro ao consultar os usuários!', err)
        })
}

function desenharTabela(usuarios) {

    const elemento = document.getElementById('lista_usuarios')

    if (usuarios.length === 0) {
        elemento.innerHTML = '<div class="vazio">Nenhum cliente encontrado.</div>'
        return
    }

    const linhas = usuarios.map(usuario => ([
        usuario.id,
        usuario.nome,
        usuario.email,
        mascararCPF(usuario.cpf),
        `${usuario.cidade} / ${usuario.uf}`,
        usuario.nivel_acesso === 'ADMIN'
            ? '<span class="etiqueta dourada">Administrador</span>'
            : '<span class="etiqueta azul">Cliente</span>',
        usuario.status
            ? '<span class="etiqueta verde">Ativo</span>'
            : '<span class="etiqueta vermelha">Inativo</span>',
        formatarData(usuario.createdAt),
        `<div class="acoes">
            ${botaoIcone('ligar', `btn_status ${usuario.status ? 'ativo' : ''}`, usuario.id,
            usuario.status ? 'Desativar o cliente' : 'Ativar o cliente')}
            ${botaoIcone('apagar', 'perigo btn_apagar', usuario.id, 'Apagar o cliente')}
        </div>`
    ]))

    elemento.innerHTML = montarTabela(
        ['Cód.', 'Nome', 'E-mail', 'CPF', 'Cidade', 'Nível', 'Status', 'Cadastro', 'Ações'],
        linhas
    )

    elemento.querySelectorAll('.btn_status').forEach(botao => {
        botao.addEventListener('click', () => confirmarStatus(Number(botao.dataset.id)))
    })

    elemento.querySelectorAll('.btn_apagar').forEach(botao => {
        botao.addEventListener('click', () => confirmarExclusao(Number(botao.dataset.id)))
    })
}

// Esconde parte do CPF na listagem por segurança
function mascararCPF(cpf) {
    if (!cpf || cpf.length !== 11) return cpf || '-'
    return `${cpf.substring(0, 3)}.***.***-${cpf.substring(9)}`
}

// PATCH /usuarios/:id - confirmação em modal
function confirmarStatus(id) {

    const usuario = usuariosCarregados.find(u => u.id === id)
    if (!usuario) return

    if (usuario.id === pegarUsuario().id) {
        mostrarMensagem('resposta', 'Você não pode desativar a sua própria conta.', 'aviso')
        return
    }

    confirmarAcao({
        titulo: usuario.status ? 'Desativar cliente' : 'Ativar cliente',
        mensagem: usuario.status
            ? `Desativar a conta de <strong>${usuario.nome}</strong>?`
            : `Reativar a conta de <strong>${usuario.nome}</strong>?`,
        detalhe: usuario.status
            ? 'O cliente deixa de conseguir entrar no sistema, mas o cadastro e os pedidos dele continuam guardados.'
            : 'O cliente volta a conseguir entrar no sistema normalmente.',
        textoConfirmar: usuario.status ? 'Desativar conta' : 'Ativar conta',
        aoConfirmar: () => alternarStatus(id)
    })
}

function alternarStatus(id) {

    const usuario = usuariosCarregados.find(u => u.id === id)
    if (!usuario) return

    fetch(`${API_URL}/usuarios/${id}`, {
        method: 'PATCH',
        headers: cabecalhoAutorizacao(),
        body: JSON.stringify({ status: !usuario.status })
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            mostrarMensagem('resposta', `Cliente ${usuario.nome} ${usuario.status ? 'desativado' : 'ativado'}.`, 'sucesso')
            listarUsuarios(true)
        })
        .catch((err) => {
            console.error('Erro ao atualizar o usuário!', err)
        })
}

// DELETE /usuarios/:id - confirmação em modal
function confirmarExclusao(id) {

    const usuario = usuariosCarregados.find(u => u.id === id)
    if (!usuario) return

    if (usuario.id === pegarUsuario().id) {
        mostrarMensagem('resposta', 'Use a tela de Perfil para apagar a sua própria conta.', 'aviso')
        return
    }

    confirmarAcao({
        titulo: 'Apagar cliente',
        mensagem: `Tem certeza que deseja apagar <strong>${usuario.nome}</strong>?`,
        detalhe: `Todos os pedidos e entregas desse cliente também serão apagados.
                  Se a intenção é só bloquear o acesso, use o botão de desativar.`,
        textoConfirmar: 'Apagar cliente',
        perigo: true,
        aoConfirmar: () => apagarUsuario(id)
    })
}

function apagarUsuario(id) {

    fetch(`${API_URL}/usuarios/${id}`, {
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
            listarUsuarios(true)
        })
        .catch((err) => {
            console.error('Erro ao apagar o usuário!', err)
        })
}
