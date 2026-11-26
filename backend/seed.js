require('dotenv').config()

const {
    Usuario,
    Categoria,
    Produto,
    Estoque,
    Pedido,
    ItemPedido,
    Entrega
} = require('./model/rel')

const db = require('./db/conn')
const { hashSenha } = require('./utils/bcrypt')
const { gerarSlug, arredondar } = require('./utils/function')

// ==========================================================
// |  CARGA INICIAL DA LOJA DIYBELLO                        |
// ==========================================================

const CATEGORIAS = [
    {
        nome: 'Aroma & Velas',
        descricao: 'Kits de velas aromáticas botânicas, ceras vegetais, essências e pavios de algodão.',
        imagem_url: '/img/aromaVelas.png'
    },
    {
        nome: 'Cerâmica & Escultura',
        descricao: 'Argila que seca ao ar, estecas, tintas e vernizes para modelagem sem forno.',
        imagem_url: '/img/ceramicasEsculturas.png'
    },
    {
        nome: 'Pintura',
        descricao: 'Aquarela, telas, cavaletes e papéis de alta gramatura para desconectar das telas.',
        imagem_url: '/img/pinturaCapa.png'
    },
    {
        nome: 'Macramê',
        descricao: 'Cordões de algodão ecológico, argolas de madeira e guias de nós no estilo boho chic.',
        imagem_url: '/img/macrame.png'
    },
    {
        nome: 'Jardinagem & Terrários',
        descricao: 'Mini ecossistemas em vidro, substratos, mudas e ferramentas de montagem.',
        imagem_url: '/img/jardinagem.png'
    }
]

