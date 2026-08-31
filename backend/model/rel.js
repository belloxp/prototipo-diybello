const Usuario = require('./Usuario');
const Categoria = require('./Categoria');
const Produto = require('./Produto');
const Estoque = require('./Estoque');
const Pedido = require('./Pedido');
const ItemPedido = require('./ItemPedido');
const Entrega = require('./Entrega');

// =====================================================
// |                 ROTA DA COMPRA                    |
// |  USUARIO -> PEDIDO -> ITEM_PEDIDO -> PRODUTO      |
// |                    -> ENTREGA                     |
// =====================================================

// Usuario 1 : N Pedido
Usuario.hasMany(Pedido, {
    foreignKey: 'usuario_id',
    as: 'pedidoUsuario'
})

Pedido.belongsTo(Usuario, {
    foreignKey: {
        name: 'usuario_id',
        allowNull: false
    },
    as: 'usuarioPedido',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})
// -----------------------------------------------------

// Pedido 1 : N ItemPedido
Pedido.hasMany(ItemPedido, {
    foreignKey: 'pedido_id',
    as: 'itemPedidoPedido'
})

ItemPedido.belongsTo(Pedido, {
    foreignKey: {
        name: 'pedido_id',
        allowNull: false
    },
    as: 'pedidoItemPedido',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})
// -----------------------------------------------------

// ItemPedido N : 1 Produto
ItemPedido.belongsTo(Produto, {
    foreignKey: {
        name: 'produto_id',
        allowNull: false
    },
    as: 'produtoItemPedido',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
})

Produto.hasMany(ItemPedido, {
    foreignKey: 'produto_id',
    as: 'itemPedidoProduto'
})
// -----------------------------------------------------

// Pedido 1 : 1 Entrega
Pedido.hasOne(Entrega, {
    foreignKey: 'pedido_id',
    as: 'entregaPedido'
})

Entrega.belongsTo(Pedido, {
    foreignKey: {
        name: 'pedido_id',
        allowNull: false
    },
    as: 'pedidoEntrega',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})
// -----------------------------------------------------
// =====================================================

// =====================================================
// |                ROTA DO PRODUTO                    |
// |         PRODUTO : CATEGORIA | ESTOQUE             |
// =====================================================

// Produto N : 1 Categoria
Produto.belongsTo(Categoria, {
    foreignKey: {
        name: 'categoria_id',
        allowNull: false
    },
    as: 'categoriaProduto',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
})

Categoria.hasMany(Produto, {
    foreignKey: 'categoria_id',
    as: 'produtoCategoria'
})
// -----------------------------------------------------

// Produto 1 : N Estoque (histórico de movimentações)
Produto.hasMany(Estoque, {
    foreignKey: 'produto_id',
    as: 'estoqueProduto'
})

Estoque.belongsTo(Produto, {
    foreignKey: {
        name: 'produto_id',
        allowNull: false
    },
    as: 'produtoEstoque',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
})
// -----------------------------------------------------
// =====================================================

module.exports = {
    Usuario,
    Categoria,
    Produto,
    Estoque,
    Pedido,
    ItemPedido,
    Entrega
};
