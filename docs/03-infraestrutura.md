# DIYBELLO — Infraestrutura Necessária

Lista dos requisitos de software e hardware para **desenvolver** e para **rodar em produção** o sistema DIYBELLO.

---

## 1. Ambiente de Desenvolvimento

### 1.1 Software obrigatório

| Software | Versão mínima | Para que serve |
|---|---|---|
| **Node.js** | 18 LTS (testado na 22.12) | Runtime que executa o backend |
| **npm** | 9 (testado na 10.9) | Gerenciador de pacotes |
| **MySQL Server** | 8.0 | Banco de dados relacional |
| **Git** | 2.40 | Versionamento e envio para o deploy |
| **Navegador** | Chrome, Edge ou Firefox atualizados | Rodar e depurar o frontend |

### 1.2 Software recomendado

| Software | Para que serve |
|---|---|
| **Visual Studio Code** | Editor de código |
| Extensão **REST Client** | Executar o arquivo `rest_client.http` |
| Extensão **Live Server** | Servir o frontend em `http://127.0.0.1:5500` |
| Extensão **MySQL** ou **DBeaver** / **MySQL Workbench** | Visualizar as tabelas e conferir os dados |
| Extensão **Markdown Preview Mermaid Support** | Visualizar os diagramas da pasta `docs` |

### 1.3 Bibliotecas do backend (npm)

| Pacote | Versão | Papel no projeto |
|---|---|---|
| `express` | ^5.1.0 | Servidor HTTP e roteamento REST |
| `sequelize` | ^6.37.7 | ORM que mapeia as 7 tabelas |
| `mysql2` | ^3.15.1 | Driver de conexão com o MySQL |
| `bcrypt` | ^6.0.0 | Criptografia das senhas |
| `jsonwebtoken` | ^9.0.2 | Geração e validação do token JWT |
| `cors` | ^2.8.5 | Libera o acesso do frontend em outro domínio |
| `dotenv` | ^17.2.3 | Carrega as variáveis de ambiente do `.env` |
| `nodemon` | ^3.1.10 | *(dev)* Reinicia o servidor a cada alteração |

### 1.4 Bibliotecas do frontend

| Biblioteca | Origem | Papel no projeto |
|---|---|---|
| `Chart.js 4.4.1` | CDN jsDelivr | Renderiza os gráficos dos relatórios gerenciais |

> O restante do frontend é **HTML, CSS e JavaScript puro**, sem framework e sem etapa de build.

### 1.5 Serviços externos consumidos

| Serviço | Endpoint | Uso |
|---|---|---|
| **ViaCEP** | `https://viacep.com.br/ws/{cep}/json/` | Autocompletar rua, bairro, cidade e UF no cadastro e no perfil |

### 1.6 Hardware recomendado para desenvolver

| Item | Mínimo | Recomendado |
|---|---|---|
| Processador | Dual-core 2.0 GHz | Quad-core 2.5 GHz ou superior |
| Memória RAM | 4 GB | 8 GB ou mais |
| Armazenamento livre | 5 GB | 10 GB (SSD) |
| Sistema operacional | Windows 10, Linux ou macOS | Windows 11 / Ubuntu 22.04 |
| Internet | 5 Mbps | 20 Mbps (deploy e ViaCEP) |
| Resolução de tela | 1366x768 | 1920x1080 |

---

## 2. Ambiente de Produção

### 2.1 Backend — Railway

