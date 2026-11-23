// ==========================================================
// |  DIYBELLO - VALIDAÇÕES E MÁSCARAS DE FORMULÁRIO        |
// |  Usado no cadastro e no perfil.                        |
// |  - máscaras de CPF, CEP e telefone                     |
// |  - validação matemática de CPF e formato de e-mail     |
// |  - consulta de endereço no ViaCEP                      |
// ==========================================================

// Remove tudo que não é dígito
function somenteNumeros(valor) {
    return String(valor || '').replace(/\D/g, '')
}


// ==========================================================
// |  MÁSCARAS                                              |
// ==========================================================

// 000.000.000-00
function mascaraCPF(valor) {
    return somenteNumeros(valor)
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

// 00000-000
function mascaraCEP(valor) {
    return somenteNumeros(valor)
        .slice(0, 8)
        .replace(/(\d{5})(\d)/, '$1-$2')
}

// (00) 00000-0000
function mascaraTelefone(valor) {
    return somenteNumeros(valor)
        .slice(0, 11)
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
}


// ==========================================================
// |  VALIDAÇÕES                                            |
// ==========================================================

// CPF válido pela fórmula dos dígitos verificadores
function validaCPF(cpf) {
    const numeros = somenteNumeros(cpf)

    if (numeros.length !== 11) return false
    if (/^(\d)\1{10}$/.test(numeros)) return false // rejeita 000... 111... etc.

    const calculaDigito = (base) => {
        let soma = 0
        for (let i = 0; i < base.length; i++) {
            soma += Number(base[i]) * (base.length + 1 - i)
        }
        const resto = (soma * 10) % 11
        return resto === 10 ? 0 : resto
    }

    const digito1 = calculaDigito(numeros.slice(0, 9))
    const digito2 = calculaDigito(numeros.slice(0, 10))

    return digito1 === Number(numeros[9]) && digito2 === Number(numeros[10])
}

// Formato simples de e-mail
function validaEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''))
}


// ==========================================================
// |  VIACEP                                                |
// |  buscarCEP('01310-100', { rua:'rua', ... }, 'aviso')   |
// |  preenche os campos do endereço e escreve um aviso.    |
// ==========================================================
function buscarCEP(cep, campos, avisoId) {

    const aviso = document.getElementById(avisoId)
    const cepLimpo = somenteNumeros(cep)

    if (cepLimpo.length !== 8) {
        if (aviso) {
            aviso.textContent = 'O CEP precisa ter 8 dígitos.'
            aviso.style.color = '#B01732'
        }
        return
    }

    if (aviso) {
        aviso.textContent = 'Buscando endereço...'
        aviso.style.color = ''
    }

    fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
        .then(res => res.json())
        .then(dados => {

            if (dados.erro) {
                if (aviso) {
                    aviso.textContent = 'CEP não encontrado.'
                    aviso.style.color = '#B01732'
                }
                return
            }

            // ViaCEP -> campos do formulário
            const preencher = (elementoId, valor) => {
                const campo = document.getElementById(elementoId)
                if (campo && valor) campo.value = valor
            }

            preencher(campos.rua, dados.logradouro)
            preencher(campos.bairro, dados.bairro)
            preencher(campos.cidade, dados.localidade)
            preencher(campos.uf, dados.uf)

            if (aviso) {
                aviso.textContent = 'Endereço preenchido pelo CEP. Confira o número.'
                aviso.style.color = '#0B7A55'
            }

            // Manda o foco para o número, que o ViaCEP não traz
            if (campos.numero) {
                const numero = document.getElementById(campos.numero)
                if (numero) numero.focus()
            }
        })
        .catch((err) => {
            console.error('Erro ao consultar o ViaCEP!', err)
            if (aviso) {
                aviso.textContent = 'Não foi possível consultar o CEP agora.'
                aviso.style.color = '#B01732'
            }
        })
}
