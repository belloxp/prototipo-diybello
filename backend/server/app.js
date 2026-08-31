const express = require('express')
const cors = require('cors')

const app = express()

// ------------------ Middlewares globais ------------------
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())

// Garante que os relacionamentos sejam carregados antes das rotas
require('../model/rel')

// ------------------ Rotas ------------------
const authRouter = require('../router/auth.route')
const usuarioRouter = require('../router/usuario.route')
const categoriaRouter = require('../router/categoria.route')
const produtoRouter = require('../router/produto.route')
const estoqueRouter = require('../router/estoque.route')
const pedidoRouter = require('../router/pedido.route')
const entregaRouter = require('../router/entrega.route')
const relatorioRouter = require('../router/relatorio.route')

app.use('/', authRouter)
app.use('/usuarios', usuarioRouter)
app.use('/categorias', categoriaRouter)
app.use('/produtos', produtoRouter)
app.use('/estoque', estoqueRouter)
app.use('/pedidos', pedidoRouter)
app.use('/entregas', entregaRouter)
app.use('/relatorios', relatorioRouter)

// ------------------ Rota raiz ------------------
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'API DIYBELLO no ar - e-commerce de kits e caixas para hobbies criativos',
        versao: '1.0.0',
        rotas_publicas: [
            'POST /login',
            'POST /usuarios',
            'GET /produtos',
            'GET /produtos/:id',
            'GET /produtos/buscar?s=termo',
            'GET /categorias'
        ],
        rotas_privadas: [
            'GET /usuarios/perfil',
            'PUT /usuarios/:id',
            'POST /pedidos',
            'GET /pedidos/meus-pedidos',
            'POST /produtos',
            'POST /estoque',
            'GET /relatorios/vendas',
            'GET /relatorios/estoque'
        ]
    })
})

// ------------------ Rota não encontrada ------------------
app.use((req, res) => {
    res.status(404).json({
        error: `Rota ${req.method} ${req.originalUrl} não encontrada`
    })
})

module.exports = app
