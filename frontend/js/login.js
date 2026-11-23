// ==========================================================
// |  DIYBELLO - LOGIN (porta de entrada do sistema)        |
// |  POST /login -> guarda o token e o usuário e leva:     |
// |    ADMIN  -> painel administrativo                     |
// |    USER   -> loja                                      |
// ==========================================================

// Ícones do botão de mostrar/esconder a senha
const ICONE_OLHO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
const ICONE_OLHO_FECHADO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'

document.addEventListener('DOMContentLoaded', () => {

    // Se já existe sessão ativa, pula direto para a área certa
    if (estaLogado()) {
        redirecionarPorNivel(pegarUsuario())
        return
    }

    const formulario = document.querySelector('.login_caixa')

    formulario.addEventListener('submit', (e) => {
        e.preventDefault()
        entrar()
    })

    // Botão de olho mostra/esconde a senha (troca o ícone conforme o estado)
    document.getElementById('btn_ver_senha').addEventListener('click', (e) => {
        const botao = e.currentTarget
        const senha = document.getElementById('senha')
        const mostrando = senha.type === 'text'

        senha.type = mostrando ? 'password' : 'text'
        botao.innerHTML = mostrando ? ICONE_OLHO : ICONE_OLHO_FECHADO
        botao.title = mostrando ? 'Mostrar a senha' : 'Esconder a senha'
    })

    // Atalhos de acesso de teste (admin e cliente)
    document.querySelectorAll('.atalho').forEach(botao => {
        botao.addEventListener('click', () => {
            document.getElementById('email').value = botao.dataset.email
            document.getElementById('senha').value = botao.dataset.senha
            entrar()
        })
    })
})

function entrar() {

    limparMensagem('resposta')

    const email = document.getElementById('email').value.trim()
    const senha = document.getElementById('senha').value

    if (!email || !senha) {
        mostrarMensagem('resposta', 'Informe o e-mail e a senha.', 'aviso')
        return
    }

    fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    })
        .then(res => res.json())
        .then(dados => {

            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            salvarSessao(dados.token, dados.usuario)

            mostrarMensagem('resposta', `Bem-vindo(a), ${dados.usuario.nome}! Entrando...`, 'sucesso')

            setTimeout(() => redirecionarPorNivel(dados.usuario), 800)
        })
        .catch((err) => {
            console.error('Erro ao fazer login!', err)
            mostrarMensagem('resposta', 'Não foi possível conectar na API. Verifique se o servidor está rodando.', 'erro')
        })
}

// ADMIN vai para o painel, cliente vai para a loja
function redirecionarPorNivel(usuario) {
    if (usuario && usuario.nivel_acesso === 'ADMIN') {
        window.location.href = './html/admin.html'
    } else {
        window.location.href = './html/loja.html'
    }
}
