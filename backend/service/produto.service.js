const Produto = require('../model/Produto')
const Categoria = require('../model/Categoria')
const ItemPedido = require('../model/ItemPedido')
const Estoque = require('../model/Estoque')
const { Op } = require('sequelize')
const { gerarSlug } = require('../utils/function')

// Sempre traz a categoria junto para o card do frontend mostrar o nome dela
const INCLUDE_CATEGORIA = [{
    model: Categoria,
    as: 'categoriaProduto',
    attributes: ['id', 'nome', 'slug']
}]

async function createProduto(dados) {

    const {
        nome, descricao, preco, tipo, nivel,
        tempo_minutos, estoque_atual, imagem_url, categoria_id
    } = dados

    if (!nome || !preco || !imagem_url || !categoria_id) {
        throw new Error('Nome, preço, imagem e categoria são obrigatórios')
    }

    if (Number(preco) <= 0) {
        throw new Error('O preço deve ser maior que zero')
    }

    // Verifica se a categoria informada existe antes de criar o produto
    const categoria = await Categoria.findByPk(categoria_id)

    if (!categoria) {
        throw new Error('Categoria não encontrada para vincular ao produto')
    }

    const slug = gerarSlug(nome)

    // Verifica a existência prévia do produto pelo slug
    const produtoExistente = await Produto.findOne({ where: { slug } })

    if (produtoExistente) {
        throw new Error('Já existe um produto cadastrado com esse nome')
    }

    const novoProduto = await Produto.create({
        nome,
        descricao,
        preco: Number(preco),
        slug,
        tipo: tipo || 'CAIXA',
        nivel: nivel || 'INICIANTE',
        tempo_minutos: tempo_minutos || 45,
        estoque_atual: Number(estoque_atual) || 0,
        imagem_url,
        status: true,
        categoria_id
    })

    // Se o produto já nasce com saldo, registra a movimentação inicial de entrada
    if (Number(estoque_atual) > 0) {
        await Estoque.create({
            produto_id: novoProduto.id,
            tipo: 'ENTRADA',
            quantidade: Number(estoque_atual),
            saldo_anterior: 0,
            saldo_atual: Number(estoque_atual),
            motivo: 'Carga inicial do cadastro do produto',
            data: new Date()
        })
    }

    return await Produto.findByPk(novoProduto.id, { include: INCLUDE_CATEGORIA })
}

// GET /produtos - vitrine pública com filtros de categoria, nível e tempo
async function listProdutos(filtros = {}) {

    const where = { status: true }

    if (filtros.categoria_id) {
        where.categoria_id = Number(filtros.categoria_id)
    }

    if (filtros.tipo) {
        where.tipo = String(filtros.tipo).toUpperCase()
    }

    if (filtros.nivel) {
        where.nivel = String(filtros.nivel).toUpperCase()
    }

    // Filtro por tempo: rapido = até 45 min | fimdesemana = acima de 45 min
    if (filtros.tempo === 'rapido') {
        where.tempo_minutos = { [Op.lte]: 45 }
    }

    if (filtros.tempo === 'fimdesemana') {
        where.tempo_minutos = { [Op.gt]: 45 }
    }

    if (filtros.nome) {
        where.nome = { [Op.like]: `%${filtros.nome}%` }
    }

    return await Produto.findAll({
        where,
        include: INCLUDE_CATEGORIA,
        order: [['id', 'ASC']]
    })
}

// GET /produtos/admin - lista tudo, inclusive os produtos inativos
async function listProdutosAdmin() {
    return await Produto.findAll({
        include: INCLUDE_CATEGORIA,
        order: [['id', 'ASC']]
    })
}

async function findProdutoById(id) {
    const produto = await Produto.findByPk(id, { include: INCLUDE_CATEGORIA })

    if (!produto) {
        throw new Error('Produto não encontrado')
    }

    return produto
}

// GET /produtos/buscar?s=termo - consulta por CÓDIGO ou por NOME
async function searchProdutos(busca) {

    if (!busca || typeof busca !== 'string') {
        throw new Error('Termo de busca ausente ou inválido')
    }

    const termo = busca.trim()

    // Se o usuário digitou só números, ele está procurando pelo CÓDIGO.
    // Procurar o número dentro do nome/descrição traria quase todos os produtos,
    // porque praticamente toda descrição tem algum número.
    const filtro = /^\d+$/.test(termo)
        ? { id: Number(termo) }
        : {
            [Op.or]: [
                { nome: { [Op.like]: `%${termo}%` } },
                { slug: { [Op.like]: `%${termo}%` } }
            ]
        }

    return await Produto.findAll({
        where: { status: true, ...filtro },
        include: INCLUDE_CATEGORIA,
        order: [['id', 'ASC']]
    })
}

