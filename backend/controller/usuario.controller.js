const {
    createUsuario,
    listUsuarios,
    findUsuarioById,
    searchUsuarios,
    updateUsuario,
    patchUsuario,
    deleteUsuario
} = require('../service/usuario.service')

// POST /usuarios - ROTA PÚBLICA (cadastro de novos clientes)
async function create(req, res) {
    try {
        const usuario = await createUsuario(req.body)

        return res.status(201).json({
            message: 'usuário cadastrado com sucesso',
            usuario
        })
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

// GET /usuarios - lista geral (somente ADMIN)
async function list(req, res) {
    try {
        const usuarios = await listUsuarios()

        return res.status(200).json(usuarios)
    } catch (err) {
        return res.status(500).json({
            error: err.message
        })
    }
}

// GET /usuarios/perfil - dados da conta do usuário logado
async function perfil(req, res) {
    try {
        const usuario = await findUsuarioById(req.usuario.id)

        return res.status(200).json(usuario)
    } catch (err) {
        return res.status(404).json({
            error: err.message
        })
    }
}

// GET /usuarios/buscar?s=termo - consulta por código, nome, e-mail ou CPF
async function search(req, res) {
    const termo = req.query.s

    try {
        const usuarios = await searchUsuarios(termo)

        return res.status(200).json(usuarios)
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

// GET /usuarios/:id - consulta por código
async function findById(req, res) {
    const { id } = req.params

    try {
        const usuario = await findUsuarioById(id)

        return res.status(200).json(usuario)
    } catch (err) {
        return res.status(404).json({
            error: err.message
        })
    }
}

// PUT /usuarios/:id - atualização completa
async function update(req, res) {
    const { id } = req.params

    try {
        const usuario = await updateUsuario(id, req.body, req.usuario)

        return res.status(200).json({
            message: 'usuário atualizado com sucesso',
            usuario
        })
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

// PATCH /usuarios/:id - atualização parcial
async function patch(req, res) {
    const { id } = req.params

    try {
        const usuario = await patchUsuario(id, req.body, req.usuario)

        return res.status(200).json({
            message: 'usuário atualizado parcialmente com sucesso',
            usuario
        })
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

// DELETE /usuarios/:id
async function delet(req, res) {
    const { id } = req.params

    try {
        await deleteUsuario(id, req.usuario)

        return res.status(200).json({
            message: 'usuário apagado com sucesso'
        })
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

module.exports = {
    create,
    list,
    perfil,
    search,
    findById,
    update,
    patch,
    delet
}
