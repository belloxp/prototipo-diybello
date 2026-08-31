// ==========================================================
// |  DIYBELLO - CADASTRO DE CLIENTE (rota pública)         |
// |  POST /usuarios - com validação de CPF e ViaCEP        |
// ==========================================================

const CAMPOS_ENDERECO = {
    rua: 'rua',
    bairro: 'bairro',
    cidade: 'cidade',
    uf: 'uf',
    numero: 'numero'
}

document.addEventListener('DOMContentLoaded', () => {

    const cpf = document.getElementById('cpf')
    const cep = document.getElementById('cep')
    const telefone = document.getElementById('telefone')

    // ---------------- máscaras ----------------
    cpf.addEventListener('input', () => {
        cpf.value = mascaraCPF(cpf.value)
    })

    cep.addEventListener('input', () => {
        cep.value = mascaraCEP(cep.value)
    })

    telefone.addEventListener('input', () => {
        telefone.value = mascaraTelefone(telefone.value)
    })

    // ---------------- validação do CPF ao sair do campo ----------------
    cpf.addEventListener('blur', () => {
        const aviso = document.getElementById('aviso_cpf')

        if (!cpf.value) {
            aviso.textContent = ''
            return
        }

        if (validaCPF(cpf.value)) {
            aviso.textContent = 'CPF válido.'
            aviso.style.color = '#3C5E36'
        } else {
            aviso.textContent = 'CPF inválido pela fórmula dos dígitos verificadores.'
            aviso.style.color = '#8E3624'
        }
    })

    // ---------------- ViaCEP ao sair do campo do CEP ----------------
    cep.addEventListener('blur', () => {
        buscarCEP(cep.value, CAMPOS_ENDERECO, 'aviso_cep')
    })

    document.getElementById('btn_cadastrar').addEventListener('click', cadastrar)
})

function cadastrar(e) {
    e.preventDefault()
    limparMensagem('resposta')

    const nome = document.getElementById('nome').value.trim()
    const email = document.getElementById('email').value.trim()
    const senha = document.getElementById('senha').value
    const cpf = document.getElementById('cpf').value
    const telefone = document.getElementById('telefone').value
    const cep = document.getElementById('cep').value
    const rua = document.getElementById('rua').value.trim()
    const numero = document.getElementById('numero').value.trim()
    const complemento = document.getElementById('complemento').value.trim()
    const bairro = document.getElementById('bairro').value.trim()
    const cidade = document.getElementById('cidade').value.trim()
    const uf = document.getElementById('uf').value.trim()

    // ---------------- validações antes de chamar a API ----------------
    if (!nome || !email || !senha || !cpf) {
        mostrarMensagem('resposta', 'Preencha nome, e-mail, senha e CPF.', 'aviso')
        return
    }

    if (!validaEmail(email)) {
        mostrarMensagem('resposta', 'Digite um e-mail válido.', 'erro')
        return
    }

    if (senha.length < 8) {
        mostrarMensagem('resposta', 'A senha deve ter no mínimo 8 caracteres.', 'erro')
        return
    }

    if (!validaCPF(cpf)) {
        mostrarMensagem('resposta', 'CPF inválido. Confira os dígitos verificadores.', 'erro')
        return
    }

    if (!cep || !rua || !numero || !bairro || !cidade || !uf) {
        mostrarMensagem('resposta', 'O endereço completo é obrigatório. Digite o CEP para autocompletar.', 'erro')
        return
    }

    const valores = {
        nome: nome,
        email: email,
        senha: senha,
        cpf: somenteNumeros(cpf),
        telefone: somenteNumeros(telefone),
        cep: somenteNumeros(cep),
        rua: rua,
        numero: numero,
        complemento: complemento,
        bairro: bairro,
        cidade: cidade,
        uf: uf.toUpperCase()
    }

    fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valores)
    })
        .then(res => res.json())
        .then(dados => {
            console.log(dados)

            if (dados.error) {
                mostrarMensagem('resposta', dados.error, 'erro')
                return
            }

            mostrarMensagem('resposta', `${dados.message}! Redirecionando para o login...`, 'sucesso')

            setTimeout(() => {
                window.location.href = '../index.html'
            }, 1500)
        })
        .catch((err) => {
            console.error('Erro ao cadastrar os dados!', err)
            mostrarMensagem('resposta', 'Não foi possível conectar na API. Verifique se o servidor está rodando.', 'erro')
        })
}