// PUT /produtos/:id - atualização completa
async function updateProduto(id, dados) {

    const produto = await Produto.findByPk(id)

    if (!produto) {
        throw new Error('Produto não encontrado')
    }

    const {
        nome, descricao, preco, tipo, nivel,
        tempo_minutos, imagem_url, categoria_id, status
    } = dados

    if (!nome || !preco || !imagem_url || !categoria_id) {
        throw new Error('No PUT nome, preço, imagem e categoria são obrigatórios')
    }

    if (Number(preco) <= 0) {
        throw new Error('O preço deve ser maior que zero')
    }

    const categoria = await Categoria.findByPk(categoria_id)

    if (!categoria) {
        throw new Error('Categoria não encontrada para vincular ao produto')
    }

    const slug = gerarSlug(nome)

    const slugExistente = await Produto.findOne({
        where: { slug, id: { [Op.ne]: id } }
    })

    if (slugExistente) {
        throw new Error('Já existe outro produto cadastrado com esse nome')
    }

    await produto.update({
        nome,
        descricao,
        preco: Number(preco),
        slug,
        tipo: tipo || 'CAIXA',
        nivel: nivel || 'INICIANTE',
        tempo_minutos: tempo_minutos || 45,
        imagem_url,
        categoria_id,
        status: status !== undefined ? status : true
    })

    return await Produto.findByPk(id, { include: INCLUDE_CATEGORIA })
}

// PATCH /produtos/:id - atualização parcial (Ex: só o preço)
async function patchProduto(id, dados) {

    const produto = await Produto.findByPk(id)

    if (!produto) {
        throw new Error('Produto não encontrado')
    }

    const permitidos = {}

    if (dados.nome) {
        const slug = gerarSlug(dados.nome)
        const slugExistente = await Produto.findOne({
            where: { slug, id: { [Op.ne]: id } }
        })
        if (slugExistente) {
            throw new Error('Já existe outro produto cadastrado com esse nome')
        }
        permitidos.nome = dados.nome
        permitidos.slug = slug
    }

    if (dados.preco !== undefined) {
        if (Number(dados.preco) <= 0) {
            throw new Error('O preço deve ser maior que zero')
        }
        permitidos.preco = Number(dados.preco)
    }

    if (dados.categoria_id) {
        const categoria = await Categoria.findByPk(dados.categoria_id)
        if (!categoria) {
            throw new Error('Categoria não encontrada para vincular ao produto')
        }
        permitidos.categoria_id = dados.categoria_id
    }

    if (dados.descricao !== undefined) permitidos.descricao = dados.descricao
    if (dados.tipo) permitidos.tipo = dados.tipo
    if (dados.nivel) permitidos.nivel = dados.nivel
    if (dados.tempo_minutos !== undefined) permitidos.tempo_minutos = dados.tempo_minutos
    if (dados.imagem_url) permitidos.imagem_url = dados.imagem_url
    if (dados.status !== undefined) permitidos.status = dados.status

    if (Object.keys(permitidos).length === 0) {
        throw new Error('Nenhum campo válido foi enviado para atualização')
    }

    await produto.update(permitidos)

    return await Produto.findByPk(id, { include: INCLUDE_CATEGORIA })
}

async function deleteProduto(id) {

    const produto = await Produto.findByPk(id)

    if (!produto) {
        throw new Error('Produto não encontrado')
    }

    // Produto que já foi vendido não pode ser apagado (perderia o histórico do pedido).
    // Nesse caso ele é apenas desativado da vitrine.
    const jaVendido = await ItemPedido.count({ where: { produto_id: id } })

    if (jaVendido > 0) {
        await produto.update({ status: false })

        return {
            status: true,
            message: 'Produto já possui vendas registradas, por isso foi apenas desativado da vitrine'
        }
    }

    await Estoque.destroy({ where: { produto_id: id } })
    await produto.destroy()

    return {
        status: true,
        message: 'Produto apagado com sucesso'
    }
}

module.exports = {
    createProduto,
    listProdutos,
    listProdutosAdmin,
    findProdutoById,
    searchProdutos,
    updateProduto,
    patchProduto,
    deleteProduto
}
