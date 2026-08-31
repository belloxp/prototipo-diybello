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
} = require('../controller/categoria.controller')

// Middlewares
const authMiddleware = require('../middleware/auth.middleware')
const { isAdminMiddleware } = require('../middleware/isAdmin.middleware')

// ---------------- ROTAS PÚBLICAS ----------------
// GET /categorias - listagem das categorias de hobby
router.get('/', list)

// GET /categorias/buscar?s=termo - consulta por nome
router.get('/buscar', search)

// ---------------- ROTAS PRIVADAS ----------------
// GET /categorias/admin - lista inclusive as inativas
router.get('/admin', authMiddleware, isAdminMiddleware, listAdmin)

// GET /categorias/:id - consulta por código (público)
router.get('/:id', findById)

// POST /categorias - cadastro (somente ADMIN)
router.post('/', authMiddleware, isAdminMiddleware, create)

// PUT /categorias/:id - atualização completa (somente ADMIN)
router.put('/:id', authMiddleware, isAdminMiddleware, update)

// PATCH /categorias/:id - atualização parcial (somente ADMIN)
router.patch('/:id', authMiddleware, isAdminMiddleware, patch)

// DELETE /categorias/:id - apagar (somente ADMIN)
router.delete('/:id', authMiddleware, isAdminMiddleware, delet)

module.exports = router
