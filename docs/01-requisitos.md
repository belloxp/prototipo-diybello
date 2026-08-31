# DIYBELLO — Documento de Requisitos

**Sistema:** E-commerce e Controle de Estoque
**Nicho:** Kits e caixas para hobbies criativos (DIY Box)
**Versão:** 1.0 — Primeira versão (homologação)

---

## 1. Contextualização

A DIYBELLO é uma loja especializada em **kits de experiência "faça você mesmo"**: caixas fechadas com todos os materiais necessários para o cliente criar algo com as próprias mãos — velas aromáticas, cerâmica fria, pintura em aquarela, macramê e terrários.

Hoje o controle de entrada e saída dos kits é feito em planilhas, o que gera erros de contagem e falta de organização. O Product Owner encomendou uma plataforma web completa para gerenciar as vendas, controlar o estoque dinamicamente e fornecer relatórios gerenciais analíticos.

A loja vende em três formatos, todos representados pela mesma entidade `Produto` através do campo `tipo`:

| Tipo | Descrição | Exemplo |
|---|---|---|
| `CAIXA` | Kit fechado pronto para uso ou presente | Box Aura — Kit Velas Aromáticas |
| `COMBO` | Duas ou mais caixas com apelo de experiência | Combo Night Out em Casa |
| `AVULSO` | Insumo de reposição, gera recompra recorrente | Refil de Cera de Soja 500g |

---

## 2. Requisitos Funcionais (RF)

### 2.0 Arquitetura de acesso

| Código | Requisito | Onde foi implementado |
|---|---|---|
| RF00 | O sistema deve iniciar pela tela de login, que é a porta de entrada única | `index.html` |
| RF00a | Após autenticar, o usuário de nível `USER` deve ser direcionado para a loja | `js/login.js → telaInicial()` |
| RF00b | Após autenticar, o usuário de nível `ADMIN` deve ser direcionado para o painel com o CRUD completo | `js/login.js → telaInicial()` |
| RF00c | A barra de navegação deve mostrar módulos diferentes conforme o nível de acesso | `js/config.js → montarNavegacao()` |

### 2.1 Usuário e Autenticação

| Código | Requisito | Onde foi implementado |
|---|---|---|
| RF01 | O sistema deve permitir o cadastro de clientes com nome, e-mail, senha, CPF, telefone e endereço completo | `POST /usuarios` |
| RF02 | O sistema deve validar o CPF matematicamente pela fórmula dos dígitos verificadores antes de gravar | `utils/validacao.js` (back) e `js/validacao.js` (front) |
| RF03 | O sistema deve autocompletar rua, bairro, cidade e UF a partir do CEP, consumindo a API do ViaCEP | `js/validacao.js → buscarCEP()` |
| RF04 | O sistema deve criptografar a senha antes de gravar no banco | `utils/bcrypt.js` |
| RF05 | O sistema deve autenticar o usuário por e-mail e senha, devolvendo um token JWT | `POST /login` |
| RF06 | O sistema deve permitir a consulta e a atualização dos dados cadastrais do usuário logado | `GET /usuarios/perfil`, `PUT` e `PATCH /usuarios/:id` |
| RF07 | O sistema deve permitir dois níveis de acesso: `USER` (cliente) e `ADMIN` (administrador) | campo `nivel_acesso` |
| RF08 | O administrador deve conseguir listar, consultar, ativar/desativar e apagar clientes | `GET /usuarios`, `PATCH` e `DELETE /usuarios/:id` |

### 2.2 Catálogo