const PRODUTOS = [
    // idx 0
    {
        nome: 'Box Aura - Kit Velas Aromáticas Botânicas',
        categoria: 'Aroma & Velas', tipo: 'CAIXA', nivel: 'INICIANTE',
        tempo_minutos: 45, preco: 189.90, estoque_atual: 30,
        imagem_url: '/img/kitVela.png',
        descricao: 'Relaxamento, autocuidado e momentos de spa em casa. Resultado: 2 velas aromáticas personalizadas em potes de vidro. Vem na caixa: 300g de cera vegetal de soja, 2 potes de vidro âmbar com tampa de madeira, 2 pavios de algodão com ilhós, 1 frasco de essência concentrada de Lavanda e Baunilha, kit de flores secas de alfazema e jasmim, termômetro culinário e espátula de madeira.'
    },
    // idx 1
    {
        nome: 'Box Terra - Kit Escultura em Cerâmica Fria',
        categoria: 'Cerâmica & Escultura', tipo: 'CAIXA', nivel: 'INTERMEDIARIO',
        tempo_minutos: 120, preco: 219.90, estoque_atual: 8,
        imagem_url: '/img/ceramicaFria.png',
        descricao: 'Criatividade, modelagem tátil e decoração minimalista. Resultado: porta-joias, mini travessas ou suportes para incenso. Vem na caixa: 1 kg de argila que seca ao ar sem precisar de forno, jogo com 5 estecas, estojo com 6 cores de tinta acrílica em tons terrosos e pastel, 2 pincéis, 1 verniz brilhante impermeabilizante e lixa fina de acabamento.'
    },
    // idx 2
    {
        nome: 'Kit Básico de Cerâmica',
        categoria: 'Cerâmica & Escultura', tipo: 'COMBO', nivel: 'INICIANTE',
        tempo_minutos: 60, preco: 129.90, estoque_atual: 30,
        imagem_url: '/img/kitBasicoCeramica.png',
        descricao: 'O primeiro passo para quem quer experimentar cerâmica sem complicação. Resultado: 1 peça pequena modelada à mão — potinho, porta-anel ou pingente. Vem na caixa: 400g de argila que seca ao ar, 3 estecas essenciais, 4 cores de tinta acrílica, 1 pincel e 1 verniz fosco de acabamento.'
    },
    // idx 3
    {
        nome: 'Box Cores & Brisa - Kit Pintura Aquarela',
        categoria: 'Pintura', tipo: 'CAIXA', nivel: 'INICIANTE',
        tempo_minutos: 60, preco: 199.90, estoque_atual: 28,
        imagem_url: '/img/pinturaAquarela.png',
        descricao: 'Desconexão das telas, arte expressiva e hobby relaxante. Resultado: 2 quadros pintados à mão prontos para expor. Vem na caixa: 1 mini cavalete de mesa em madeira, 2 telas pequenas de 15x20 cm, estojo de tinta aquarela com 12 cores, kit com 3 pincéis de cerdas macias, godê para misturar tintas e bloco com 5 folhas de papel aquarela de 300g.'
    },
    // idx 4
    {
        nome: 'Box Nó & Poesia - Kit Macramê Suporte de Plantas',
        categoria: 'Macramê', tipo: 'CAIXA', nivel: 'INTERMEDIARIO',
        tempo_minutos: 90, preco: 149.90, estoque_atual: 7,
        imagem_url: '/img/kitMacrame.png',
        descricao: 'Decoração estilo boho chic e plantas em casa. Resultado: 1 suporte suspenso feito de nós para vasos de plantas. Vem na caixa: rolo com 30 metros de cordão de algodão ecológico de 4mm, 1 argola principal de madeira natural, 1 gancho em S para pendurar enquanto trança, fita métrica e guia impresso e ilustrado com os 3 nós básicos.'
    },
    // idx 5
    {
        nome: 'Box EcoVida - Kit Mini Terrário Fechado',
        categoria: 'Jardinagem & Terrários', tipo: 'CAIXA', nivel: 'INICIANTE',
        tempo_minutos: 40, preco: 169.90, estoque_atual: 25,
        imagem_url: '/img/boxEcoVida.png',
        descricao: 'Contato com a natureza e criação de um ecossistema próprio. Resultado: um mini jardim autossustentável dentro do vidro. Vem na caixa: 1 pote de vidro artesanal grande com tampa de cortiça, cascalho e pedra vulcânica para drenagem, carvão ativado e substrato vegetal especial, 2 mudas de mini plantas (fitônias e musgo vivo), pinça longa de montagem e mini borrifador de água.'
    },
    // idx 6
    {
        nome: 'Combo Night Out em Casa',
        categoria: 'Aroma & Velas', tipo: 'COMBO', nivel: 'INTERMEDIARIO',
        tempo_minutos: 165, preco: 379.90, estoque_atual: 10,
        imagem_url: '/img/sessaofinal.png',
        descricao: 'União da Box Aura com a Box Terra. A experiência perfeita para um encontro a dois ou uma noite com os amigos: velas aromáticas para o clima e cerâmica fria para criar junto.'
    },
    // idx 7
    {
        nome: 'Combo Mestre Criativo',
        categoria: 'Pintura', tipo: 'COMBO', nivel: 'INTERMEDIARIO',
        tempo_minutos: 180, preco: 399.90, estoque_atual: 9,
        imagem_url: '/img/pintura.png',
        descricao: 'Junta a Box Cores & Brisa com a Box Terra e ainda inclui um avental de algodão cru exclusivo com a marca DIYBELLO. Para quem quer levar o hobby a sério.'
    },
    // idx 8
    {
        nome: 'Combo Urban Jungle',
        categoria: 'Jardinagem & Terrários', tipo: 'COMBO', nivel: 'INTERMEDIARIO',
        tempo_minutos: 130, preco: 299.90, estoque_atual: 22,
        imagem_url: '/img/comboUrbanJungle.png',
        descricao: 'Combina a Box EcoVida e a Box Nó & Poesia para quem quer renovar a decoração da casa com plantas e nós artesanais.'
    },
    // idx 9
    {
        nome: 'Refil de Cera de Soja 500g',
        categoria: 'Aroma & Velas', tipo: 'AVULSO', nivel: 'INICIANTE',
        tempo_minutos: 20, preco: 44.90, estoque_atual: 80,
        imagem_url: '/img/refilCeraDeSoja.png',
        descricao: 'Cera 100% vegetal para derreter e reaproveitar seus potes. Rende aproximadamente 3 velas médias.'
    },
    // idx 10
    {
        nome: 'Essência Concentrada 30ml',
        categoria: 'Aroma & Velas', tipo: 'AVULSO', nivel: 'INICIANTE',
        tempo_minutos: 5, preco: 29.90, estoque_atual: 100,
        imagem_url: '/img/essenciaConcentrada.png',
        descricao: 'Essência concentrada para velas. Opções disponíveis: Lavanda, Alecrim, Baunilha ou Bambu.'
    },
    // idx 11
    {
        nome: 'Pote de Vidro Âmbar 200ml',
        categoria: 'Aroma & Velas', tipo: 'AVULSO', nivel: 'INICIANTE',
        tempo_minutos: 5, preco: 24.90, estoque_atual: 60,
        imagem_url: '/img/poteVidroAmbar.png',
        descricao: 'Frasco de vidro âmbar de 200ml com tampa de madeira, ideal para velas e organização.'
    },
    // idx 12
    {
        nome: 'Argila Sem Forno 1kg',
        categoria: 'Cerâmica & Escultura', tipo: 'AVULSO', nivel: 'INICIANTE',
        tempo_minutos: 30, preco: 39.90, estoque_atual: 70,
        imagem_url: '/img/argilaForno1kg.png',
        descricao: 'Argila de secagem ao ar livre, não precisa de forno. Textura macia e fácil de modelar.'
    },
    // idx 13
    {
        nome: 'Kit Estecas 5 peças',
        categoria: 'Cerâmica & Escultura', tipo: 'AVULSO', nivel: 'INTERMEDIARIO',
        tempo_minutos: 10, preco: 34.90, estoque_atual: 50,
        imagem_url: '/img/kitEstecas5.png',
        descricao: 'Ferramentas profissionais para esculpir, cortar e detalhar suas peças de cerâmica fria.'
    },
    // idx 14
    {
        nome: 'Verniz Impermeabilizante 100ml',
        categoria: 'Cerâmica & Escultura', tipo: 'AVULSO', nivel: 'INICIANTE',
        tempo_minutos: 10, preco: 27.90, estoque_atual: 55,
        imagem_url: '/img/vernizImperb.png',
        descricao: 'Acabamento brilhante que impermeabiliza e protege as peças finalizadas.'
    },
    // idx 15
    {
        nome: 'Bloco Papel Aquarela 300g A4',
        categoria: 'Pintura', tipo: 'AVULSO', nivel: 'INICIANTE',
        tempo_minutos: 5, preco: 49.90, estoque_atual: 45,
        imagem_url: '/img/blocoPapelAquarela.png',
        descricao: 'Bloco A4 com 12 folhas de alta gramatura, textura própria para aquarela.'
    },
    // idx 16
    {
        nome: 'Mini Cavalete de Mesa',
        categoria: 'Pintura', tipo: 'AVULSO', nivel: 'INICIANTE',
        tempo_minutos: 5, preco: 59.90, estoque_atual: 40,
        imagem_url: '/img/miniCavalete.png',
        descricao: 'Suporte em madeira natural para telas de até 30 cm. Dobrável e leve.'
    },
    // idx 17
    {
        nome: 'Cordão de Algodão 4mm 50m',
        categoria: 'Macramê', tipo: 'AVULSO', nivel: 'INICIANTE',
        tempo_minutos: 5, preco: 69.90, estoque_atual: 45,
        imagem_url: '/img/cordaoDeAlgodao.png',
        descricao: 'Rolo de 50 metros de cordão de algodão ecológico de 4mm para trançar macramê.'
    }
]

