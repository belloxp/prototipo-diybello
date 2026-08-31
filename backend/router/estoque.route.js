const express = require('express')
const router = express.Router()

const {
    create,
    list,
    search,
    findById,
    update,
    patch,
    delet
} = require('../controller/estoque.controller')

// Middlewares
const authMiddleware = require('../middleware/auth.middleware')
const { isAdminMiddleware } = require('../middleware/isAdmin.middleware')

// ---------------- ROTAS PRIVADAS (todas somente ADMIN) ----------------

// GET /estoque/buscar?s=termo - consulta as movimentações por código ou nome do produto
router.get('/buscar', authMiddleware, isAdminMiddleware, search)

// GET /estoque - histórico de movimentações
router.get('/', authMiddleware, isAdminMiddleware, list)

// GET /estoque/:id - consulta de uma movimentação
router.get('/:id', authMiddleware, isAdminMiddleware, findById)

// POST /estoque - dar entrada ou saída no estoque
router.post('/', authMiddleware, isAdminMiddleware, create)

// PUT /estoque/:id - corrigir a movimentação inteira
router.put('/:id', authMiddleware, isAdminMiddleware, update)

// PATCH /estoque/:id - ajustar apenas motivo e data
router.patch('/:id', authMiddleware, isAdminMiddleware, patch)

// DELETE /estoque/:id - estornar a movimentação
router.delete('/:id', authMiddleware, isAdminMiddleware, delet)

module.exports = router
