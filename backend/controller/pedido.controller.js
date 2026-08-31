const {
    createPedido,
    listPedidos,
    listMeusPedidos,
    findPedidoById,
    searchPedidos,
    updatePedido,
    patchPedido,
    deletePedido
} = require('../service/pedido.service')

// POST /pedidos - finalização do pedido (checkout)
async function create(req, res) {
    try {
        const resultado = await createPedido(req.body, req.usuario)

        return res.status(201).json({
            message: 'pedido realizado com sucesso',
            ...resultado
        })
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

// GET /pedidos - todos os pedidos da loja (somente ADMIN)
async function list(req, res) {
    try {
        const pedidos = await listPedidos(req.query)

        return res.status(200).json(pedidos)
    } catch (err) {
        return res.status(500).json({
            error: err.message
        })
    }
}

// GET /pedidos/meus-pedidos - histórico de compras do cliente logado
async function meusPedidos(req, res) {
    try {
        const pedidos = await listMeusPedidos(req.usuario.id)

        return res.status(200).json(pedidos)
    } catch (err) {
        return res.status(500).json({
            error: err.message
        })
    }
}

async function search(req, res) {
    const termo = req.query.s

    try {
        const pedidos = await searchPedidos(termo)

        return res.status(200).json(pedidos)
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

async function findById(req, res) {
    const { id } = req.params

    try {
        const pedido = await findPedidoById(id, req.usuario)

        return res.status(200).json(pedido)
    } catch (err) {
        return res.status(404).json({
            error: err.message
        })
    }
}

async function update(req, res) {
    const { id } = req.params

    try {
        const pedido = await updatePedido(id, req.body)

        return res.status(200).json({
            message: 'pedido atualizado com sucesso',
            pedido
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
        const pedido = await patchPedido(id, req.body)

        return res.status(200).json({
            message: 'pedido atualizado parcialmente com sucesso',
            pedido
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
        await deletePedido(id)

        return res.status(200).json({
            message: 'pedido cancelado e estoque devolvido com sucesso'
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
    meusPedidos,
    search,
    findById,
    update,
    patch,
    delet
}