| Item | Especificação |
|---|---|
| Plataforma | [Railway](https://railway.app) |
| Tipo de serviço | Web Service (Node.js) |
| Comando de start | `npm start` (executa `node index.js`) |
| Porta | Definida automaticamente pela variável `PORT` |
| Host | `0.0.0.0` (obrigatório em PaaS) |
| Recursos mínimos | 512 MB de RAM, 0.5 vCPU |

**Variáveis de ambiente no Railway:**

```
NODE_ENV=production
PORT=(preenchida automaticamente)
DATABASE_URL=(fornecida pelo plugin MySQL)
JWT_SECRET=uma_string_longa_e_aleatoria
JWT_EXPIRES_IN=8h
BCRYPT_SALT_ROUNDS=10
ADMIN_EMAIL=admin@diybello.com
```

> O arquivo `db/conn.js` reconhece três formatos de configuração, nesta ordem:
> 1. `DATABASE_URL` (padrão Railway/Render)
> 2. `MYSQLDATABASE` / `MYSQLUSER` / `MYSQLPASSWORD` / `MYSQLHOST` / `MYSQLPORT`
> 3. `DB_NAME` / `DB_USER` / `DB_PASS` / `DB_HOST` / `DB_PORT` (desenvolvimento local)

### 2.2 Banco de dados — MySQL no Railway

| Item | Especificação |
|---|---|
| Serviço | Plugin MySQL do Railway |
| Versão | MySQL 8.0 |
| Charset | `utf8mb4` / `utf8mb4_unicode_ci` (necessário para acentos e emojis) |
| Armazenamento inicial | 1 GB (suficiente para milhares de pedidos) |
| Tabelas | 7 (`usuarios`, `categorias`, `produtos`, `estoques`, `pedidos`, `itens_pedido`, `entregas`) |
| Backup | Snapshot automático do Railway |

> Em produção o `index.js` **não** executa `sync({ alter: true })` — apenas `authenticate()`.
> A criação das tabelas em produção deve ser feita rodando o `sync.js` uma única vez.

### 2.3 Frontend — Vercel

| Item | Especificação |
|---|---|
| Plataforma | [Vercel](https://vercel.com) |
| Tipo de projeto | Static Site (sem framework, sem build) |
| Root Directory | `frontend` |
| Build Command | *(vazio)* |
| Output Directory | *(vazio — serve a raiz)* |
| CDN | Global, com HTTPS automático |

> Antes de publicar, altere a constante `API_URL` no arquivo `frontend/js/config.js`
> para a URL pública do backend no Railway.

### 2.4 Requisitos do cliente final (quem acessa a loja)

| Item | Especificação |
|---|---|
| Navegador | Chrome 90+, Edge 90+, Firefox 88+ ou Safari 14+ |
| JavaScript | Habilitado (obrigatório) |
| LocalStorage | Habilitado (guarda o carrinho e o token) |
| Resolução | A partir de 320 px de largura |
| Layouts alvo | Celular 390x844 px e Desktop 1366x768 px |
| Internet | 1 Mbps |

---

## 3. Portas e Endereços

| Ambiente | Componente | Endereço |
|---|---|---|
| Desenvolvimento | Backend | `http://localhost:3000` |
| Desenvolvimento | MySQL | `localhost:3306` |
| Desenvolvimento | Frontend (Live Server) | `http://127.0.0.1:5500` |
| Produção | Backend | `https://<projeto>.up.railway.app` |
| Produção | Frontend | `https://<projeto>.vercel.app` |

---

## 4. Segurança da Infraestrutura

| Medida | Como está implementada |
|---|---|
| Senhas nunca em texto puro | Hash bcrypt com 10 salt rounds |
| Senha nunca trafega de volta | Lista `CAMPOS_PUBLICOS` no `usuario.service.js` |
| Segredo do JWT fora do código | Variável `JWT_SECRET` no `.env` / painel do Railway |
| `.env` fora do versionamento | Listado no `.gitignore` |
| Expiração de sessão | Token com validade de 8 horas |
| Controle de acesso por camada | `authMiddleware` (401) e `isAdminMiddleware` (403) |
| Preço imune a manipulação | O checkout recalcula tudo com o preço do banco |
| Integridade entre tabelas | Transações Sequelize com rollback automático |
| HTTPS | Fornecido automaticamente por Railway e Vercel |
| CORS | Habilitado no `server/app.js` |

---

## 5. Estimativa de Custo (plano de estudante)

| Serviço | Plano | Custo |
|---|---|---|
| Railway (backend + MySQL) | Trial / Hobby | Gratuito dentro da cota mensal |
| Vercel (frontend) | Hobby | Gratuito |
| ViaCEP | Público | Gratuito |
| Chart.js via CDN | Open source | Gratuito |
| **Total** | | **R$ 0,00** |
