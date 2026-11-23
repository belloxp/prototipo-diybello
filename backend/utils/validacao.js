// ==========================================================
// |  VALIDAÇÕES SIMPLES                                    |
// ==========================================================

// Mantém apenas os dígitos de uma string (útil para CEP, telefone, etc.).
function somenteNumeros(valor) {
    return String(valor || '').replace(/\D/g, '')
}

// CEP brasileiro válido = exatamente 8 dígitos numéricos.
function validaCEP(cep) {
    const limpo = somenteNumeros(cep)
    return /^\d{8}$/.test(limpo)
}

module.exports = { somenteNumeros, validaCEP }
