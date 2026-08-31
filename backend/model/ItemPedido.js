const { DataTypes } = require('sequelize');
const db = require('../db/conn');

const ItemPedido = db.define('ItemPedido', {
    id: { // Identificador único do item do pedido
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    pedido_id: { // ID do pedido ao qual o item pertence
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pedidos',
            key: 'id'
        }
    },
    produto_id: { // ID do produto comprado
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'produtos',
            key: 'id'
        }
    },
    nome_produto: { // Nome do produto congelado no momento da compra (histórico)
        type: DataTypes.STRING(120),
        allowNull: false
    },
    quantidade: { // Quantidade comprada do produto
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1 // Precisa comprar pelo menos 1 unidade
        }
    },
    preco_unitario: { // Preço unitário congelado no momento da compra
        type: DataTypes.FLOAT(10, 2),
        allowNull: false,
        validate: {
            min: 0.01
        }
    },
    subtotal: { // Subtotal do item (preco_unitario x quantidade)
        type: DataTypes.FLOAT(10, 2),
        allowNull: false,
        validate: {
            min: 0.01
        }
    }
}, {
    // Chave composta para o mesmo produto não aparecer duas vezes no mesmo pedido
    indexes: [{
        unique: true,
        fields: ['pedido_id', 'produto_id']
    }],
    tableName: 'itens_pedido',
    timestamps: true
});

module.exports = ItemPedido;
