require('dotenv').config()

const {
    Usuario,
    Categoria,
    Produto,
    Estoque
} = require('./model/rel')

const db = require('./db/conn')
const { hashSenha } = require('./utils/bcrypt')
const { gerarSlug } = require('./utils/function')

// ==========================================================
// |  CARGA INICIAL DA LOJA DIYBELLO                        |
// |  Cria as categorias de hobby, o catálogo de caixas,    |
// |  os combos, os insumos avulsos e os usuários de teste. |
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
    // ---------------- CAIXAS PRÉ-PRONTAS ----------------
    {
        nome: 'Box Aura - Kit Velas Aromáticas Botânicas',
        categoria: 'Aroma & Velas',
        tipo: 'CAIXA',
        nivel: 'INICIANTE',
        tempo_minutos: 45,
        preco: 189.90,
        estoque_atual: 20,
        imagem_url: '/img/kitVela.png',
        descricao: 'Relaxamento, autocuidado e momentos de spa em casa. Resultado: 2 velas aromáticas personalizadas em potes de vidro. Vem na caixa: 300g de cera vegetal de soja, 2 potes de vidro âmbar com tampa de madeira, 2 pavios de algodão com ilhós, 1 frasco de essência concentrada de Lavanda e Baunilha, kit de flores secas de alfazema e jasmim, termômetro culinário e espátula de madeira.'
    },
    {
        nome: 'Box Terra - Kit Escultura em Cerâmica Fria',
        categoria: 'Cerâmica & Escultura',
        tipo: 'CAIXA',
        nivel: 'INTERMEDIARIO',
        tempo_minutos: 120,
        preco: 219.90,
        estoque_atual: 15,
        imagem_url: '/img/ceramicaFria.png',
        descricao: 'Criatividade, modelagem tátil e decoração minimalista. Resultado: porta-joias, mini travessas ou suportes para incenso. Vem na caixa: 1 kg de argila que seca ao ar sem precisar de forno, jogo com 5 estecas, estojo com 6 cores de tinta acrílica em tons terrosos e pastel, 2 pincéis, 1 verniz brilhante impermeabilizante e lixa fina de acabamento.'
    },
    {
        nome: 'Kit Básico de Cerâmica',
        categoria: 'Cerâmica & Escultura',
        tipo: 'COMBO',
        nivel: 'INICIANTE',
        tempo_minutos: 60,
        preco: 129.90,
        estoque_atual: 20,
        imagem_url: '/img/kitBasicoCeramica.png',
        descricao: 'O primeiro passo para quem quer experimentar cerâmica sem complicação. Resultado: 1 peça pequena modelada à mão — potinho, porta-anel ou pingente. Vem na caixa: 400g de argila que seca ao ar, 3 estecas essenciais, 4 cores de tinta acrílica, 1 pincel e 1 verniz fosco de acabamento.'
    },
    {
        nome: 'Box Cores & Brisa - Kit Pintura Aquarela',
        categoria: 'Pintura',
        tipo: 'CAIXA',
        nivel: 'INICIANTE',
        tempo_minutos: 60,
        preco: 199.90,
        estoque_atual: 18,
        imagem_url: '/img/pinturaAquarela.png',
        descricao: 'Desconexão das telas, arte expressiva e hobby relaxante. Resultado: 2 quadros pintados à mão prontos para expor. Vem na caixa: 1 mini cavalete de mesa em madeira, 2 telas pequenas de 15x20 cm, estojo de tinta aquarela com 12 cores, kit com 3 pincéis de cerdas macias, godê para misturar tintas e bloco com 5 folhas de papel aquarela de 300g.'
    },
    {
        nome: 'Box Nó & Poesia - Kit Macramê Suporte de Plantas',
        categoria: 'Macramê',
        tipo: 'CAIXA',
        nivel: 'INTERMEDIARIO',
        tempo_minutos: 90,
        preco: 149.90,
        estoque_atual: 22,
        imagem_url: '/img/kitMacrame.png',
        descricao: 'Decoração estilo boho chic e plantas em casa. Resultado: 1 suporte suspenso feito de nós para vasos de plantas. Vem na caixa: rolo com 30 metros de cordão de algodão ecológico de 4mm, 1 argola principal de madeira natural, 1 gancho em S para pendurar enquanto trança, fita métrica e guia impresso e ilustrado com os 3 nós básicos.'
    },
    {
        nome: 'Box EcoVida - Kit Mini Terrário Fechado',
        categoria: 'Jardinagem & Terrários',
        tipo: 'CAIXA',
        nivel: 'INICIANTE',
        tempo_minutos: 40,
        preco: 169.90,
        estoque_atual: 16,
        imagem_url: '/img/boxEcoVida.png',
        descricao: 'Contato com a natureza e criação de um ecossistema próprio. Resultado: um mini jardim autossustentável dentro do vidro. Vem na caixa: 1 pote de vidro artesanal grande com tampa de cortiça, cascalho e pedra vulcânica para drenagem, carvão ativado e substrato vegetal especial, 2 mudas de mini plantas (fitônias e musgo vivo), pinça longa de montagem e mini borrifador de água.'
    },

    // ---------------- COMBOS TEMÁTICOS ----------------
    {
        nome: 'Combo Night Out em Casa',
        categoria: 'Aroma & Velas',
        tipo: 'COMBO',
        nivel: 'INTERMEDIARIO',
        tempo_minutos: 165,
        preco: 379.90,
        estoque_atual: 10,
        imagem_url: '/img/sessaofinal.png',
        descricao: 'União da Box Aura com a Box Terra. A experiência perfeita para um encontro a dois ou uma noite com os amigos: velas aromáticas para o clima e cerâmica fria para criar junto.'
    },
    {
        nome: 'Combo Mestre Criativo',
        categoria: 'Pintura',
        tipo: 'COMBO',
        nivel: 'INTERMEDIARIO',
        tempo_minutos: 180,
        preco: 399.90,
        estoque_atual: 8,
        imagem_url: '/img/pintura.png',
        descricao: 'Junta a Box Cores & Brisa com a Box Terra e ainda inclui um avental de algodão cru exclusivo com a marca DIYBELLO. Para quem quer levar o hobby a sério.'
    },
    {
        nome: 'Combo Urban Jungle',
        categoria: 'Jardinagem & Terrários',
        tipo: 'COMBO',
        nivel: 'INTERMEDIARIO',
        tempo_minutos: 130,
        preco: 299.90,
        estoque_atual: 12,
        imagem_url: '/img/comboUrbanJungle.png',
        descricao: 'Combina a Box EcoVida e a Box Nó & Poesia para quem quer renovar a decoração da casa com plantas e nós artesanais.'
    },

    // ---------------- INSUMOS AVULSOS ----------------
    {
        nome: 'Refil de Cera de Soja 500g',
        categoria: 'Aroma & Velas',
        tipo: 'AVULSO',
        nivel: 'INICIANTE',
        tempo_minutos: 20,
        preco: 44.90,
        estoque_atual: 60,
        imagem_url: '/img/refilCeraDeSoja.png',
        descricao: 'Cera 100% vegetal para derreter e reaproveitar seus potes. Rende aproximadamente 3 velas médias.'
    },
    {
        nome: 'Essência Concentrada 30ml',
        categoria: 'Aroma & Velas',
        tipo: 'AVULSO',
        nivel: 'INICIANTE',
        tempo_minutos: 5,
        preco: 29.90,
        estoque_atual: 80,
        imagem_url: '/img/essenciaConcentrada.png',
        descricao: 'Essência concentrada para velas. Opções disponíveis: Lavanda, Alecrim, Baunilha ou Bambu.'
    },
    {
        nome: 'Pote de Vidro Âmbar 200ml',
        categoria: 'Aroma & Velas',
        tipo: 'AVULSO',
        nivel: 'INICIANTE',
        tempo_minutos: 5,
        preco: 24.90,
        estoque_atual: 45,
        imagem_url: '/img/poteVidroAmbar.png',
        descricao: 'Frasco de vidro âmbar de 200ml com tampa de madeira, ideal para velas e organização.'
    },
    {
        nome: 'Argila Sem Forno 1kg',
        categoria: 'Cerâmica & Escultura',
        tipo: 'AVULSO',
        nivel: 'INICIANTE',
        tempo_minutos: 30,
        preco: 39.90,
        estoque_atual: 50,
        imagem_url: '/img/argilaForno1kg.png',
        descricao: 'Argila de secagem ao ar livre, não precisa de forno. Textura macia e fácil de modelar.'
    },
    {
        nome: 'Kit Estecas 5 peças',
        categoria: 'Cerâmica & Escultura',
        tipo: 'AVULSO',
        nivel: 'INTERMEDIARIO',
        tempo_minutos: 10,
        preco: 34.90,
        estoque_atual: 35,
        imagem_url: '/img/kitEstecas5.png',
        descricao: 'Ferramentas profissionais para esculpir, cortar e detalhar suas peças de cerâmica fria.'
    },
    {
        nome: 'Verniz Impermeabilizante 100ml',
        categoria: 'Cerâmica & Escultura',
        tipo: 'AVULSO',
        nivel: 'INICIANTE',
        tempo_minutos: 10,
        preco: 27.90,
        estoque_atual: 40,
        imagem_url: '/img/vernizImperb.png',
        descricao: 'Acabamento brilhante que impermeabiliza e protege as peças finalizadas.'
    },
    {
        nome: 'Bloco Papel Aquarela 300g A4',
        categoria: 'Pintura',
        tipo: 'AVULSO',
        nivel: 'INICIANTE',
        tempo_minutos: 5,
        preco: 49.90,
        estoque_atual: 30,
        imagem_url: '/img/blocoPapelAquarela.png',
        descricao: 'Bloco A4 com 12 folhas de alta gramatura, textura própria para aquarela.'
    },
    {
        nome: 'Mini Cavalete de Mesa',
        categoria: 'Pintura',
        tipo: 'AVULSO',
        nivel: 'INICIANTE',
        tempo_minutos: 5,
        preco: 59.90,
        estoque_atual: 25,
        imagem_url: '/img/miniCavalete.png',
        descricao: 'Suporte em madeira natural para telas de até 30 cm. Dobrável e leve.'
    },
    {
        nome: 'Cordão de Algodão 4mm 50m',
        categoria: 'Macramê',
        tipo: 'AVULSO',
        nivel: 'INICIANTE',
        tempo_minutos: 5,
        preco: 69.90,
        estoque_atual: 28,
        imagem_url: '/img/cordaoDeAlgodao.png',
        descricao: 'Rolo de 50 metros de cordão de algodão ecológico de 4mm para trançar macramê.'
    }
]

