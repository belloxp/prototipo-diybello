const express = require('express')
const router = express.Router()

const {
    create,
    list,
    perfil,
    search,
    findById,
    update,
    patch,
    delet
} = require('../controller/usuario.controller')

// Middlewares
const authMiddleware = require('../middleware/auth.middleware')
const { isAdminMiddleware } = require('../middleware/isAdmin.middleware')

// ---------------- ROTAS PÚBLICAS ----------------
// POST /usuarios - cadastro de novos clientes
router.post('/', create)

// ---------------- ROTAS PRIVADAS ----------------
// GET /usuarios/perfil - dados da conta do usuário logado
router.get('/perfil', authMiddleware, perfil)

// GET /usuarios/buscar?s=termo - consulta por código/nome (somente ADMIN)
router.get('/buscar', authMiddleware, isAdminMiddleware, search)

// GET /usuarios - listagem geral (somente ADMIN)
router.get('/', authMiddleware, isAdminMiddleware, list)

// GET /usuarios/:id - consulta por código (somente ADMIN)
router.get('/:id', authMiddleware, isAdminMiddleware, findById)

// PUT /usuarios/:id - atualização completa do cadastro
router.put('/:id', authMiddleware, update)

// PATCH /usuarios/:id - atualização parcial do cadastro
router.patch('/:id', authMiddleware, patch)

// DELETE /usuarios/:id - apaga a conta
router.delete('/:id', authMiddleware, delet)

module.exports = router