| Código | Requisito | Onde foi implementado |
|---|---|---|
| RF09 | A API deve expor a listagem de produtos como endpoint público | `GET /produtos` |
| RF10 | A listagem de produtos deve carregar automaticamente ao abrir a tela, em formato de Cards com imagem, nome, categoria e preço | `js/loja.js`, `js/catalogo.js`, `js/componentes.js` |
| RF11 | O sistema deve permitir buscar produtos por código ou por nome | `GET /produtos/buscar?s=` e `GET /produtos/:id` |
| RF12 | O sistema deve permitir filtrar produtos por categoria, tipo, nível de dificuldade e tempo de projeto | `GET /produtos?categoria_id=&tipo=&nivel=&tempo=` |
| RF13 | O administrador deve conseguir cadastrar, atualizar (completo e parcial) e apagar produtos | `POST`, `PUT`, `PATCH`, `DELETE /produtos` |
| RF14 | O sistema deve manter categorias de hobby cadastráveis | CRUD `/categorias` |

### 2.3 Carrinho e "Monte Sua Caixa"

| Código | Requisito | Onde foi implementado |
|---|---|---|
| RF15 | O carrinho deve viver no navegador do cliente, sem gravar no banco antes do checkout | `js/carrinho.js` com LocalStorage |
| RF16 | O carrinho deve persistir entre visitas usando LocalStorage | chave `diybello_carrinho` |
| RF17 | O sistema deve oferecer um construtor de kit em 4 etapas (tema → itens básicos → extras → embalagem e cartão) | `html/monteSuaCaixa.html` |
| RF18 | O construtor deve recalcular o preço total em tempo real conforme o cliente marca e desmarca itens | `js/monteSuaCaixa.js → desenharResumo()` |

### 2.4 Estoque

| Código | Requisito | Onde foi implementado |
|---|---|---|
| RF19 | Só é possível adicionar ao carrinho se houver quantidade disponível | `js/carrinho.js → adicionarAoCarrinho()` |
| RF20 | Se o estoque for igual a zero, o sistema deve exibir um alerta bloqueando a ação | mesmo ponto + botão desabilitado no card |
| RF21 | Ao finalizar o pedido, o estoque deve ser deduzido automaticamente | `service/pedido.service.js` (dentro da transação) |
| RF22 | O administrador deve conseguir dar entrada e saída manual no estoque | `POST /estoque` |
| RF23 | Toda movimentação deve registrar saldo anterior, saldo posterior e motivo | tabela `estoques` |
| RF24 | O cancelamento de um pedido deve devolver os itens ao estoque | `DELETE /pedidos/:id` |

### 2.5 Pedido e Entrega

| Código | Requisito | Onde foi implementado |
|---|---|---|
| RF25 | A conversão do carrinho em venda só pode ocorrer com o usuário logado | `POST /pedidos` + `authMiddleware` |
| RF26 | O pedido deve gravar os itens comprados com o preço congelado no momento da compra | tabela `itens_pedido` |
| RF27 | Todo pedido deve gerar automaticamente um registro de entrega com código de rastreio | `service/pedido.service.js` |
| RF28 | O cliente deve conseguir consultar o histórico de compras e o status da entrega | `GET /pedidos/meus-pedidos` |
| RF29 | O administrador deve conseguir alterar o status do pedido e o status da entrega | `PATCH /pedidos/:id` e `PATCH /entregas/:id` |

### 2.6 Relatórios

| Código | Requisito | Onde foi implementado |
|---|---|---|
| RF30 | O sistema deve apresentar um relatório de vendas por categoria de hobby em gráfico | `GET /relatorios/vendas` + Chart.js |
| RF31 | O sistema deve apresentar o faturamento mensal em gráfico de linhas | `GET /relatorios/vendas` + Chart.js |
| RF32 | O sistema deve apresentar o saldo de estoque por produto em gráfico de barras | `GET /relatorios/estoque` + Chart.js |
| RF33 | O sistema deve destacar os produtos com estoque baixo (5 unidades ou menos) | `relatorio.service.js → estoque_baixo` |

---

## 3. Requisitos Não-Funcionais (RNF)

