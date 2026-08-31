const {
    createCategoria,
    listCategorias,
    listCategoriasAdmin,
    findCategoriaById,
    searchCategorias,
    updateCategoria,
    patchCategoria,
    deleteCategoria
} = require('../service/categoria.service')

async function create(req, res) {
    try {
        const categoria = await createCategoria(req.body)

        return res.status(201).json({
            message: 'categoria cadastrada com sucesso',
            categoria
        })
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

async function list(req, res) {
    try {
        const categorias = await listCategorias()

        return res.status(200).json(categorias)
    } catch (err) {
        return res.status(500).json({
            error: err.message
        })
    }
}

async function listAdmin(req, res) {
    try {
        const categorias = await listCategoriasAdmin()

        return res.status(200).json(categorias)
    } catch (err) {
        return res.status(500).json({
            error: err.message
        })
    }
}

async function search(req, res) {
    const termo = req.query.s

    try {
        const categorias = await searchCategorias(termo)

        return res.status(200).json(categorias)
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

async function findById(req, res) {
    const { id } = req.params

    try {
        const categoria = await findCategoriaById(id)

        return res.status(200).json(categoria)
    } catch (err) {
        return res.status(404).json({
            error: err.message
        })
    }
}

async function update(req, res) {
    const { id } = req.params

    try {
        const categoria = await updateCategoria(id, req.body)

        return res.status(200).json({
            message: 'categoria atualizada com sucesso',
            categoria
        })
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

async function patch(req, res) {
    const { id } = req.params

    try {
        const categoria = await patchCategoria(id, req.body)

        return res.status(200).json({
            message: 'categoria atualizada parcialmente com sucesso',
            categoria
        })
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

async function delet(req, res) {
    const { id } = req.params

    try {
        await deleteCategoria(id)

        return res.status(200).json({
            message: 'categoria apagada com sucesso'
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
    listAdmin,
    search,
    findById,
    update,
    patch,
    delet
}
