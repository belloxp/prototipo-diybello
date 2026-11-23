const { arredondar } = require('./function')

// ==========================================================
// |  REGRAS DE DESCONTO E FRETE (espelho do frontend)      |
// |  1. Cupom BEMVINDO10 = 10% | Cupom DIY15 = 15%         |
// |  2. 3 itens ou mais = 5% (não acumula com a regra 3)   |
// |  3. Acima de R$ 300 = 10% (vale a maior)               |
// |  4. Frete R$ 24,90 - grátis acima de R$ 250            |
// |  O desconto do cupom SOMA com o desconto automático.   |
// ==========================================================

const CUPONS = {
    BEMVINDO10: 0.10,
    DIY15: 0.15
}

const FRETE_PADRAO = 24.90
const FRETE_GRATIS_ACIMA_DE = 250.00
const DESCONTO_QTD_MINIMA = 3
const DESCONTO_QTD_PERCENTUAL = 0.05
const DESCONTO_VALOR_MINIMO = 300.00
const DESCONTO_VALOR_PERCENTUAL = 0.10

// Calcula o desconto total (automático + cupom) sobre o subtotal.
// Retorna { desconto, cupom, regras } igual o backend espera no checkout.
function calcularDesconto(subtotal, quantidadeTotal, cupom) {

    let percentualAutomatico = 0
    const regras = []

    // regra por quantidade de itens
    if (quantidadeTotal >= DESCONTO_QTD_MINIMA) {
        percentualAutomatico = DESCONTO_QTD_PERCENTUAL
        regras.push('5% por levar 3 itens ou mais')
    }

    // regra por valor: vale a maior, então zera a anterior
    if (subtotal >= DESCONTO_VALOR_MINIMO && DESCONTO_VALOR_PERCENTUAL > percentualAutomatico) {
        percentualAutomatico = DESCONTO_VALOR_PERCENTUAL
        regras.length = 0
        regras.push('10% em compras acima de R$ 300,00')
    }

    // cupom (soma com o automático)
    let percentualCupom = 0
    let cupomValido = null

    if (cupom) {
        const chave = String(cupom).trim().toUpperCase()

        if (CUPONS[chave]) {
            percentualCupom = CUPONS[chave]
            cupomValido = chave
            regras.push(`Cupom ${chave} (${percentualCupom * 100}%)`)
        } else {
            throw new Error('Cupom inválido ou expirado')
        }
    }

    const desconto = arredondar(subtotal * (percentualAutomatico + percentualCupom))

    return {
        desconto,
        cupom: cupomValido,
        regras
    }
}

// Frete fixo, grátis a partir de um valor de subtotal (já com desconto).
function calcularFrete(subtotalComDesconto) {
    return Number(subtotalComDesconto) >= FRETE_GRATIS_ACIMA_DE ? 0 : FRETE_PADRAO
}

module.exports = {
    calcularDesconto,
    calcularFrete,
    CUPONS,
    FRETE_PADRAO,
    FRETE_GRATIS_ACIMA_DE
}