| Código | Requisito |
|---|---|
| RNF01 | O backend deve ser desenvolvido em Node.js com Express e Sequelize sobre MySQL |
| RNF02 | O frontend deve usar HTML, CSS e JavaScript puro, consumindo a API no padrão REST |
| RNF03 | A interface deve ser responsiva, adaptando-se a celular (390x844 px) e desktop (1366x768 px) |
| RNF04 | As senhas devem ser armazenadas com hash bcrypt, nunca em texto puro |
| RNF05 | A senha nunca pode ser devolvida em nenhuma resposta da API |
| RNF06 | As rotas privadas devem exigir o cabeçalho `Authorization: Bearer <TOKEN_JWT>` |
| RNF07 | Token ausente, inválido ou expirado deve retornar HTTP 401; nível de acesso insuficiente deve retornar HTTP 403 |
| RNF08 | O token JWT deve expirar em 8 horas |
| RNF09 | O backend deve verificar a existência prévia dos dados antes de qualquer manipulação |
| RNF10 | Operações que alteram várias tabelas ao mesmo tempo devem usar transação, garantindo o rollback em caso de erro |
| RNF11 | O backend deve ser publicado no Railway e o frontend no Vercel |
| RNF12 | A API deve aceitar requisições de outra origem (CORS habilitado) |
| RNF13 | Toda mensagem de erro deve ser devolvida em português e ser compreensível para o usuário final |
| RNF14 | A navegação principal deve estar sempre acessível no topo de todas as telas |

---

## 4. Regras de Negócio (RN)

### RN01 — Níveis de acesso
O sistema possui dois níveis: `USER` (cliente) e `ADMIN` (administrador da loja).
O e-mail configurado na variável `ADMIN_EMAIL` recebe o nível `ADMIN` automaticamente no cadastro. Todos os demais nascem como `USER`.

### RN02 — CPF único e válido
O CPF é obrigatório, deve passar na validação matemática dos dois dígitos verificadores e não pode se repetir entre usuários. Sequências como `111.111.111-11` são rejeitadas.

### RN03 — E-mail único
Não podem existir dois usuários com o mesmo e-mail. Verificado no cadastro (`POST`) e na atualização (`PUT`/`PATCH`).

### RN04 — Endereço obrigatório
O cadastro só é concluído com CEP, rua, número, bairro, cidade e UF preenchidos. O CEP dispara a consulta ao ViaCEP, que preenche os demais campos automaticamente.

### RN05 — Senha mínima
A senha deve ter no mínimo 8 caracteres e é sempre criptografada com bcrypt (10 salt rounds).

### RN06 — Bloqueio por estoque zerado
Um produto com `estoque_atual = 0` não pode ser adicionado ao carrinho. O card exibe a etiqueta "Esgotado", o botão fica desabilitado e a tentativa de compra é bloqueada com alerta.

### RN07 — Estoque nunca negativo
Nenhuma operação (venda, saída manual ou correção) pode deixar o saldo do produto abaixo de zero. A operação é recusada com mensagem informando o saldo disponível.

### RN08 — Preço vem sempre do banco
No checkout, o backend ignora o preço enviado pelo frontend e recalcula tudo com o preço atual do produto no banco. Isso impede a manipulação de valores pelo navegador.

### RN09 — Regras de desconto

| Regra | Condição | Desconto |
|---|---|---|
| Desconto por quantidade | 3 itens ou mais no carrinho | 5% |
| Desconto por valor | Subtotal acima de R$ 300,00 | 10% |
| Cupom BEMVINDO10 | Cupom da primeira compra | 10% |
| Cupom DIY15 | Cupom promocional | 15% |

- Os descontos **por quantidade** e **por valor** não acumulam entre si: vale sempre o maior.
- O **cupom soma** com a melhor regra automática (ex.: R$ 350 com 4 itens + BEMVINDO10 = 10% + 10% = 20%).
- Cupom inexistente é recusado com HTTP 400.

### RN10 — Frete
Frete fixo de R$ 24,90. **Grátis** quando o subtotal já com desconto atingir R$ 250,00 ou mais.

