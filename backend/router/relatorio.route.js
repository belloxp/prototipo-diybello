const express = require('express')
const router = express.Router()

const { vendas, estoque } = require('../controller/relatorio.controller')

// Middlewares
const authMiddleware = require('../middleware/auth.middleware')
const { isAdminMiddleware } = require('../middleware/isAdmin.middleware')

// ---------------- ROTAS PRIVADAS (somente ADMIN) ----------------

// GET /relatorios/vendas - dados do gráfico de vendas por categoria e faturamento mensal
router.get('/vendas', authMiddleware, isAdminMiddleware, vendas)

// GET /relatorios/estoque - dados do gráfico de saldo de estoque
router.get('/estoque', authMiddleware, isAdminMiddleware, estoque)

module.exports = router
