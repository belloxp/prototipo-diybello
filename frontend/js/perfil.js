// ==========================================================
// |  DIYBELLO - MEU PERFIL (cliente logado)                |
// |  GET    /usuarios/perfil - carrega os dados da conta    |
// |  PUT    /usuarios/:id     - atualiza tudo               |
// |  PATCH  /usuarios/:id     - atualiza só o que mudou      |
// |  DELETE /usuarios/:id     - apaga a própria conta        |
// ==========================================================

const CAMPOS_ENDERECO = {
    rua: 'rua',
    bairro: 'bairro',
    cidade: 'cidade',
    uf: 'uf',
    numero: 'numero'
}

// Guarda o estado original para o PATCH saber o que mudou
let perfilOriginal = null

document.addEventListener('DOMContentLoaded', () => {

    if (!protegerTela()) return

    // Máscaras dos campos
    const cpf = document.getElementById('cpf')
    const cep = document.getElementById('cep')
    const telefone = document.getElementById('telefone')

    cep.addEventListener('input', () => { cep.value = mascaraCEP(cep.value) })
    telefone.addEventListener('input', () => { telefone.value = mascaraTelefone(telefone.value) })

    // O CPF não muda por aqui (é chave única), fica só para leitura
    cpf.readOnly = true

    cep.addEventListener('blur', () => {
        buscarCEP(cep.value, CAMPOS_ENDERECO, 'aviso_cep')
    })

    document.getElementById('btn_atualizar').addEventListener('click', atualizarTudo)
    document.getElementById('btn_atualizar_parcial').addEventListener('click', atualizarParcial)
    document.getElementById('btn_apagar').addEventListener('click', confirmarExclusao)

    carregarPerfil()
})

// GET /usuarios/perfil
function carregarPerfil() {
    fetch(`${API_URL}/usuarios/perfil`, {
        headers: cabecalhoAutorizacao()
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            preencherFormulario(dados)
            perfilOriginal = lerFormulario()
        })
        .catch((err) => {
            console.error('Erro ao consultar o perfil!', err)
            mostrarMensagem('resposta', 'Não foi possível carregar o seu perfil.', 'erro')
        })
}

function preencherFormulario(usuario) {
    document.getElementById('id').value = usuario.id
    document.getElementById('nivel_acesso').value = usuario.nivel_acesso === 'ADMIN' ? 'Administrador' : 'Cliente'
    document.getElementById('nome').value = usuario.nome || ''
    document.getElementById('email').value = usuario.email || ''
    document.getElementById('cpf').value = mascaraCPF(usuario.cpf || '')
    document.getElementById('telefone').value = mascaraTelefone(usuario.telefone || '')
    document.getElementById('cep').value = mascaraCEP(usuario.cep || '')
    document.getElementById('rua').value = usuario.rua || ''
    document.getElementById('numero').value = usuario.numero || ''
    document.getElementById('complemento').value = usuario.complemento || ''
    document.getElementById('bairro').value = usuario.bairro || ''
    document.getElementById('cidade').value = usuario.cidade || ''
    document.getElementById('uf').value = usuario.uf || ''
}

// Lê apenas os campos que o usuário pode editar (endereço com números limpos)
function lerFormulario() {
    return {
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefone: somenteNumeros(document.getElementById('telefone').value),
        cep: somenteNumeros(document.getElementById('cep').value),
        rua: document.getElementById('rua').value.trim(),
        numero: document.getElementById('numero').value.trim(),
        complemento: document.getElementById('complemento').value.trim(),
        bairro: document.getElementById('bairro').value.trim(),
        cidade: document.getElementById('cidade').value.trim(),
        uf: document.getElementById('uf').value.trim().toUpperCase()
    }
}

// Valida os campos comuns às duas formas de salvar
function validarPerfil(dados) {

    if (!dados.nome || !dados.email) {
        mostrarMensagem('resposta', 'Nome e e-mail são obrigatórios.', 'aviso')
        return false
    }

    if (!validaEmail(dados.email)) {
        mostrarMensagem('resposta', 'Digite um e-mail válido.', 'erro')
        return false
    }

    const senha = document.getElementById('senha').value
    if (senha && senha.length < 8) {
        mostrarMensagem('resposta', 'A nova senha deve ter no mínimo 8 caracteres.', 'erro')
        return false
    }

    return true
}

// PUT - envia o cadastro inteiro
function atualizarTudo() {

    limparMensagem('resposta')

    const dados = lerFormulario()

    if (!validarPerfil(dados)) return

    if (!dados.cep || !dados.rua || !dados.numero || !dados.bairro || !dados.cidade || !dados.uf) {
        mostrarMensagem('resposta', 'O endereço completo é obrigatório no PUT.', 'erro')
        return
    }

    const senha = document.getElementById('senha').value
    if (senha) dados.senha = senha

    enviarAtualizacao('PUT', dados)
}

// PATCH - envia só os campos que mudaram
function atualizarParcial() {

    limparMensagem('resposta')

    const atual = lerFormulario()

    if (!validarPerfil(atual)) return

    const alterados = camposAlterados(perfilOriginal, atual)

    const senha = document.getElementById('senha').value
    if (senha) alterados.senha = senha

    if (Object.keys(alterados).length === 0) {
        mostrarMensagem('resposta', 'Nenhum campo foi alterado.', 'aviso')
        return
    }

    enviarAtualizacao('PATCH', alterados)
}

function enviarAtualizacao(metodo, corpo) {

    const id = pegarUsuario().id

    fetch(`${API_URL}/usuarios/${id}`, {
        method: metodo,
        headers: cabecalhoAutorizacao(),
        body: JSON.stringify(corpo)
    })
        .then(tratarResposta)
        .then(dados => {
            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            // Atualiza a sessão para o cabeçalho refletir o novo nome/e-mail
            const usuario = pegarUsuario()
            usuario.nome = dados.usuario.nome
            usuario.email = dados.usuario.email
            salvarSessao(pegarToken(), usuario)

            document.getElementById('senha').value = ''
            perfilOriginal = lerFormulario()

            mostrarMensagem('resposta', dados.message, 'sucesso')
            montarCabecalho()
        })
        .catch((err) => {
            console.error('Erro ao atualizar o perfil!', err)
            mostrarMensagem('resposta', 'Não foi possível salvar as alterações.', 'erro')
        })
}

// DELETE - apaga a conta e volta para o login
function confirmarExclusao() {
    confirmarAcao({
        titulo: 'Apagar minha conta',
        mensagem: 'Tem certeza que deseja apagar a sua conta? Essa ação não pode ser desfeita.',
        detalhe: 'Você será desconectado e voltará para a tela de login.',
        textoConfirmar: 'Apagar conta',
        perigo: true,
        aoConfirmar: apagarConta
    })
}

function apagarConta() {

    const id = pegarUsuario().id

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

            sair()
        })
        .catch((err) => {
            console.error('Erro ao apagar a conta!', err)
            mostrarMensagem('resposta', 'Não foi possível apagar a conta.', 'erro')
        })
}
