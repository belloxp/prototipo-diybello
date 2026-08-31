const {
    relatorioVendas,
    relatorioEstoque
} = require('../service/relatorio.service')

// GET /relatorios/vendas - alimenta os gráficos de vendas do painel admin
async function vendas(req, res) {
    try {
        const relatorio = await relatorioVendas()

        return res.status(200).json(relatorio)
    } catch (err) {
        return res.status(500).json({
            error: err.message
        })
    }
}

// GET /relatorios/estoque - alimenta o gráfico de estoque do painel admin
async function estoque(req, res) {
    try {
        const relatorio = await relatorioEstoque()

        return res.status(200).json(relatorio)
    } catch (err) {
        return res.status(500).json({
            error: err.message
        })
    }
}

module.exports = { vendas, estoque }