const USUARIOS = [
    // idx 0 - ADMIN
    {
        nome: 'Administrador DIYBELLO',
        email: 'admin@diybello.com', senha: 'admin123456',
        cpf: '11144477735', telefone: '11988887777',
        cep: '01001000', rua: 'Praça da Sé', numero: '100',
        complemento: 'Loja DIYBELLO', bairro: 'Sé',
        cidade: 'São Paulo', uf: 'SP', nivel_acesso: 'ADMIN'
    },
    // idx 1 - CLIENTE TESTE
    {
        nome: 'Cliente Teste',
        email: 'cliente@diybello.com', senha: 'cliente123',
        cpf: '52998224725', telefone: '11977776666',
        cep: '01310100', rua: 'Avenida Paulista', numero: '1578',
        complemento: 'Apto 42', bairro: 'Bela Vista',
        cidade: 'São Paulo', uf: 'SP', nivel_acesso: 'USER'
    },
    // idx 2
    {
        nome: 'Ana Carolina Souza',
        email: 'ana.souza@gmail.com', senha: 'senha123',
        cpf: '12345678909', telefone: '11991234567',
        cep: '04547130', rua: 'Rua Funchal', numero: '418',
        complemento: 'Apto 71', bairro: 'Vila Olímpia',
        cidade: 'São Paulo', uf: 'SP', nivel_acesso: 'USER'
    },
    // idx 3
    {
        nome: 'Beatriz Lima',
        email: 'beatriz.lima@hotmail.com', senha: 'senha123',
        cpf: '98765432100', telefone: '21987654321',
        cep: '22250040', rua: 'Rua Voluntários da Pátria', numero: '190',
        complemento: '', bairro: 'Botafogo',
        cidade: 'Rio de Janeiro', uf: 'RJ', nivel_acesso: 'USER'
    },
    // idx 4
    {
        nome: 'Camila Ferreira',
        email: 'camila.ferreira@outlook.com', senha: 'senha123',
        cpf: '45678901234', telefone: '11998765432',
        cep: '01415000', rua: 'Rua Oscar Freire', numero: '900',
        complemento: 'Apto 32', bairro: 'Jardins',
        cidade: 'São Paulo', uf: 'SP', nivel_acesso: 'USER'
    },
    // idx 5
    {
        nome: 'Diego Alves',
        email: 'diego.alves@gmail.com', senha: 'senha123',
        cpf: '78901234567', telefone: '31976543210',
        cep: '30140071', rua: 'Rua da Bahia', numero: '1148',
        complemento: '', bairro: 'Centro',
        cidade: 'Belo Horizonte', uf: 'MG', nivel_acesso: 'USER'
    },
    // idx 6
    {
        nome: 'Fernanda Costa',
        email: 'fernanda.costa@gmail.com', senha: 'senha123',
        cpf: '23456789012', telefone: '11994321876',
        cep: '04711130', rua: 'Avenida das Nações Unidas', numero: '12995',
        complemento: 'Bloco B', bairro: 'Brooklin',
        cidade: 'São Paulo', uf: 'SP', nivel_acesso: 'USER'
    },
    // idx 7
    {
        nome: 'Gabriel Martins',
        email: 'gabriel.martins@uol.com.br', senha: 'senha123',
        cpf: '34567890123', telefone: '11993216547',
        cep: '05407002', rua: 'Rua Augusta', numero: '2345',
        complemento: '', bairro: 'Consolação',
        cidade: 'São Paulo', uf: 'SP', nivel_acesso: 'USER'
    },
    // idx 8
    {
        nome: 'Helena Rodrigues',
        email: 'helena.rodrigues@gmail.com', senha: 'senha123',
        cpf: '56789012345', telefone: '48991234567',
        cep: '88010400', rua: 'Rua Esteves Júnior', numero: '100',
        complemento: 'Apto 15', bairro: 'Centro',
        cidade: 'Florianópolis', uf: 'SC', nivel_acesso: 'USER'
    },
    // idx 9
    {
        nome: 'Igor Santos',
        email: 'igor.santos@gmail.com', senha: 'senha123',
        cpf: '67890123456', telefone: '11992345678',
        cep: '01525000', rua: 'Rua da Liberdade', numero: '510',
        complemento: '', bairro: 'Liberdade',
        cidade: 'São Paulo', uf: 'SP', nivel_acesso: 'USER'
    },
    // idx 10
    {
        nome: 'Juliana Pereira',
        email: 'juliana.pereira@terra.com.br', senha: 'senha123',
        cpf: '89012345678', telefone: '51987654321',
        cep: '90040060', rua: 'Rua dos Andradas', numero: '736',
        complemento: 'Sala 302', bairro: 'Centro Histórico',
        cidade: 'Porto Alegre', uf: 'RS', nivel_acesso: 'USER'
    },
    // idx 11
    {
        nome: 'Leonardo Carvalho',
        email: 'leo.carvalho@gmail.com', senha: 'senha123',
        cpf: '90123456789', telefone: '11991237654',
        cep: '02033000', rua: 'Avenida Cruzeiro do Sul', numero: '1400',
        complemento: 'Apto 94', bairro: 'Santana',
        cidade: 'São Paulo', uf: 'SP', nivel_acesso: 'USER'
    }
]

