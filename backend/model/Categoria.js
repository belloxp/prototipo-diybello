const { DataTypes } = require('sequelize');
const db = require('../db/conn');

const Categoria = db.define('Categoria', {
    id: { // Identificador único da categoria
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: { // Nome da categoria de hobby (Ex: Aroma & Velas, Cerâmica & Escultura)
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    descricao: { // Descrição da categoria exibida na vitrine
        type: DataTypes.TEXT,
        allowNull: true
    },
    slug: { // Slug da categoria para URLs amigáveis e filtros do frontend
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    imagem_url: { // Imagem ilustrativa da categoria
        type: DataTypes.STRING,
        allowNull: true
    },
    status: { // Indica se a categoria está ativa na loja
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'categorias',
    timestamps: true
});

module.exports = Categoria;
