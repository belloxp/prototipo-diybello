const { DataTypes } = require('sequelize');
const db = require('../db/conn');

const Pedido = db.define('Pedido', {
    id: { // Identificador único do pedido
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    usuario_id: { // ID do cliente que fechou o pedido
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id'
        }
    },
    status: { // Situação do pedido dentro do fluxo da loja
        type: DataTypes.ENUM('PENDENTE', 'PAGO', 'CANCELADO'),
        allowNull: false,
        defaultValue: 'PENDENTE'
    },
    subtotal: { // Soma dos itens sem frete e sem desconto
        type: DataTypes.FLOAT(10, 2),
        allowNull: false,
        validate: {
            min: 0.01 // O subtotal deve ser maior que zero
        }
    },
    desconto: { // Valor do desconto aplicado pelas regras de negócio
        type: DataTypes.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    frete: { // Valor do frete (cálculo fictício, grátis acima do valor mínimo)
        type: DataTypes.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    total: { // Valor final do pedido (subtotal - desconto + frete)
        type: DataTypes.FLOAT(10, 2),
        allowNull: false,
        validate: {
            min: 0.01 // O total deve ser maior que zero
        }
    },
    cupom: { // Cupom de desconto utilizado na compra (se houver)
        type: DataTypes.STRING(30),
        allowNull: true
    },
    forma_pagamento: { // Forma de pagamento escolhida no checkout
        type: DataTypes.ENUM('PIX', 'CARTAO', 'BOLETO'),
        allowNull: false,
        defaultValue: 'PIX'
    },
    observacao: { // Mensagem do cartão de presente / observação do cliente
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'pedidos',
    timestamps: true
});

module.exports = Pedido;
