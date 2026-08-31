const { DataTypes } = require('sequelize');
const db = require('../db/conn');

const Usuario = db.define('Usuario', {
    id: { // Identificador único do usuário
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: { // Nome completo do usuário
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: { // E-mail do usuário, usado para o login
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    senha: { // Senha do usuário (hash gerado pelo bcrypt)
        type: DataTypes.STRING,
        allowNull: false
    },
    cpf: { // CPF do usuário (somente números) - validado matematicamente antes do cadastro
        type: DataTypes.STRING(11),
        allowNull: false,
        unique: true
    },
    telefone: { // Telefone do usuário (somente números)
        type: DataTypes.STRING(11),
        allowNull: true
    },
    cep: { // CEP preenchido pelo usuário e usado na consulta do ViaCEP
        type: DataTypes.STRING(8),
        allowNull: false
    },
    rua: { // Logradouro autocompletado pelo ViaCEP
        type: DataTypes.STRING(150),
        allowNull: false
    },
    numero: { // Número da residência (digitado pelo usuário)
        type: DataTypes.STRING(10),
        allowNull: false
    },
    complemento: { // Complemento do endereço (opcional)
        type: DataTypes.STRING(100),
        allowNull: true
    },
    bairro: { // Bairro autocompletado pelo ViaCEP
        type: DataTypes.STRING(100),
        allowNull: false
    },
    cidade: { // Cidade autocompletada pelo ViaCEP
        type: DataTypes.STRING(100),
        allowNull: false
    },
    uf: { // Estado autocompletado pelo ViaCEP
        type: DataTypes.STRING(2),
        allowNull: false
    },
    nivel_acesso: { // Nível de acesso - cliente comum ou administrador da loja
        type: DataTypes.ENUM('USER', 'ADMIN'),
        allowNull: false,
        defaultValue: 'USER'
    },
    status: { // Status do usuário (ativo/inativo) - inativo quando bloqueado ou por inatividade
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'usuarios',
    timestamps: true
});

module.exports = Usuario;
