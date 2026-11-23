// ==========================================================
// |  DIYBELLO - CONFIGURAÇÃO E FUNÇÕES DE APOIO            |
// |  Carregado em TODAS as páginas antes dos demais js.    |
// |  - endereço da API                                     |
// |  - sessão (token JWT + usuário) no LocalStorage        |
// |  - proteção de tela por nível de acesso                |
// |  - mensagens, formatadores e utilidades da interface   |
// ==========================================================

// Endereço base do backend (Express rodando localmente na porta 3000)
const API_URL = 'http://localhost:3000'

// Chaves usadas no LocalStorage
const CHAVE_TOKEN = 'diybello_token'
const CHAVE_USUARIO = 'diybello_usuario'
const CHAVE_CARRINHO = 'diybello_carrinho'

// Página de login (todas as telas internas ficam dentro de /html/)
const PAGINA_LOGIN = '../index.html'


// ==========================================================
// |  SESSÃO                                                |
// ==========================================================

// Guarda o token e os dados do usuário logado
function salvarSessao(token, usuario) {
    localStorage.setItem(CHAVE_TOKEN, token)
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario))
}

// Devolve o token JWT (ou null quando não há login)
function pegarToken() {
    return localStorage.getItem(CHAVE_TOKEN)
}

// Devolve o objeto do usuário logado (ou null)
function pegarUsuario() {
    const dados = localStorage.getItem(CHAVE_USUARIO)

    if (!dados) return null

    try {
        return JSON.parse(dados)
    } catch (err) {
        console.error('Sessão corrompida no LocalStorage, limpando...', err)
        localStorage.removeItem(CHAVE_USUARIO)
        return null
    }
}

// Existe um usuário logado?
function estaLogado() {
    return !!pegarToken() && !!pegarUsuario()
}

// Cabeçalho padrão das rotas privadas (JSON + token)
function cabecalhoAutorizacao() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pegarToken()}`
    }
}

// Encerra a sessão e volta para o login
function sair() {
    localStorage.removeItem(CHAVE_TOKEN)
    localStorage.removeItem(CHAVE_USUARIO)
    window.location.href = PAGINA_LOGIN
}


// ==========================================================
// |  PROTEÇÃO DE TELA                                      |
// |  Sem token -> volta para o login.                      |
// |  exigeAdmin = true e usuário comum -> volta para loja. |
// ==========================================================
function protegerTela(exigeAdmin) {

    const usuario = pegarUsuario()

    if (!pegarToken() || !usuario) {
        window.location.href = PAGINA_LOGIN
        return false
    }

    if (exigeAdmin && usuario.nivel_acesso !== 'ADMIN') {
        window.location.href = './loja.html'
        return false
    }

    return true
}

// Trata a resposta das rotas privadas: token vencido derruba a sessão.
function tratarResposta(res) {

    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem(CHAVE_TOKEN)
        localStorage.removeItem(CHAVE_USUARIO)
        window.location.href = PAGINA_LOGIN
        return { error: 'Sessão expirada. Faça login novamente.' }
    }

    return res.json()
}


// ==========================================================
// |  MENSAGENS NA TELA                                     |
// |  tipo = sucesso | erro | aviso | info                  |
// ==========================================================
function mostrarMensagem(id, texto, tipo) {

    const elemento = document.getElementById(id)

    if (!elemento) return

    elemento.innerHTML = `<div class="mensagem ${tipo || 'info'}">${texto}</div>`
}

function limparMensagem(id) {
    const elemento = document.getElementById(id)

    if (elemento) elemento.innerHTML = ''
}


// ==========================================================
// |  FORMATADORES                                          |
// ==========================================================

// 189.9 -> "R$ 189,90"
function formatarPreco(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })
}

// Data ISO -> "31/08/2026"
function formatarData(data) {
    if (!data) return '-'
    return new Date(data).toLocaleDateString('pt-BR')
}

// Nível do produto -> rótulo amigável
function formatarNivel(nivel) {
    const rotulos = {
        INICIANTE: 'Iniciante',
        INTERMEDIARIO: 'Intermediário',
        AVANCADO: 'Avançado'
    }
    return rotulos[nivel] || nivel || '-'
}

// Status da entrega -> rótulo amigável
function formatarStatusEntrega(status) {
    const rotulos = {
        PREPARANDO: 'Preparando',
        EM_TRANSITO: 'Em trânsito',
        ENTREGUE: 'Entregue',
        CANCELADA: 'Cancelada'
    }
    return rotulos[status] || status || '-'
}

// Monta o caminho da imagem a partir do que está salvo no banco.
// O banco guarda "/img/arquivo.svg" e as telas ficam em /html/,
// então o caminho relativo correto é "../img/arquivo.svg".
function resolverImagem(url) {
    if (!url) return '../img/placeholder.svg'
    if (url.startsWith('http')) return url
    if (url.startsWith('/img/')) return '..' + url
    if (url.startsWith('img/')) return '../' + url
    return url
}

// Compara o registro original com o atual e devolve só o que mudou.
// Usado nas edições em modal para montar o PATCH.
function camposAlterados(original, atual) {
    const alterados = {}

    Object.keys(atual).forEach(campo => {
        if (String(atual[campo]) !== String(original[campo])) {
            alterados[campo] = atual[campo]
        }
    })

    return alterados
}
