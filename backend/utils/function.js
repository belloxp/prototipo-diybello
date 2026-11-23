// ==========================================================
// |  FUNÇÕES UTILITÁRIAS GERAIS                            |
// |  slug, arredondamento monetário, código de rastreio    |
// |  e cálculo de previsão de entrega.                     |
// ==========================================================

// Transforma "Box Cores & Brisa" em "box-cores-brisa".
function gerarSlug(texto) {
    return String(texto || '')
        .normalize('NFD')                     // separa acentos das letras
        .replace(/\p{Diacritic}/gu, '')       // remove os acentos
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')          // troca não alfanuméricos (inclui "&") por hífen
        .replace(/-{2,}/g, '-')               // colapsa hífens repetidos
        .replace(/^-+|-+$/g, '')              // tira hífens das pontas
}

// Arredonda valores monetários para 2 casas decimais sem erro de ponto flutuante.
function arredondar(valor) {
    return Math.round((Number(valor) + Number.EPSILON) * 100) / 100
}

// Gera um código de rastreio no padrão DIY + pedido + sufixo aleatório.
function gerarCodigoRastreio(pedido_id = 0) {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let sufixo = ''
    for (let i = 0; i < 2; i++) {
        sufixo += letras[Math.floor(Math.random() * letras.length)]
    }
    const numero = String(pedido_id).padStart(6, '0')
    return `DIY${numero}${sufixo}BR`
}

// Devolve a data prevista de entrega, somando "dias" à data atual.
function calcularPrevisaoEntrega(dias = 7) {
    const data = new Date()
    data.setDate(data.getDate() + Number(dias))
    return data
}

module.exports = {
    gerarSlug,
    arredondar,
    gerarCodigoRastreio,
    calcularPrevisaoEntrega
}
