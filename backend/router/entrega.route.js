const express = require('express')
const router = express.Router()

const {
    create,
    list,
    minhasEntregas,
    search,
    findById,
    update,
    patch,
    delet
} = require('../controller/entrega.controller')

// Middlewares
const authMiddleware = require('../middleware/auth.middleware')
const { isAdminMiddleware } = require('../middleware/isAdmin.middleware')

// ---------------- ROTAS PRIVADAS (todas exigem login) ----------------

// GET /entregas/minhas-entregas - rastreamento das entregas do cliente logado
router.get('/minhas-entregas', authMiddleware, minhasEntregas)

// GET /entregas/buscar?s=termo - consulta por rastreio ou cidade (somente ADMIN)
router.get('/buscar', authMiddleware, isAdminMiddleware, search)

// GET /entregas - painel de logística (somente ADMIN)
router.get('/', authMiddleware, isAdminMiddleware, list)

// GET /entregas/:id - detalhe da entrega (dono do pedido ou ADMIN)
router.get('/:id', authMiddleware, findById)

// POST /entregas - registrar entrega manualmente (somente ADMIN)
router.post('/', authMiddleware, isAdminMiddleware, create)

// PUT /entregas/:id - atualização completa (somente ADMIN)
router.put('/:id', authMiddleware, isAdminMiddleware, update)

// PATCH /entregas/:id - mudar o status do rastreamento (somente ADMIN)
router.patch('/:id', authMiddleware, isAdminMiddleware, patch)

// DELETE /entregas/:id - apagar a entrega (somente ADMIN)
router.delete('/:id', authMiddleware, isAdminMiddleware, delet)

module.exports = router
