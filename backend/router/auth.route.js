const express = require('express')
const router = express.Router()

const authController = require('../controller/auth.controller')

// ROTA PÚBLICA - autenticação e geração do token JWT
router.post('/login', authController.login)

module.exports = router