const USUARIOS = [
    {
        nome: 'Administrador DIYBELLO',
        email: 'admin@diybello.com',
        senha: 'admin123456',
        cpf: '11144477735',
        telefone: '11988887777',
        cep: '01001000',
        rua: 'Praça da Sé',
        numero: '100',
        complemento: 'Loja DIYBELLO',
        bairro: 'Sé',
        cidade: 'São Paulo',
        uf: 'SP',
        nivel_acesso: 'ADMIN'
    },
    {
        nome: 'Cliente Teste',
        email: 'cliente@diybello.com',
        senha: 'cliente123',
        cpf: '52998224725',
        telefone: '11977776666',
        cep: '01310100',
        rua: 'Avenida Paulista',
        numero: '1578',
        complemento: 'Apto 42',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
        nivel_acesso: 'USER'
    }
]

async function seed() {
    try {
        console.log('> recriando o banco de dados da DIYBELLO...')
        await db.sync({ force: true })

        // ---------- categorias ----------
        const mapaCategorias = {}

        for (const categoria of CATEGORIAS) {
            const criada = await Categoria.create({
                nome: categoria.nome,
                descricao: categoria.descricao,
                slug: gerarSlug(categoria.nome),
                imagem_url: categoria.imagem_url,
                status: true
            })
            mapaCategorias[categoria.nome] = criada.id
        }
        console.log(`> ${CATEGORIAS.length} categorias cadastradas.`)

        // ---------- produtos + carga inicial de estoque ----------
        for (const produto of PRODUTOS) {
            const slug = gerarSlug(produto.nome)

            const criado = await Produto.create({
                nome: produto.nome,
                descricao: produto.descricao,
                preco: produto.preco,
                slug,
                tipo: produto.tipo,
                nivel: produto.nivel,
                tempo_minutos: produto.tempo_minutos,
                estoque_atual: produto.estoque_atual,
                imagem_url: produto.imagem_url || `/img/${slug}.svg`,
                status: true,
                categoria_id: mapaCategorias[produto.categoria]
            })

            await Estoque.create({
                produto_id: criado.id,
                tipo: 'ENTRADA',
                quantidade: produto.estoque_atual,
                saldo_anterior: 0,
                saldo_atual: produto.estoque_atual,
                motivo: 'Carga inicial do estoque da loja',
                data: new Date()
            })
        }
        console.log(`> ${PRODUTOS.length} produtos cadastrados com estoque inicial.`)

        // ---------- usuários ----------
        for (const usuario of USUARIOS) {
            await Usuario.create({
                ...usuario,
                senha: await hashSenha(usuario.senha)
            })
        }
        console.log(`> ${USUARIOS.length} usuários cadastrados.`)

        console.log('')
        console.log('==============================================')
        console.log(' CARGA INICIAL CONCLUÍDA - ACESSOS DE TESTE')
        console.log(' ADMIN   -> admin@diybello.com   / admin123456')
        console.log(' CLIENTE -> cliente@diybello.com / cliente123')
        console.log('==============================================')
    } catch (err) {
        console.error('> ERRO: erro ao popular o banco de dados: ', err)
    } finally {
        await db.close()
        console.log('> conexão com o banco de dados encerrada.')
    }
}

seed()