### RN11 — Fórmula do total
```
total = (subtotal - desconto) + frete
```
O subtotal é a soma de `preco_unitario × quantidade` de cada item.

### RN12 — Checkout exige login
A conversão do carrinho (LocalStorage) em um registro real de venda só acontece com token JWT válido. Sem login, o cliente é redirecionado para a tela de entrar.

### RN13 — Item único por pedido
O mesmo produto não pode aparecer duas vezes no mesmo pedido — a quantidade é somada. Garantido por índice único composto `(pedido_id, produto_id)`.

### RN14 — Preço congelado no histórico
O `ItemPedido` guarda `nome_produto` e `preco_unitario` do momento da compra. Se o produto mudar de preço ou for desativado depois, o histórico do cliente permanece correto.

### RN15 — Entrega automática
Todo pedido gera automaticamente uma entrega com:
- status inicial `PREPARANDO`;
- código de rastreio no padrão `DIY000000001BR`;
- endereço copiado do cadastro do cliente;
- previsão de entrega de 7 dias corridos.

### RN16 — Ciclo de vida da entrega
`PREPARANDO → EM_TRANSITO → ENTREGUE`, com `CANCELADA` como desvio. Ao marcar `ENTREGUE`, o sistema grava a data real da entrega. Uma entrega já concluída não pode ser apagada.

### RN17 — Cancelamento devolve o estoque
Ao cancelar um pedido, cada item volta ao saldo do produto e é registrada uma movimentação de `ENTRADA` com o motivo do estorno.

### RN18 — Produto vendido não é apagado
Um produto que já possui vendas registradas não pode ser excluído — ele é apenas **desativado** (`status = false`), sumindo da vitrine pública mas continuando visível para o administrador e nos históricos.

### RN19 — Categoria com produtos não é apagada
Uma categoria só pode ser excluída se não houver nenhum produto vinculado a ela.

### RN20 — Rastreabilidade do estoque
Toda alteração de saldo gera um registro na tabela `estoques` contendo tipo, quantidade, saldo anterior, saldo posterior e motivo — seja ela manual (admin), por venda ou por estorno.

### RN21 — O cliente só enxerga o que é dele
Um cliente só pode consultar, atualizar ou apagar a própria conta, os próprios pedidos e as próprias entregas. O administrador enxerga tudo.

---

## 5. Casos de Uso

### Atores
- **Visitante** — só acessa o login e o cadastro de conta
- **Cliente (USER)** — visitante autenticado
- **Administrador (ADMIN)** — gerencia catálogo, estoque, vendas e relatórios
- **ViaCEP** — sistema externo consultado no preenchimento do endereço

### Lista de casos de uso

| ID | Caso de uso | Ator |
|---|---|---|
| UC01 | Navegar na loja | Cliente |
| UC02 | Buscar e filtrar produtos | Cliente |
| UC03 | Consultar detalhe do produto | Cliente |
| UC04 | Gerenciar carrinho (LocalStorage) | Cliente |
| UC05 | Montar caixa personalizada (wizard) | Cliente |
| UC06 | Criar conta (inclui UC07 e UC08) | Visitante |
| UC07 | Validar CPF | (incluído por UC06) |
| UC08 | Autocompletar endereço | ViaCEP |
| UC09 | Fazer login | Visitante |
| UC10 | Finalizar pedido (estende UC04) | Cliente |
| UC11 | Consultar histórico de pedidos | Cliente |
| UC12 | Rastrear entrega | Cliente |
| UC13 | Atualizar perfil | Cliente |
| UC14 | Gerenciar catálogo de produtos | Administrador |
| UC15 | Gerenciar categorias | Administrador |
| UC16 | Movimentar estoque | Administrador |
| UC17 | Gerenciar pedidos e entregas | Administrador |
| UC18 | Gerenciar clientes | Administrador |
| UC19 | Visualizar relatórios gerenciais | Administrador |

Os diagramas (classes UML e casos de uso) estão em `docs/02-diagramas.md`.
