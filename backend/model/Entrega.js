const { DataTypes } = require('sequelize');
const db = require('../db/conn');

const Entrega = db.define('Entrega', {
    id: { // Identificador único da entrega
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    pedido_id: { // ID do pedido que está sendo entregue (1 pedido para 1 entrega)
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'pedidos',
            key: 'id'
        }
    },
    status: { // Situação da entrega acompanhada pelo cliente no histórico de pedidos
        type: DataTypes.ENUM('PREPARANDO', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADA'),
        allowNull: false,
        defaultValue: 'PREPARANDO'
    },
    codigo_rastreio: { // Código de rastreio gerado no fechamento do pedido
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true
    },
    cep: { // CEP do endereço de entrega (copiado do cadastro do cliente)
        type: DataTypes.STRING(8),
        allowNull: false
    },
    rua: { // Logradouro da entrega
        type: DataTypes.STRING(150),
        allowNull: false
    },
    numero: { // Número da entrega
        type: DataTypes.STRING(10),
        allowNull: false
    },
    bairro: { // Bairro da entrega
        type: DataTypes.STRING(100),
        allowNull: false
    },
    cidade: { // Cidade da entrega
        type: DataTypes.STRING(100),
        allowNull: false
    },
    uf: { // Estado da entrega
        type: DataTypes.STRING(2),
        allowNull: false
    },
    previsao_entrega: { // Data prevista para a entrega (cálculo fictício de prazo)
        type: DataTypes.DATE,
        allowNull: true
    },
    data_entrega: { // Data real da entrega, preenchida quando o status vira ENTREGUE
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'entregas',
    timestamps: true
});

module.exports = Entrega;
