require('dotenv').config()
const app = require('./server/app')
const conn = require('./db/conn')

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0' // 0.0.0.0 aceita conexões em PaaS como o Railway

const isProduction = process.env.NODE_ENV === 'production'

async function startServer() {
    try {
        if (!isProduction) {
            // Em desenvolvimento: sincroniza alterando o esquema para facilitar o dev
            require('./model/rel')
            await conn.sync({ alter: true })
            console.log('> banco sincronizado (dev) com { alter: true }')
        } else {
            // Em produção: NÃO sincroniza automaticamente (evita alterar tabelas sem controle)
            await conn.authenticate()
            console.log('> banco autenticado (produção)')
        }

        app.listen(PORT, HOST, () => {
            console.log(`> servidor DIYBELLO rodando em http://${HOST}:${PORT}`)
        })
    } catch (err) {
        console.error('> ERRO: erro ao conectar ao banco ou iniciar o servidor: ', err)
        process.exit(1) // sai com erro para o Railway identificar falha no deploy
    }
}

startServer()
