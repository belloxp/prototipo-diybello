const {
    createProduto,
    listProdutos,
    listProdutosAdmin,
    findProdutoById,
    searchProdutos,
    updateProduto,
    patchProduto,
    deleteProduto
} = require('../service/produto.service')

async function create(req, res) {
    try {
        const produto = await createProduto(req.body)

        return res.status(201).json({
            message: 'produto cadastrado com sucesso',
            produto
        })
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

// GET /produtos?categoria_id=1&nivel=INICIANTE&tempo=rapido&nome=box
async function list(req, res) {
    try {
        const produtos = await listProdutos(req.query)

        return res.status(200).json(produtos)
    } catch (err) {
        return res.status(500).json({
            error: err.message
        })
    }
}

async function listAdmin(req, res) {
    try {
        const produtos = await listProdutosAdmin()

        return res.status(200).json(produtos)
    } catch (err) {
        return res.status(500).json({
            error: err.message
        })
    }
}

async function search(req, res) {
    const termo = req.query.s

    try {
        const produtos = await searchProdutos(termo)

        return res.status(200).json(produtos)
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

async function findById(req, res) {
    const { id } = req.params

    try {
        const produto = await findProdutoById(id)

        return res.status(200).json(produto)
    } catch (err) {
        return res.status(404).json({
            error: err.message
        })
    }
}

async function update(req, res) {
    const { id } = req.params

    try {
        const produto = await updateProduto(id, req.body)

        return res.status(200).json({
            message: 'produto atualizado com sucesso',
            produto
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
        const produto = await patchProduto(id, req.body)

        return res.status(200).json({
            message: 'produto atualizado parcialmente com sucesso',
            produto
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
        const resultado = await deleteProduto(id)

        return res.status(200).json({
            message: resultado.message
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
