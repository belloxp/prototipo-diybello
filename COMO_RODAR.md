# DIYBELLO — Como rodar o projeto

## 1. O que você precisa ter instalado

| Programa | Versão mínima | Como conferir |
|---|---|---|
| Node.js | 18 ou superior | `node -v` |
| MySQL Server | 8.0 | o serviço **MySQL80** precisa estar rodando |

---

## 2. Criar o banco de dados

Abra o terminal do MySQL (ou o MySQL Workbench) e rode:

```sql
CREATE DATABASE IF NOT EXISTS diybello
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Pela linha de comando:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS diybello CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

> As tabelas **não** precisam ser criadas à mão — o seed (passo 4) cria tudo automaticamente.

---

## 3. Configurar o `.env` do backend

Dentro da pasta `backend`, copie o arquivo de exemplo:

```bash
cd backend
cp .env.example .env
```

> O `.env.example` já vem com as configurações padrão da escola (`root` / `senai`).  
> Se a sua senha do MySQL for diferente, abra o `.env` e altere o campo `DB_PASS`.

---

## 4. Instalar as dependências

Ainda dentro de `backend`:

```bash
npm install
```

---

## 5. Popular o banco (seed)

```bash
node seed.js
```

O comando deve terminar com:

```
> 5 categorias cadastradas.
> 18 produtos cadastrados com estoque inicial.
> 12 usuários cadastrados.
> 55 pedidos históricos criados com itens, estoque e entrega.
==============================
 CARGA CONCLUÍDA - ACESSOS DE TESTE
 ADMIN   -> admin@diybello.com   / admin123456
 CLIENTE -> cliente@diybello.com / cliente123
==============================
```

> ⚠️ O seed **apaga e recria todas as tabelas**. Rode novamente sempre que quiser voltar o banco ao estado inicial.

---

## 6. Subir a API (backend)

```bash
npm start
```

Quando estiver tudo certo, aparece:

```
> conexão com o banco realizada com sucesso.
> servidor DIYBELLO rodando em http://localhost:3000
```

**Deixe esse terminal aberto.**

---

## 7. Subir o frontend

Abra **outro terminal**, entre na pasta `frontend` e rode:

```bash
cd frontend
python3 -m http.server 8080
```

> Também funciona a extensão **Live Server** do VS Code (botão *Go Live*) apontando para a pasta `frontend`.  
> Não abra os `.html` com duplo clique (`file://`) — a página não consegue chamar a API dessa forma.

---

## 8. Acessar o sistema

| Tela | Endereço |
|---|---|
| Login | http://localhost:8080 |
| Loja | http://localhost:8080/html/loja.html |
| Painel Admin | http://localhost:8080/html/admin.html |

### Acessos criados pelo seed

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@diybello.com | admin123456 |
| Cliente teste | cliente@diybello.com | cliente123 |

---

## Resumo rápido (para quem já fez tudo uma vez)

```bash
# terminal 1 — API
cd backend
npm start

# terminal 2 — frontend
cd frontend
python3 -m http.server 8080
```

Depois abra http://localhost:8080 no navegador.
