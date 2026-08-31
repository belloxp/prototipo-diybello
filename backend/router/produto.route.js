const express = require('express')
const router = express.Router()

const {
    create,
    list,
    listAdmin,
    search,
    findById,
    update,
    patch,
    delet
} = require('../controller/produto.controller')

// Middlewares
const authMiddleware = require('../middleware/auth.middleware')
const { isAdminMiddleware } = require('../middleware/isAdmin.middleware')

// ---------------- ROTAS PÚBLICAS ----------------
// GET /produtos - listagem geral da vitrine (aceita filtros por query)
router.get('/', list)

// GET /produtos/buscar?s=termo - consulta por código ou nome
router.get('/buscar', search)

// ---------------- ROTAS PRIVADAS ----------------
// GET /produtos/admin - listagem completa da gestão de catálogo
router.get('/admin', authMiddleware, isAdminMiddleware, listAdmin)

// GET /produtos/:id - consulta de um produto (público)
router.get('/:id', findById)

// POST /produtos - cadastro de novos kits (somente ADMIN)
router.post('/', authMiddleware, isAdminMiddleware, create)

// PUT /produtos/:id - atualização completa (somente ADMIN)
router.put('/:id', authMiddleware, isAdminMiddleware, update)

// PATCH /produtos/:id - atualização parcial, Ex: só o preço (somente ADMIN)
router.patch('/:id', authMiddleware, isAdminMiddleware, patch)

// DELETE /produtos/:id - apagar do catálogo (somente ADMIN)
router.delete('/:id', authMiddleware, isAdminMiddleware, delet)

module.exports = router
