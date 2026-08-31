const { Sequelize } = require('sequelize')
require('dotenv').config()

// lógica: se existir uma DATABASE_URL (mysql://user:pass@host:port/dbname) usa ela.
// Senão tenta as variáveis do Railway (MYSQLHOST / MYSQLUSER / MYSQLPASSWORD / MYSQLDATABASE / MYSQLPORT).
// Por último cai nas variáveis locais separadas (DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT).

function getConnectionConfig() {
    // 1) URL completa fornecida pelo provedor (Railway/Render)
    if (process.env.DATABASE_URL) {
        return { uri: process.env.DATABASE_URL, options: { dialect: 'mysql', dialectOptions: {} } }
    }

    if (process.env.MYSQLDATABASE && process.env.MYSQLUSER && process.env.MYSQLPASSWORD) {
        const db = process.env.MYSQLDATABASE
        const user = process.env.MYSQLUSER
        const pass = process.env.MYSQLPASSWORD
        const host = process.env.MYSQLHOST || process.env.DB_HOST
        const port = process.env.MYSQLPORT || process.env.DB_PORT || 3306
        const uri = `mysql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${db}`
        return { uri, options: { dialect: 'mysql', dialectOptions: {} } }
    }

    // 3) variáveis locais do .env
    if (process.env.DB_NAME && process.env.DB_USER) {
        const db = process.env.DB_NAME
        const user = process.env.DB_USER
        const pass = process.env.DB_PASS || ''
        const host = process.env.DB_HOST || 'localhost'
        const port = process.env.DB_PORT || 3306
        const uri = `mysql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${db}`
        return { uri, options: { dialect: 'mysql', dialectOptions: {} } }
    }

    throw new Error('Nenhuma configuração de banco encontrada. Defina DATABASE_URL OU MYSQLDATABASE/MYSQLUSER/MYSQLPASSWORD OU DB_NAME/DB_USER/DB_PASS no .env')
}

const { uri, options } = getConnectionConfig()

const sequelize = new Sequelize(uri, {
    ...options,
    logging: false,
    timezone: '-03:00'
})

// Teste de conexão com log claro no terminal
async function testConnection() {
    try {
        await sequelize.authenticate()
        console.log('> conexão com o banco realizada com sucesso.')
    } catch (err) {
        console.error('> ERRO: erro ao conectar com banco de dados: ', err.message)
    }
}
testConnection()

module.exports = sequelize
