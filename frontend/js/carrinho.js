// ==========================================================
// |  DIYBELLO - CARRINHO DE COMPRAS (LocalStorage)         |
// |  O cliente pode montar o carrinho sem estar logado.    |
// |  O login só é exigido na hora de finalizar o pedido.   |
// ==========================================================

// ---------------- REGRAS DE DESCONTO (espelho do backend) ----------------
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

function lerCarrinho() {
    const dados = localStorage.getItem(CHAVE_CARRINHO)

    if (!dados) return []

    // Se o LocalStorage estiver corrompido, começa um carrinho novo em vez de quebrar a tela
    try {
        const itens = JSON.parse(dados)
        return Array.isArray(itens) ? itens : []
    } catch (err) {
        console.error('Carrinho corrompido no LocalStorage, limpando...', err)
        localStorage.removeItem(CHAVE_CARRINHO)
        return []
    }
}

function gravarCarrinho(itens) {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens))
    atualizarContadorCarrinho()
}

function limparCarrinho() {
    localStorage.removeItem(CHAVE_CARRINHO)
    atualizarContadorCarrinho()
}

function quantidadeTotalCarrinho() {
    return lerCarrinho().reduce((soma, item) => soma + item.quantidade, 0)
}

function atualizarContadorCarrinho() {
    const contador = document.getElementById('contador_carrinho')
    if (contador) {
        contador.textContent = quantidadeTotalCarrinho()
    }
}

// ==========================================================
// |  CONTROLE DE ESTOQUE                                   |
// |  Só adiciona ao carrinho se houver saldo disponível.   |
// |  Estoque zerado bloqueia a ação com um alerta.         |
// ==========================================================
function adicionarAoCarrinho(produto, quantidade = 1) {

    if (produto.estoque_atual <= 0) {
        alert(`O produto "${produto.nome}" está ESGOTADO no momento. Não é possível adicionar ao carrinho.`)
        return false
    }

    const itens = lerCarrinho()
    const existente = itens.find(item => item.produto_id === produto.id)
    const quantidadeAtual = existente ? existente.quantidade : 0
    const quantidadeNova = quantidadeAtual + Number(quantidade)

    if (quantidadeNova > produto.estoque_atual) {
        alert(`Estoque insuficiente para "${produto.nome}".\nDisponível: ${produto.estoque_atual} unidade(s).\nVocê já tem ${quantidadeAtual} no carrinho.`)
        return false
    }

    if (existente) {
        existente.quantidade = quantidadeNova
    } else {
        itens.push({
            produto_id: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            imagem_url: produto.imagem_url,
            estoque_atual: produto.estoque_atual,
            quantidade: Number(quantidade)
        })
    }

    gravarCarrinho(itens)
    return true
}

function alterarQuantidade(produto_id, novaQuantidade) {
    const itens = lerCarrinho()
    const item = itens.find(i => i.produto_id === produto_id)

    if (!item) return

    if (novaQuantidade <= 0) {
        return removerDoCarrinho(produto_id)
    }

    if (novaQuantidade > item.estoque_atual) {
        alert(`Estoque insuficiente para "${item.nome}". Disponível: ${item.estoque_atual} unidade(s).`)
        return
    }

    item.quantidade = novaQuantidade
    gravarCarrinho(itens)
}

function removerDoCarrinho(produto_id) {
    const itens = lerCarrinho().filter(item => item.produto_id !== produto_id)
    gravarCarrinho(itens)
}

// ==========================================================
// |  CÁLCULO DOS TOTAIS COM AS REGRAS DE DESCONTO          |
// |  1. Cupom BEMVINDO10 = 10% | Cupom DIY15 = 15%         |
// |  2. 3 itens ou mais = 5% (não acumula com a regra 3)   |
// |  3. Acima de R$ 300 = 10% (vale a maior)               |
// |  4. Frete R$ 24,90 - grátis acima de R$ 250            |
// ==========================================================
function calcularTotaisCarrinho(cupom) {

    const itens = lerCarrinho()

    const subtotal = itens.reduce((soma, item) => soma + (item.preco * item.quantidade), 0)
    const quantidadeTotal = itens.reduce((soma, item) => soma + item.quantidade, 0)

    let percentualAutomatico = 0
    const regras = []

    if (quantidadeTotal >= DESCONTO_QTD_MINIMA) {
        percentualAutomatico = DESCONTO_QTD_PERCENTUAL
        regras.push('5% por levar 3 itens ou mais')
    }

    if (subtotal >= DESCONTO_VALOR_MINIMO && DESCONTO_VALOR_PERCENTUAL > percentualAutomatico) {
        percentualAutomatico = DESCONTO_VALOR_PERCENTUAL
        regras.length = 0
        regras.push('10% em compras acima de R$ 300,00')
    }

    let percentualCupom = 0
    let cupomValido = null
    let erroCupom = null

    if (cupom) {
        const chave = String(cupom).trim().toUpperCase()

        if (CUPONS[chave]) {
            percentualCupom = CUPONS[chave]
            cupomValido = chave
            regras.push(`Cupom ${chave} (${percentualCupom * 100}%)`)
        } else {
            erroCupom = 'Cupom inválido ou expirado'
        }
    }

    const desconto = subtotal * (percentualAutomatico + percentualCupom)
    const subtotalComDesconto = subtotal - desconto
    const frete = subtotalComDesconto >= FRETE_GRATIS_ACIMA_DE ? 0 : (itens.length > 0 ? FRETE_PADRAO : 0)
    const total = subtotalComDesconto + frete

    return {
        itens,
        quantidadeTotal,
        subtotal,
        desconto,
        frete,
        total,
        cupom: cupomValido,
        erroCupom,
        regras
    }
}
