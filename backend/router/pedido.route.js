const express = require('express')
const router = express.Router()

const {
    create,
    list,
    meusPedidos,
    search,
    findById,
    update,
    patch,
    delet
} = require('../controller/pedido.controller')

// Middlewares
const authMiddleware = require('../middleware/auth.middleware')
const { isAdminMiddleware } = require('../middleware/isAdmin.middleware')

// ---------------- ROTAS PRIVADAS (todas exigem login) ----------------

// GET /pedidos/meus-pedidos - histórico de compras do cliente logado
router.get('/meus-pedidos', authMiddleware, meusPedidos)

// GET /pedidos/buscar?s=termo - consulta por código ou cliente (somente ADMIN)
router.get('/buscar', authMiddleware, isAdminMiddleware, search)

// GET /pedidos - todos os pedidos da loja (somente ADMIN)
router.get('/', authMiddleware, isAdminMiddleware, list)

// GET /pedidos/:id - detalhe do pedido (dono do pedido ou ADMIN)
router.get('/:id', authMiddleware, findById)

// POST /pedidos - checkout: converte o carrinho em venda e deduz o estoque
router.post('/', authMiddleware, create)

// PUT /pedidos/:id - atualização completa do status (somente ADMIN)
router.put('/:id', authMiddleware, isAdminMiddleware, update)

// PATCH /pedidos/:id - atualização parcial do status (somente ADMIN)
router.patch('/:id', authMiddleware, isAdminMiddleware, patch)

// DELETE /pedidos/:id - cancelar o pedido e estornar o estoque (somente ADMIN)
router.delete('/:id', authMiddleware, isAdminMiddleware, delet)

module.exports = router
