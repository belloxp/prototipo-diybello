const { DataTypes } = require('sequelize');
const db = require('../db/conn');

const Estoque = db.define('Estoque', {
    id: { // Identificador único da movimentação de estoque
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    produto_id: { // ID do produto movimentado
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'produtos',
            key: 'id'
        }
    },
    tipo: { // Tipo da movimentação (entrada de mercadoria ou saída por venda/perda)
        type: DataTypes.ENUM('ENTRADA', 'SAIDA'),
        allowNull: false,
        defaultValue: 'ENTRADA'
    },
    quantidade: { // Quantidade movimentada (sempre positiva, o tipo define se soma ou subtrai)
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1 // Toda movimentação precisa mexer em pelo menos 1 item
        }
    },
    saldo_anterior: { // Saldo do produto antes da movimentação (histórico/auditoria)
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    saldo_atual: { // Saldo do produto depois da movimentação
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    motivo: { // Motivo da movimentação (Ex: compra de fornecedor, venda do pedido 12)
        type: DataTypes.STRING(150),
        allowNull: true
    },
    data: { // Data da movimentação
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'estoques',
    timestamps: true
});

module.exports = Estoque;