// ==========================================================
// |  PEDIDOS HISTÓRICOS (6 meses)                          |
// |  [usuario_idx, dias_atras, [[produto_idx, qtd], ...],  |
// |   cupom, forma_pagamento, status, entrega_status]      |
// ==========================================================
const PEDIDOS_DADOS = [
    // ---- JUNHO (dias 146-175) ----
    [2,  170, [[0,1]],           null,       'PIX',    'PAGO',      'ENTREGUE'],
    [3,  168, [[3,1],[15,1]],    null,       'CARTAO', 'PAGO',      'ENTREGUE'],
    [4,  165, [[6,1]],           'BEMVINDO10','PIX',   'PAGO',      'ENTREGUE'],
    [5,  163, [[1,1],[12,1]],    null,       'BOLETO', 'PAGO',      'ENTREGUE'],
    [6,  158, [[4,1],[17,1]],    null,       'PIX',    'PAGO',      'ENTREGUE'],
    [7,  152, [[5,1]],           null,       'CARTAO', 'PAGO',      'ENTREGUE'],
    // ---- JULHO (dias 115-145) ----
    [8,  142, [[0,1],[9,1]],     null,       'PIX',    'PAGO',      'ENTREGUE'],
    [9,  139, [[7,1]],           'BEMVINDO10','PIX',   'PAGO',      'ENTREGUE'],
    [10, 136, [[3,1]],           null,       'CARTAO', 'PAGO',      'ENTREGUE'],
    [11, 133, [[2,1],[12,1],[14,1]], null,   'PIX',    'PAGO',      'ENTREGUE'],
    [2,  130, [[4,1],[17,1]],    null,       'BOLETO', 'PAGO',      'ENTREGUE'],
    [3,  127, [[8,1]],           'DIY15',    'PIX',    'PAGO',      'ENTREGUE'],
    [4,  123, [[0,1],[10,1]],    null,       'CARTAO', 'PAGO',      'ENTREGUE'],
    [5,  118, [[5,1]],           null,       'PIX',    'CANCELADO', 'CANCELADA'],
    // ---- AGOSTO (dias 84-114) ----
    [6,  112, [[3,1],[16,1]],    null,       'PIX',    'PAGO',      'ENTREGUE'],
    [7,  109, [[6,1]],           'BEMVINDO10','CARTAO','PAGO',      'ENTREGUE'],
    [8,  106, [[0,1],[9,2]],     null,       'PIX',    'PAGO',      'ENTREGUE'],
    [9,  103, [[1,1],[14,1]],    null,       'BOLETO', 'PAGO',      'ENTREGUE'],
    [10, 100, [[7,1]],           'DIY15',    'PIX',    'PAGO',      'ENTREGUE'],
    [11,  97, [[4,1],[17,1]],    null,       'CARTAO', 'PAGO',      'ENTREGUE'],
    [2,   94, [[2,1],[12,2]],    null,       'PIX',    'PAGO',      'ENTREGUE'],
    [3,   91, [[8,1]],           null,       'PIX',    'PAGO',      'ENTREGUE'],
    [4,   88, [[3,1],[15,1]],    'BEMVINDO10','CARTAO','PAGO',      'ENTREGUE'],
    [5,   85, [[5,1],[11,2]],    null,       'PIX',    'PAGO',      'ENTREGUE'],
    // ---- SETEMBRO (dias 54-83) ----
    [6,   82, [[0,1],[10,2]],    null,       'PIX',    'PAGO',      'ENTREGUE'],
    [7,   79, [[7,1]],           'DIY15',    'CARTAO', 'PAGO',      'ENTREGUE'],
    [8,   76, [[3,1],[16,1]],    null,       'PIX',    'PAGO',      'ENTREGUE'],
    [9,   73, [[1,1],[14,1],[12,1]], null,   'BOLETO', 'PAGO',      'ENTREGUE'],
    [10,  70, [[6,1]],           'BEMVINDO10','PIX',   'PAGO',      'ENTREGUE'],
    [11,  67, [[4,1]],           null,       'CARTAO', 'PAGO',      'ENTREGUE'],
    [2,   64, [[0,1],[9,1]],     null,       'PIX',    'PAGO',      'ENTREGUE'],
    [3,   61, [[8,1]],           null,       'PIX',    'PAGO',      'ENTREGUE'],
    [4,   58, [[2,1],[13,1]],    null,       'CARTAO', 'PAGO',      'ENTREGUE'],
    [5,   55, [[5,1],[17,1]],    null,       'PIX',    'CANCELADO', 'CANCELADA'],
    // ---- OUTUBRO (dias 23-53) ----
    [6,   51, [[3,1],[15,2]],    'BEMVINDO10','PIX',   'PAGO',      'ENTREGUE'],
    [7,   48, [[7,1]],           'DIY15',    'CARTAO', 'PAGO',      'ENTREGUE'],
    [8,   46, [[0,2]],           null,       'PIX',    'PAGO',      'ENTREGUE'],
    [9,   43, [[6,1]],           null,       'BOLETO', 'PAGO',      'ENTREGUE'],
    [10,  40, [[1,1],[12,1],[14,1]], null,   'PIX',    'PAGO',      'ENTREGUE'],
    [11,  37, [[4,1],[17,1]],    null,       'CARTAO', 'PAGO',      'ENTREGUE'],
    [2,   34, [[3,1],[16,1]],    null,       'PIX',    'PAGO',      'ENTREGUE'],
    [3,   31, [[8,1]],           'BEMVINDO10','PIX',   'PAGO',      'ENTREGUE'],
    [4,   28, [[0,1],[10,2]],    null,       'CARTAO', 'PAGO',      'ENTREGUE'],
    [5,   25, [[2,1],[9,2]],     null,       'PIX',    'PAGO',      'EM_TRANSITO'],
    // ---- NOVEMBRO (dias 0-22) ----
    [6,   21, [[7,1]],           'DIY15',    'PIX',    'PAGO',      'EM_TRANSITO'],
    [7,   19, [[3,1],[15,1]],    null,       'CARTAO', 'PAGO',      'EM_TRANSITO'],
    [8,   17, [[5,1],[11,2]],    null,       'PIX',    'PAGO',      'PREPARANDO'],
    [9,   15, [[0,1]],           'BEMVINDO10','PIX',   'PAGO',      'PREPARANDO'],
    [10,  12, [[1,1],[14,1]],    null,       'BOLETO', 'PAGO',      'PREPARANDO'],
    [11,  10, [[4,1],[17,1]],    null,       'CARTAO', 'PAGO',      'PREPARANDO'],
    [2,    8, [[6,1]],           null,       'PIX',    'PAGO',      'PREPARANDO'],
    [3,    6, [[3,1],[16,1]],    null,       'PIX',    'PENDENTE',  'PREPARANDO'],
    [4,    4, [[0,1],[9,1]],     null,       'CARTAO', 'PENDENTE',  'PREPARANDO'],
    [5,    2, [[8,1]],           'DIY15',    'PIX',    'PENDENTE',  'PREPARANDO'],
    [1,    1, [[2,1],[12,1]],    null,       'PIX',    'PENDENTE',  'PREPARANDO'],
]

