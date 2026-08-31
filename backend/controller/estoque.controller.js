const {
    createEstoque,
    listEstoque,
    findEstoqueById,
    searchEstoque,
    updateEstoque,
    patchEstoque,
    deleteEstoque
} = require('../service/estoque.service')

async function create(req, res) {
    try {
        const movimento = await createEstoque(req.body)

        return res.status(201).json({
            message: 'movimentação de estoque registrada com sucesso',
            estoque: movimento
        })
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

async function list(req, res) {
    try {
        const movimentos = await listEstoque(req.query)

        return res.status(200).json(movimentos)
    } catch (err) {
        return res.status(500).json({
            error: err.message
        })
    }
}

async function search(req, res) {
    const termo = req.query.s

    try {
        const movimentos = await searchEstoque(termo)

        return res.status(200).json(movimentos)
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

async function findById(req, res) {
    const { id } = req.params

    try {
        const movimento = await findEstoqueById(id)

        return res.status(200).json(movimento)
    } catch (err) {
        return res.status(404).json({
            error: err.message
        })
    }
}

async function update(req, res) {
    const { id } = req.params

    try {
        const movimento = await updateEstoque(id, req.body)

        return res.status(200).json({
            message: 'movimentação de estoque atualizada com sucesso',
            estoque: movimento
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
        const movimento = await patchEstoque(id, req.body)

        return res.status(200).json({
            message: 'movimentação de estoque atualizada parcialmente com sucesso',
            estoque: movimento
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
        await deleteEstoque(id)

        return res.status(200).json({
            message: 'movimentação de estoque estornada e apagada com sucesso'
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
    search,
    findById,
    update,
    patch,
    delet
}
