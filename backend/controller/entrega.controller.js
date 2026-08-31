const {
    createEntrega,
    listEntregas,
    listMinhasEntregas,
    findEntregaById,
    searchEntregas,
    updateEntrega,
    patchEntrega,
    deleteEntrega
} = require('../service/entrega.service')

async function create(req, res) {
    try {
        const entrega = await createEntrega(req.body)

        return res.status(201).json({
            message: 'entrega registrada com sucesso',
            entrega
        })
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

async function list(req, res) {
    try {
        const entregas = await listEntregas(req.query)

        return res.status(200).json(entregas)
    } catch (err) {
        return res.status(500).json({
            error: err.message
        })
    }
}

async function minhasEntregas(req, res) {
    try {
        const entregas = await listMinhasEntregas(req.usuario.id)

        return res.status(200).json(entregas)
    } catch (err) {
        return res.status(500).json({
            error: err.message
        })
    }
}

async function search(req, res) {
    const termo = req.query.s

    try {
        const entregas = await searchEntregas(termo)

        return res.status(200).json(entregas)
    } catch (err) {
        return res.status(400).json({
            error: err.message
        })
    }
}

async function findById(req, res) {
    const { id } = req.params

    try {
        const entrega = await findEntregaById(id, req.usuario)

        return res.status(200).json(entrega)
    } catch (err) {
        return res.status(404).json({
            error: err.message
        })
    }
}

async function update(req, res) {
    const { id } = req.params

    try {
        const entrega = await updateEntrega(id, req.body)

        return res.status(200).json({
            message: 'entrega atualizada com sucesso',
            entrega
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
        const entrega = await patchEntrega(id, req.body)

        return res.status(200).json({
            message: 'entrega atualizada parcialmente com sucesso',
            entrega
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
        await deleteEntrega(id)

        return res.status(200).json({
            message: 'entrega apagada com sucesso'
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
    minhasEntregas,
    search,
    findById,
    update,
    patch,
    delet
}
