# DIYBELLO — Diagramas de Engenharia

> Os diagramas abaixo estão escritos em **Mermaid**. Para exportar em `.png`,
> cole o bloco de código em [mermaid.live](https://mermaid.live) e use *Actions → PNG*,
> ou instale a extensão *Markdown Preview Mermaid Support* no VS Code e capture a tela.

---

## 1. Diagrama de Classes (UML)

```mermaid
classDiagram
    class Usuario {
        +int id
        +string nome
        +string email
        +string senha
        +string cpf
        +string telefone
        +string cep
        +string rua
        +string numero
        +string complemento
        +string bairro
        +string cidade
        +string uf
        +enum nivel_acesso
        +boolean status
        +cadastrar()
        +autenticar()
        +atualizarPerfil()
    }

    class Categoria {
        +int id
        +string nome
        +string descricao
        +string slug
        +string imagem_url
        +boolean status
        +listarProdutos()
    }

    class Produto {
        +int id
        +string nome
        +string descricao
        +float preco
        +string slug
        +enum tipo
        +enum nivel
        +int tempo_minutos
        +int estoque_atual
        +string imagem_url
        +boolean status
        +int categoria_id
        +temEstoque(qtd) boolean
        +deduzirEstoque(qtd)
        +devolverEstoque(qtd)
    }

    class Estoque {
        +int id
        +int produto_id
        +enum tipo
        +int quantidade
        +int saldo_anterior
        +int saldo_atual
        +string motivo
        +date data
        +registrarEntrada()
        +registrarSaida()
        +estornar()
    }

    class Pedido {
        +int id
        +int usuario_id
        +enum status
        +float subtotal
        +float desconto
        +float frete
        +float total
        +string cupom
        +enum forma_pagamento
        +string observacao
        +calcularDesconto()
        +calcularFrete()
        +finalizar()
        +cancelar()
    }

    class ItemPedido {
        +int id
        +int pedido_id
        +int produto_id
        +string nome_produto
        +int quantidade
        +float preco_unitario
        +float subtotal
        +calcularSubtotal()
    }

    class Entrega {
        +int id
        +int pedido_id
        +enum status
        +string codigo_rastreio
        +string cep
        +string rua
        +string numero
        +string bairro
        +string cidade
        +string uf
        +date previsao_entrega
        +date data_entrega
        +gerarRastreio()
        +atualizarStatus()
    }

    Usuario "1" --> "0..*" Pedido : realiza
    Pedido "1" --> "1..*" ItemPedido : contem
    ItemPedido "0..*" --> "1" Produto : referencia
    Pedido "1" --> "1" Entrega : gera
    Categoria "1" --> "0..*" Produto : classifica
    Produto "1" --> "0..*" Estoque : movimenta
```

### Cardinalidades

| Relacionamento | Cardinalidade | Chave estrangeira | Ao apagar o pai |
|---|---|---|---|
| Usuario → Pedido | 1 : N | `pedidos.usuario_id` | CASCADE |
| Pedido → ItemPedido | 1 : N | `itens_pedido.pedido_id` | CASCADE |
| ItemPedido → Produto | N : 1 | `itens_pedido.produto_id` | RESTRICT |
| Pedido → Entrega | 1 : 1 | `entregas.pedido_id` (UNIQUE) | CASCADE |
| Categoria → Produto | 1 : N | `produtos.categoria_id` | RESTRICT |
| Produto → Estoque | 1 : N | `estoques.produto_id` | CASCADE |

---

## 2. Diagrama de Casos de Uso

```mermaid
flowchart LR
    Visitante(["👤 Visitante"])
    Cliente(["👤 Cliente<br/>(USER)"])
    Admin(["👤 Administrador<br/>(ADMIN)"])
    ViaCEP(["🌐 ViaCEP"])

    subgraph SISTEMA["SISTEMA DIYBELLO"]
        direction TB

        subgraph PUB["Área Pública (sem login)"]
            UC06["UC06 Criar conta"]
            UC07["UC07 Validar CPF"]
            UC08["UC08 Autocompletar endereco"]
            UC09["UC09 Fazer login"]
        end

        subgraph CLI["Área do Cliente"]
            UC01["UC01 Navegar na loja"]
            UC02["UC02 Buscar e filtrar produtos"]
            UC03["UC03 Consultar detalhe do produto"]
            UC04["UC04 Gerenciar carrinho"]
            UC05["UC05 Montar caixa personalizada"]
            UC10["UC10 Finalizar pedido"]
            UC11["UC11 Consultar historico"]
            UC12["UC12 Rastrear entrega"]
            UC13["UC13 Atualizar perfil"]
        end

        subgraph ADM["Área Administrativa"]
            UC14["UC14 Gerenciar catalogo"]
            UC15["UC15 Gerenciar categorias"]
            UC16["UC16 Movimentar estoque"]
            UC17["UC17 Gerenciar pedidos e entregas"]
            UC18["UC18 Gerenciar clientes"]
            UC19["UC19 Ver relatorios gerenciais"]
        end
    end

    Visitante --- UC06
    Visitante --- UC09

    Cliente --- UC01
    Cliente --- UC02
    Cliente --- UC03
    Cliente --- UC04
    Cliente --- UC05

    UC06 -.->|include| UC07
    UC06 -.->|include| UC08
    UC08 --- ViaCEP
    UC10 -.->|extend| UC04

    Cliente --- UC10
    Cliente --- UC11
    Cliente --- UC12
    Cliente --- UC13

    Admin --- UC14
    Admin --- UC15
    Admin --- UC16
    Admin --- UC17
    Admin --- UC18
    Admin --- UC19

    Cliente -.->|herda de| Visitante
    Admin -.->|herda de| Cliente
```

---

## 3. Modelo Entidade-Relacionamento (banco)

```mermaid
erDiagram
    USUARIOS ||--o{ PEDIDOS : "realiza"
    PEDIDOS ||--|{ ITENS_PEDIDO : "contem"
    PEDIDOS ||--|| ENTREGAS : "gera"
    PRODUTOS ||--o{ ITENS_PEDIDO : "e vendido em"
    PRODUTOS ||--o{ ESTOQUES : "movimenta"
    CATEGORIAS ||--o{ PRODUTOS : "classifica"

    USUARIOS {
        int id PK
        varchar(100) nome
        varchar(100) email UK
        varchar senha "hash bcrypt"
        varchar(11) cpf UK
        varchar(11) telefone
        varchar(8) cep
        varchar(150) rua
        varchar(10) numero
        varchar(100) complemento
        varchar(100) bairro
        varchar(100) cidade
        varchar(2) uf
        enum nivel_acesso "USER, ADMIN"
        boolean status
    }

    CATEGORIAS {
        int id PK
        varchar(100) nome UK
        text descricao
        varchar(100) slug UK
        varchar imagem_url
        boolean status
    }

    PRODUTOS {
        int id PK
        varchar(120) nome
        text descricao
        float preco
        varchar(150) slug UK
        enum tipo "CAIXA, COMBO, AVULSO"
        enum nivel "INICIANTE, INTERMEDIARIO, AVANCADO"
        int tempo_minutos
        int estoque_atual
        varchar imagem_url
        boolean status
        int categoria_id FK
    }

    ESTOQUES {
        int id PK
        int produto_id FK
        enum tipo "ENTRADA, SAIDA"
        int quantidade
        int saldo_anterior
        int saldo_atual
        varchar(150) motivo
        datetime data
    }

    PEDIDOS {
        int id PK
        int usuario_id FK
        enum status "PENDENTE, PAGO, CANCELADO"
        float subtotal
        float desconto
        float frete
        float total
        varchar(30) cupom
        enum forma_pagamento "PIX, CARTAO, BOLETO"
        varchar(255) observacao
    }

    ITENS_PEDIDO {
        int id PK
        int pedido_id FK
        int produto_id FK
        varchar(120) nome_produto
        int quantidade
        float preco_unitario
        float subtotal
    }

    ENTREGAS {
        int id PK
        int pedido_id FK "UNIQUE"
        enum status "PREPARANDO, EM_TRANSITO, ENTREGUE, CANCELADA"
        varchar(30) codigo_rastreio UK
        varchar(8) cep
        varchar(150) rua
        varchar(10) numero
        varchar(100) bairro
        varchar(100) cidade
        varchar(2) uf
        datetime previsao_entrega
        datetime data_entrega
    }
```

---

## 4. Fluxo do Checkout (sequência)

Este é o fluxo mais importante do sistema: converter o carrinho do LocalStorage em uma venda real, deduzindo o estoque dentro de uma transação.

```mermaid
sequenceDiagram
    actor C as Cliente
    participant F as Frontend
    participant LS as LocalStorage
    participant API as API (Express)
    participant MW as authMiddleware
    participant S as pedido.service
    participant DB as MySQL

    C->>F: clica em "Finalizar pedido"
    F->>LS: lerCarrinho()
    LS-->>F: itens do carrinho

    alt sem token JWT
        F-->>C: redireciona para o login
    end

    F->>API: POST /pedidos + Bearer TOKEN
    API->>MW: valida o token

    alt token invalido ou expirado
        MW-->>F: 401 Unauthorized
    end

    MW->>S: createPedido(itens, usuario)

    loop para cada item
        S->>DB: SELECT produto
        alt produto esgotado ou saldo insuficiente
            S-->>F: 400 com o saldo disponivel
        end
    end

    S->>S: calcularDesconto() e calcularFrete()
    S->>DB: BEGIN TRANSACTION
    S->>DB: INSERT pedido
    S->>DB: INSERT itens_pedido
    S->>DB: UPDATE produtos (deduz estoque)
    S->>DB: INSERT estoques (SAIDA)
    S->>DB: INSERT entrega (rastreio + previsao)

    alt qualquer erro
        S->>DB: ROLLBACK
        S-->>F: 400 sem alterar nada
    end

    S->>DB: COMMIT
    S-->>API: pedido + resumo
    API-->>F: 201 Created
    F->>LS: limparCarrinho()
    F-->>C: numero do pedido e codigo de rastreio
```

---

## 5. Arquitetura de Acesso: Login como porta de entrada

```mermaid
flowchart TB
    START(["Usuário abre o sistema"]) --> LOGIN["index.html<br/>TELA DE LOGIN"]

    LOGIN -->|"POST /login"| VALIDA{"Credenciais<br/>válidas?"}
    VALIDA -->|não| ERRO["401 · mensagem de erro"] --> LOGIN
    VALIDA -->|sim| TOKEN["Salva o token JWT<br/>no LocalStorage"]

    TOKEN --> PERFIL{"nivel_acesso"}

    PERFIL -->|USER| LOJA["html/loja.html"]
    PERFIL -->|ADMIN| PAINEL["html/admin.html"]

    subgraph AREA_CLIENTE["Área do Cliente"]
        LOJA --> C1["Catálogo · busca e filtros"]
        LOJA --> C2["Detalhe do produto"]
        LOJA --> C3["Monte sua Caixa"]
        LOJA --> C4["Carrinho e checkout"]
        LOJA --> C5["Meus pedidos e rastreio"]
        LOJA --> C6["Perfil · PUT e PATCH"]
    end

    subgraph AREA_ADMIN["Área Administrativa · CRUD"]
        PAINEL --> A1["Produtos<br/>POST GET PUT PATCH DELETE"]
        PAINEL --> A2["Categorias<br/>POST GET PUT PATCH DELETE"]
        PAINEL --> A3["Estoque<br/>entrada, saída, correção, estorno"]
        PAINEL --> A4["Vendas<br/>status do pedido e da entrega"]
        PAINEL --> A5["Clientes<br/>consulta e bloqueio"]
        PAINEL --> A6["Relatórios<br/>gráficos Chart.js"]
    end

    LOGIN -.->|"sem conta"| CADASTRO["html/cadastro.html<br/>ViaCEP + validação de CPF"]
    CADASTRO -->|"POST /usuarios"| LOGIN
```

### Como o bloqueio funciona nas duas camadas

```mermaid
flowchart LR
    subgraph FRONT["Frontend · js/config.js"]
        F1["protegerTela()"] --> F2{"tem sessão?"}
        F2 -->|não| F3["volta para index.html"]
        F2 -->|sim| F4{"a tela é só de ADMIN?"}
        F4 -->|"sim e não é admin"| F5["volta para loja.html"]
        F4 -->|ok| F6["renderiza a tela"]
    end

    subgraph BACK["Backend · middlewares"]
        B1["authMiddleware"] --> B2{"Bearer TOKEN válido?"}
        B2 -->|não| B3["HTTP 401"]
        B2 -->|sim| B4["isAdminMiddleware"]
        B4 --> B5{"nivel_acesso = ADMIN?"}
        B5 -->|não| B6["HTTP 403"]
        B5 -->|sim| B7["executa a rota"]
    end

    F6 -->|"fetch com o token"| B1
```

> O frontend evita que a tela abra; o backend garante que o dado não saia.
> Mesmo que alguém digite a URL direto, a API continua devolvendo 401 ou 403.

### Rotas públicas x privadas na API

| Acesso | Endpoints |
|---|---|
| 🔓 **Público** | `POST /login` · `POST /usuarios` · `GET /produtos` · `GET /produtos/:id` · `GET /produtos/buscar` · `GET /categorias` |
| 🔒 **Cliente autenticado** | `GET /usuarios/perfil` · `PUT` e `PATCH /usuarios/:id` · `POST /pedidos` · `GET /pedidos/meus-pedidos` · `GET /entregas/minhas-entregas` |
| 🔒 **Somente ADMIN** | CRUD de `/produtos`, `/categorias`, `/estoque` · `GET /pedidos` · `PATCH /entregas/:id` · `GET /usuarios` · `GET /relatorios/vendas` e `/relatorios/estoque` |

---

## 6. Fluxo de Estados

### 6.1 Status do Pedido

```mermaid
stateDiagram-v2
    [*] --> PENDENTE : checkout finalizado
    PENDENTE --> PAGO : pagamento confirmado pelo admin
    PENDENTE --> CANCELADO : cliente desiste ou pagamento falha
    PAGO --> CANCELADO : estorno
    CANCELADO --> [*] : itens devolvidos ao estoque
    PAGO --> [*] : entrega concluida
```

### 6.2 Status da Entrega

```mermaid
stateDiagram-v2
    [*] --> PREPARANDO : gerada junto com o pedido
    PREPARANDO --> EM_TRANSITO : despachada pela loja
    EM_TRANSITO --> ENTREGUE : recebida pelo cliente
    PREPARANDO --> CANCELADA : pedido cancelado
    EM_TRANSITO --> CANCELADA : devolucao
    ENTREGUE --> [*]
    CANCELADA --> [*]
```

---

## 7. Fluxo do "Monte Sua Caixa"

```mermaid
flowchart LR
    A["Passo 1<br/>Escolha o tema"] --> B["Passo 2<br/>Itens básicos"]
    B --> C["Passo 3<br/>Extras e aromas"]
    C --> D["Passo 4<br/>Embalagem e cartão"]
    D --> E["Adiciona todos os<br/>itens ao carrinho"]
    E --> F["Tela do carrinho<br/>com a mensagem<br/>já preenchida"]

    B -.->|preço recalculado| R[["Resumo dinâmico<br/>subtotal - desconto"]]
    C -.->|preço recalculado| R
    D -.->|preço recalculado| R
```