const CUPONS_PCT = { BEMVINDO10: 0.10, DIY15: 0.15 }
const FRETE_GRATIS_ACIMA = 250

function calcularTotais(itens, cupom) {
    const subtotal = arredondar(itens.reduce((s, i) => s + i.preco * i.qtd, 0))
    const qtdTotal = itens.reduce((s, i) => s + i.qtd, 0)

    let pctAuto = 0
    if (qtdTotal >= 3) pctAuto = 0.05
    if (subtotal >= 300 && 0.10 > pctAuto) pctAuto = 0.10

    const pctCupom = (cupom && CUPONS_PCT[cupom]) ? CUPONS_PCT[cupom] : 0
    const desconto = arredondar(subtotal * (pctAuto + pctCupom))
    const totalComDesconto = subtotal - desconto
    const frete = totalComDesconto >= FRETE_GRATIS_ACIMA ? 0 : 24.90
    const total = arredondar(totalComDesconto + frete)

    return { subtotal, desconto, frete, total }
}

async function seed() {
    try {
        console.log('> recriando o banco de dados da DIYBELLO...')
        await db.sync({ force: true })

        // ---------- categorias ----------
        const mapaCategorias = {}
        for (const cat of CATEGORIAS) {
            const criada = await Categoria.create({
                nome: cat.nome, descricao: cat.descricao,
                slug: gerarSlug(cat.nome), imagem_url: cat.imagem_url, status: true
            })
            mapaCategorias[cat.nome] = criada.id
        }
        console.log(`> ${CATEGORIAS.length} categorias cadastradas.`)

        // ---------- produtos + carga inicial de estoque ----------
        const produtosCriados = []
        for (const produto of PRODUTOS) {
            const slug = gerarSlug(produto.nome)
            const criado = await Produto.create({
                nome: produto.nome, descricao: produto.descricao,
                preco: produto.preco, slug,
                tipo: produto.tipo, nivel: produto.nivel,
                tempo_minutos: produto.tempo_minutos,
                estoque_atual: produto.estoque_atual,
                imagem_url: produto.imagem_url || `/img/${slug}.svg`,
                status: true,
                categoria_id: mapaCategorias[produto.categoria]
            })
            await Estoque.create({
                produto_id: criado.id, tipo: 'ENTRADA',
                quantidade: produto.estoque_atual,
                saldo_anterior: 0, saldo_atual: produto.estoque_atual,
                motivo: 'Carga inicial do estoque da loja', data: new Date()
            })
            produtosCriados.push(criado)
        }
        console.log(`> ${PRODUTOS.length} produtos cadastrados com estoque inicial.`)

        // ---------- usuários ----------
        const usuariosCriados = []
        for (const usuario of USUARIOS) {
            const criado = await Usuario.create({ ...usuario, senha: await hashSenha(usuario.senha) })
            usuariosCriados.push(criado)
        }
        console.log(`> ${USUARIOS.length} usuários cadastrados.`)

        // ---------- estoque em memória para movimentações ----------
        const estoqueAtual = {}
        for (const p of produtosCriados) {
            estoqueAtual[p.id] = p.estoque_atual
        }

        // ---------- pedidos históricos ----------
        let totalPedidos = 0
        for (const [uIdx, diasAtras, itensDef, cupom, formaPgto, statusPedido, statusEntrega] of PEDIDOS_DADOS) {

            const usuario = usuariosCriados[uIdx]
            const dataPedido = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000)

            const itensProdutos = itensDef.map(([pIdx, qtd]) => ({
                produto: produtosCriados[pIdx], qtd,
                preco: produtosCriados[pIdx].preco
            }))

            const { subtotal, desconto, frete, total } = calcularTotais(itensProdutos, cupom)

            const pedido = await Pedido.create({
                usuario_id: usuario.id,
                status: statusPedido,
                subtotal, desconto, frete, total,
                cupom: cupom || null,
                forma_pagamento: formaPgto,
                createdAt: dataPedido,
                updatedAt: dataPedido
            })

            for (const { produto, qtd, preco } of itensProdutos) {
                await ItemPedido.create({
                    pedido_id: pedido.id,
                    produto_id: produto.id,
                    nome_produto: produto.nome,
                    quantidade: qtd,
                    preco_unitario: preco,
                    subtotal: arredondar(preco * qtd),
                    createdAt: dataPedido,
                    updatedAt: dataPedido
                })

                if (statusPedido !== 'CANCELADO') {
                    const saldoAnterior = estoqueAtual[produto.id]
                    const novoSaldo = Math.max(0, saldoAnterior - qtd)
                    estoqueAtual[produto.id] = novoSaldo
                    await produto.update({ estoque_atual: novoSaldo })
                    await Estoque.create({
                        produto_id: produto.id, tipo: 'SAIDA',
                        quantidade: qtd,
                        saldo_anterior: saldoAnterior, saldo_atual: novoSaldo,
                        motivo: `Venda do pedido número ${pedido.id}`,
                        data: dataPedido
                    })
                }
            }

            await Entrega.create({
                pedido_id: pedido.id,
                status: statusEntrega,
                codigo_rastreio: `DIY${String(pedido.id).padStart(6, '0')}BR`,
                cep: usuario.cep, rua: usuario.rua, numero: usuario.numero,
                bairro: usuario.bairro, cidade: usuario.cidade, uf: usuario.uf,
                previsao_entrega: new Date(dataPedido.getTime() + 7 * 24 * 60 * 60 * 1000),
                data_entrega: statusEntrega === 'ENTREGUE'
                    ? new Date(dataPedido.getTime() + 5 * 24 * 60 * 60 * 1000)
                    : null,
                createdAt: dataPedido,
                updatedAt: dataPedido
            })

            totalPedidos++
        }
        console.log(`> ${totalPedidos} pedidos históricos criados com itens, estoque e entrega.`)

        console.log('')
        console.log('==============================================')
        console.log(' CARGA CONCLUÍDA - ACESSOS DE TESTE')
        console.log(' ADMIN   -> admin@diybello.com   / admin123456')
        console.log(' CLIENTE -> cliente@diybello.com / cliente123')
        console.log('==============================================')
    } catch (err) {
        console.error('> ERRO ao popular o banco:', err)
    } finally {
        await db.close()
        console.log('> conexão encerrada.')
    }
}

seed()
