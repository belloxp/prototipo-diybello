const { DataTypes } = require('sequelize');
const db = require('../db/conn');

const Produto = db.define('Produto', {
    id: { // Identificador único do produto
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: { // Nome da caixa/combo/insumo (Ex: Box Aura - Kit Velas Aromáticas)
        type: DataTypes.STRING(120),
        allowNull: false
    },
    descricao: { // Conceito da caixa e lista do que vem dentro
        type: DataTypes.TEXT,
        allowNull: true
    },
    preco: { // Preço de venda do produto
        type: DataTypes.FLOAT(10, 2),
        allowNull: false,
        validate: {
            min: 0.01 // O preço deve ser maior que zero
        }
    },
    slug: { // Slug do produto para URLs amigáveis
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true
    },
    tipo: { // Tipo de produto vendido pela DIYBELLO
        type: DataTypes.ENUM('CAIXA', 'COMBO', 'AVULSO'),
        allowNull: false,
        defaultValue: 'CAIXA'
    },
    nivel: { // Nível de dificuldade do projeto da caixa
        type: DataTypes.ENUM('INICIANTE', 'INTERMEDIARIO', 'AVANCADO'),
        allowNull: false,
        defaultValue: 'INICIANTE'
    },
    tempo_minutos: { // Tempo médio de execução do projeto em minutos (usado no filtro de tempo)
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 45,
        validate: {
            min: 0
        }
    },
    estoque_atual: { // Saldo atual em estoque - deduzido automaticamente ao finalizar o pedido
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0 // O saldo nunca pode ficar negativo
        }
    },
    imagem_url: { // Foto do produto exibida no card
        type: DataTypes.STRING,
        allowNull: false
    },
    status: { // Status do produto (ativo/inativo) - inativo some da vitrine pública
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    categoria_id: { // ID da categoria de hobby do produto
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categorias',
            key: 'id'
        }
    }
}, {
    tableName: 'produtos',
    timestamps: true
});

module.exports = Produto;
