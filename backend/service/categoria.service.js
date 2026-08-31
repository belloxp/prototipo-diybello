const Categoria = require('../model/Categoria')
const Produto = require('../model/Produto')
const { Op } = require('sequelize')
const { gerarSlug } = require('../utils/function')

async function createCategoria(dados) {

    const { nome, descricao, imagem_url } = dados

    if (!nome) {
        throw new Error('O nome da categoria é obrigatório')
    }

    const slug = gerarSlug(nome)

    // Verifica a existência prévia da categoria antes de cadastrar
    const categoriaExistente = await Categoria.findOne({
        where: { [Op.or]: [{ nome }, { slug }] }
    })

    if (categoriaExistente) {
        throw new Error('Já existe uma categoria cadastrada com esse nome')
    }

    const novaCategoria = await Categoria.create({
        nome,
        descricao,
        slug,
        imagem_url,
        status: true
    })

    return novaCategoria
}

async function listCategorias() {
    return await Categoria.findAll({
        where: { status: true },
        order: [['nome', 'ASC']]
    })
}

async function listCategoriasAdmin() {
    return await Categoria.findAll({
        order: [['id', 'ASC']]
    })
}

async function findCategoriaById(id) {
    const categoria = await Categoria.findByPk(id)

    if (!categoria) {
        throw new Error('Categoria não encontrada')
    }

    return categoria
}

async function searchCategorias(busca) {
    if (!busca || typeof busca !== 'string') {
        throw new Error('Termo de busca ausente ou inválido')
    }

    const termo = busca.trim()

    // Só números: procura pelo código da categoria
    const where = /^\d+$/.test(termo)
        ? { id: Number(termo) }
        : {
            [Op.or]: [
                { nome: { [Op.like]: `%${termo}%` } },
                { slug: { [Op.like]: `%${termo}%` } }
            ]
        }

    return await Categoria.findAll({ where, order: [['id', 'ASC']] })
}

// PUT - atualização completa
async function updateCategoria(id, dados) {

    const categoria = await Categoria.findByPk(id)

    if (!categoria) {
        throw new Error('Categoria não encontrada')
    }

    const { nome, descricao, imagem_url, status } = dados

    if (!nome) {
        throw new Error('No PUT o nome da categoria é obrigatório')
    }

    const slug = gerarSlug(nome)

    const nomeExistente = await Categoria.findOne({
        where: { nome, id: { [Op.ne]: id } }
    })

    if (nomeExistente) {
        throw new Error('Já existe outra categoria com esse nome')
    }

    await categoria.update({
        nome,
        descricao,
        slug,
        imagem_url,
        status: status !== undefined ? status : true
    })

    return categoria
}

// PATCH - atualização parcial
async function patchCategoria(id, dados) {

    const categoria = await Categoria.findByPk(id)

    if (!categoria) {
        throw new Error('Categoria não encontrada')
    }

    const permitidos = {}

    if (dados.nome) {
        const nomeExistente = await Categoria.findOne({
            where: { nome: dados.nome, id: { [Op.ne]: id } }
        })
        if (nomeExistente) {
            throw new Error('Já existe outra categoria com esse nome')
        }
        permitidos.nome = dados.nome
        permitidos.slug = gerarSlug(dados.nome)
    }

    if (dados.descricao !== undefined) permitidos.descricao = dados.descricao
    if (dados.imagem_url !== undefined) permitidos.imagem_url = dados.imagem_url
    if (dados.status !== undefined) permitidos.status = dados.status

    if (Object.keys(permitidos).length === 0) {
        throw new Error('Nenhum campo válido foi enviado para atualização')
    }

    await categoria.update(permitidos)

    return categoria
}

async function deleteCategoria(id) {

    const categoria = await Categoria.findByPk(id)

    if (!categoria) {
        throw new Error('Categoria não encontrada')
    }

    // Não deixa apagar uma categoria que ainda tem produtos vinculados
    const produtosVinculados = await Produto.count({ where: { categoria_id: id } })

    if (produtosVinculados > 0) {
        throw new Error(`Não é possível apagar: existem ${produtosVinculados} produto(s) nessa categoria`)
    }

    await categoria.destroy()

    return {
        status: true,
        message: 'Categoria apagada com sucesso'
    }
}

module.exports = {
    createCategoria,
    listCategorias,
    listCategoriasAdmin,
    findCategoriaById,
    searchCategorias,
    updateCategoria,
    patchCategoria,
    deleteCategoria
}
