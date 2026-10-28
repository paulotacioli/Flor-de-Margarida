/* =========================================================
   Catalogo mock da loja.
   Formato identico ao que uma API retornaria - trocar por
   fetch('/api/produtos') nao exige mudar mais nada.
   ========================================================= */

/* =========================================================
   Arvore de navegacao: DEPARTAMENTO > GRUPO > CATEGORIA (> SUBCATEGORIA)
   - DEPARTAMENTOS: os dois itens principais do menu (Roupas e Acessórios).
   - Cada departamento e grupo carrega descricao de SEO (ate 160 caracteres)
     e palavras-chave usadas nas metatags e na busca interna.
   - CATEGORIAS continua sendo a lista plana usada por produto.categoria.
   ========================================================= */

const DEPARTAMENTOS = [
  {
    id: 'roupas',
    nome: 'Roupas',
    seo: 'Roupas femininas para o dia a dia e ocasiões especiais: blusas, vestidos, conjuntos, jeans, saias e casacos com caimento que respeita o corpo.',
    palavras: ['roupas femininas', 'moda feminina', 'loja de roupas feminina', 'look do dia', 'roupas femininas online'],
    grupos: [
      {
        id: 'partes-de-cima',
        nome: 'Partes de Cima',
        seo: 'Blusas, camisetas, t-shirts, croppeds, regatas e manga longa femininas em tecidos leves e caimento perfeito para montar qualquer look.',
        palavras: ['blusas femininas', 'camiseta feminina', 'cropped feminino', 'regata feminina', 'blusa manga longa feminina'],
        categorias: [
          { id: 'blusas-camisetas', nome: 'Blusas e Camisetas' },
          { id: 'tshirts', nome: 'T-shirts' },
          { id: 'cropped', nome: 'Cropped' },
          { id: 'regatas-sem-manga', nome: 'Regatas e Sem Manga' },
          { id: 'manga-longa', nome: 'Manga Longa' }
        ]
      },
      {
        id: 'pecas-unicas',
        nome: 'Peças Únicas',
        seo: 'Vestidos curtos, vestidos longos e conjuntos femininos: a peça única que resolve o look, do casual ao evento, com modelagem elegante.',
        palavras: ['vestido feminino', 'vestido longo', 'vestido curto', 'conjunto feminino', 'vestido de festa'],
        categorias: [
          { id: 'vestidos-curtos', nome: 'Vestidos Curtos' },
          { id: 'vestidos-longos', nome: 'Vestidos Longos' },
          { id: 'conjuntos', nome: 'Conjuntos' }
        ]
      },
      {
        id: 'partes-de-baixo',
        nome: 'Partes de Baixo',
        seo: 'Calças jeans, shorts, bermudas, saias jeans e saias femininas com cintura alta e modelagem confortável para compor o look completo.',
        palavras: ['calça jeans feminina', 'short jeans feminino', 'saia feminina', 'jaqueta jeans feminina', 'saia jeans'],
        categorias: [
          { id: 'jeans', nome: 'Jeans' },
          { id: 'saias', nome: 'Saias' }
        ]
      },
      {
        id: 'inverno-sobreposicao',
        nome: 'Inverno / Sobreposição',
        seo: 'Casacos femininos para o inverno e para sobreposição: trench coats, sobretudos e jaquetas que aquecem sem perder a elegância.',
        palavras: ['casaco feminino', 'moda inverno feminina', 'sobretudo feminino', 'trench coat feminino', 'jaqueta feminina'],
        categorias: [
          { id: 'casacos', nome: 'Casacos' }
        ]
      }
    ]
  },
  {
    id: 'acessorios',
    nome: 'Acessórios',
    seo: 'Acessórios femininos para completar o look: bolsas, cintos, lenços, bandanas, óculos de sol, tiaras, presilhas e scrunchies selecionados a dedo.',
    palavras: ['acessórios femininos', 'bolsa feminina', 'lenço feminino', 'óculos de sol feminino', 'tiara de cabelo'],
    grupos: [
      {
        id: 'acessorios',
        nome: null,
        seo: 'Acessórios femininos para completar o look: bolsas, cintos, lenços, bandanas, óculos de sol, tiaras, presilhas e scrunchies selecionados a dedo.',
        palavras: ['acessórios femininos', 'bolsa feminina', 'lenço feminino', 'óculos de sol feminino', 'tiara de cabelo'],
        categorias: [
          { id: 'bolsas', nome: 'Bolsas' },
          { id: 'cintos', nome: 'Cintos' },
          { id: 'lencos-bandanas', nome: 'Lenços e Bandanas' },
          { id: 'oculos-de-sol', nome: 'Óculos de Sol' },
          { id: 'tiaras-cabelo', nome: 'Tiaras de Cabelo' },
          { id: 'presilhas-scrunchies', nome: 'Presilhas e Scrunchies' },
          /* Fora do menu: existe so para classificar o chapeu que ja estava no catalogo */
          { id: 'chapeus', nome: 'Chapéus', oculto: true }
        ]
      }
    ]
  }
];

/* Listas planas derivadas da arvore: cada categoria sabe seu grupo e departamento */
const CATEGORIAS = DEPARTAMENTOS.flatMap((d) =>
  d.grupos.flatMap((g) =>
    g.categorias.map((c) => ({ ...c, grupo: g.id, departamento: d.id }))
  )
);
const GRUPOS = DEPARTAMENTOS.flatMap((d) => d.grupos.map((g) => ({ ...g, departamento: d.id })));

/* Subcategorias: desdobram uma categoria em tipos (hoje so Jeans) */
const SUBCATEGORIAS = {
  jeans: [
    { id: 'calcas-jeans', nome: 'Calças Jeans' },
    { id: 'shorts-bermudas', nome: 'Shorts e Bermudas' },
    { id: 'jaquetas-jeans', nome: 'Jaquetas Jeans' },
    { id: 'saias-jeans', nome: 'Saias Jeans' }
  ]
};

const TAMANHOS_ORDEM = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'U'];

/* Silhuetas vetoriais usadas no lugar das fotos (grade 100x100).
   Quando houver fotografia, troque Loja.imagem() por produto.fotos[]. */
const SILHUETAS = {
  camiseta: {
    corpo: 'M35 17 C38 24 62 24 65 17 L84 26 L76 46 L67 42 L67 88 L33 88 L33 42 L24 46 L16 26 Z',
    detalhe: 'M35 17 L50 26 L65 17'
  },
  camisa: {
    corpo: 'M36 15 L22 21 L14 60 L26 64 L31 44 L31 88 L69 88 L69 44 L74 64 L86 60 L78 21 L64 15 L50 26 Z',
    detalhe: 'M50 26 L50 88 M36 15 L50 26 L64 15 M31 44 L31 88 M69 44 L69 88'
  },
  vestido: {
    corpo: 'M36 17 C39 24 61 24 64 17 L75 23 L70 44 L84 90 L16 90 L30 44 L25 23 Z',
    detalhe: 'M36 17 L50 26 L64 17 M30 44 L70 44'
  },
  vestido_longo: {
    corpo: 'M36 17 C39 24 61 24 64 17 L75 23 L70 44 L84 90 L16 90 L30 44 L25 23 Z',
    detalhe: 'M36 17 L50 26 L64 17 M30 44 L70 44'
  },
  blazer: {
    corpo: 'M36 15 L22 21 L14 60 L26 64 L31 44 L31 88 L47 88 L50 40 L53 88 L69 88 L69 44 L74 64 L86 60 L78 21 L64 15 L50 38 Z',
    detalhe: 'M36 15 L50 38 L64 15 M40 60 L46 60'
  },
  casaco: {
    corpo: 'M35 13 L20 20 L11 64 L24 68 L29 46 L29 96 L47 96 L50 42 L53 96 L71 96 L71 46 L76 68 L89 64 L80 20 L65 13 L50 40 Z',
    detalhe: 'M35 13 L50 40 L65 13 M29 62 L71 62 M44 62 L44 68 M56 62 L56 68'
  },
  calca: {
    corpo: 'M31 16 L69 16 L67 92 L55 92 L50 50 L45 92 L33 92 Z',
    detalhe: 'M31 25 L69 25'
  },
  jeans: {
    corpo: 'M31 16 L69 16 L67 92 L55 92 L50 50 L45 92 L33 92 Z',
    detalhe: 'M31 25 L69 25 M36 27 L42 34 M64 27 L58 34'
  },
  saia: {
    corpo: 'M32 20 L68 20 L80 88 L20 88 Z',
    detalhe: 'M32 29 L68 29'
  },
  short: {
    corpo: 'M31 16 L69 16 L71 54 L54 54 L50 38 L46 54 L29 54 Z',
    detalhe: 'M31 25 L69 25 M35 27 L41 33 M65 27 L59 33'
  },
  trico: {
    corpo: 'M35 16 C38 23 62 23 65 16 L84 23 L90 62 L76 67 L72 50 L72 88 L28 88 L28 50 L24 67 L10 62 L16 23 Z',
    detalhe: 'M35 16 L50 24 L65 16 M28 81 L72 81 M12 58 L88 58'
  },
  moletom: {
    corpo: 'M35 17 C38 24 62 24 65 17 L84 24 L90 62 L76 67 L72 50 L72 88 L28 88 L28 50 L24 67 L10 62 L16 24 Z',
    detalhe: 'M36 16 C40 33 60 33 64 16 M50 33 L50 44 M36 70 L64 70 L62 80 L38 80 Z'
  },
  bolsa: {
    corpo: 'M28 38 L72 38 L77 86 L23 86 Z',
    detalhe: 'M39 38 C39 22 61 22 61 38'
  },
  chapeu: {
    corpo: 'M50 26 C64 26 70 42 71 58 C81 61 89 68 89 76 L89 81 L11 81 L11 76 C11 68 19 61 29 58 C30 42 36 26 50 26 Z',
    detalhe: 'M29 60 C36 65 64 65 71 60'
  }
};

/* Prova virtual: como cada silhueta se prende ao corpo.
   ombro/cintura = pontos da silhueta que caem nos ombros ou na cintura;
   baseY = y da barra na silhueta; base = linha do corpo que a barra alcanca
   (t interpola entre 'desde' e 'ate'); folga = quanto a peca e mais larga
   que a distancia entre as articulacoes. */
const ANCORAS = {
  camiseta: { parte: 'cima',  ombroE: { x: 26, y: 22 }, ombroD: { x: 74, y: 22 }, baseY: 88, base: { ate: 'quadril' }, folga: 1.1 },
  camisa:   { parte: 'cima',  ombroE: { x: 26, y: 20 }, ombroD: { x: 74, y: 20 }, baseY: 88, base: { ate: 'quadril' }, folga: 1.1 },
  trico:    { parte: 'cima',  ombroE: { x: 27, y: 21 }, ombroD: { x: 73, y: 21 }, baseY: 88, base: { ate: 'quadril' }, folga: 1.14 },
  blazer:   { parte: 'sobre', ombroE: { x: 26, y: 20 }, ombroD: { x: 74, y: 20 }, baseY: 88, base: { ate: 'quadril' }, folga: 1.18 },
  moletom:  { parte: 'sobre', ombroE: { x: 27, y: 22 }, ombroD: { x: 73, y: 22 }, baseY: 88, base: { ate: 'quadril' }, folga: 1.18 },
  casaco:   { parte: 'sobre', ombroE: { x: 27, y: 19 }, ombroD: { x: 73, y: 19 }, baseY: 96, base: { ate: 'joelho' }, folga: 1.22 },
  vestido:  { parte: 'vestido', ombroE: { x: 29, y: 21 }, ombroD: { x: 71, y: 21 }, baseY: 90, base: { ate: 'joelho' }, folga: 1.1 },
  vestido_longo: { parte: 'vestido', ombroE: { x: 29, y: 21 }, ombroD: { x: 71, y: 21 }, baseY: 90, base: { ate: 'tornozelo' }, folga: 1.1 },
  calca:    { parte: 'baixo', cinturaE: { x: 31, y: 16 }, cinturaD: { x: 69, y: 16 }, baseY: 92, base: { ate: 'tornozelo' }, folga: 1.3 },
  jeans:    { parte: 'baixo', cinturaE: { x: 31, y: 16 }, cinturaD: { x: 69, y: 16 }, baseY: 92, base: { ate: 'tornozelo' }, folga: 1.3 },
  short:    { parte: 'baixo', cinturaE: { x: 31, y: 16 }, cinturaD: { x: 69, y: 16 }, baseY: 54, base: { desde: 'quadril', ate: 'joelho', t: 0.62 }, folga: 1.32 },
  saia:     { parte: 'baixo', cinturaE: { x: 32, y: 20 }, cinturaD: { x: 68, y: 20 }, baseY: 88, base: { ate: 'joelho' }, folga: 1.3 },
  bolsa:    { parte: 'acessorio' },
  chapeu:   { parte: 'acessorio' }
};

const PARTES = [
  { id: 'cima', nome: 'Parte de cima' },
  { id: 'baixo', nome: 'Parte de baixo' },
  { id: 'vestido', nome: 'Vestido' },
  { id: 'sobre', nome: 'Sobreposicao' }
];

/* Fundos dos cards: familia lilas da marca + neutros que a acompanham */
const FUNDOS = {
  lilas:   ['#e7d9f3', '#d5bfe9'],
  lavanda: ['#e9e0f5', '#d8c8ec'],
  bruma:   ['#e7e4ef', '#d7d2e3'],
  rosa:    ['#f2e0ea', '#e5c8d9'],
  oliva:   ['#e2e7dc', '#cfd8c8'],
  gelo:    ['#eeecf2', '#dedbe7'],
  terra:   ['#eddfd6', '#dbc5b5'],
  areia:   ['#efe6dc', '#e1d1c0']
};

/* Pecas com FOTO REAL. `foto` e gerado por ferramentas/preparar_peca.py:
   recorte (PNG com alpha, prova virtual), card e zoom (galeria) e as ancoras
   em fracao da imagem. Enquanto `foto` e null, a peca usa a silhueta vetorial. */
const PRODUTOS = [
  {
    id: 'camisa-branca-simples',
    nome: 'Camisa Branca Simples',
    categoria: 'blusas-camisetas',
    preco: 249.0,
    precoAntigo: null,
    tag: 'novo',
    silhueta: 'camisa',
    fundo: 'gelo',
    foto: null,
    cores: [{ nome: 'Branco', hex: '#f4f2ee' }],
    tamanhos: [
      { nome: 'PP', disponivel: true }, { nome: 'P', disponivel: true },
      { nome: 'M', disponivel: true }, { nome: 'G', disponivel: true },
      { nome: 'GG', disponivel: true }
    ],
    resumo: 'Tricoline de algodão, gola classica, corte reto.',
    descricao: 'A camisa branca que resolve. Tricoline de algodão com toque seco, gola classica, botões de resina e corte reto que fica bem dentro ou fora da calca.',
    composição: '100% algodão',
    cuidados: ['Lavar a máquina até 40 graus', 'Passar em temperatura alta', 'Não usar alvejante com cloro'],
    modeloVeste: 'A modelo tem 1,72 m e veste tamanho P',
    avaliacao: { nota: 4.8, total: 12 }
  },
  {
    id: 'short-preto',
    nome: 'Short Preto',
    categoria: 'conjuntos',
    preco: 189.0,
    precoAntigo: null,
    tag: 'novo',
    silhueta: 'short',
    fundo: 'bruma',
    foto: null,
    cores: [{ nome: 'Preto', hex: '#1c1a18' }],
    tamanhos: [
      { nome: '36', disponivel: true }, { nome: '38', disponivel: true },
      { nome: '40', disponivel: true }, { nome: '42', disponivel: true },
      { nome: '44', disponivel: true }
    ],
    resumo: 'Cintura alta, tecido plano com elastano.',
    descricao: 'Short preto de cintura alta em tecido plano com um pouco de elastano. Ziper lateral invisivel, bolsos embutidos e comprimento acima do joelho.',
    composição: '95% poliéster, 5% elastano',
    cuidados: ['Lavar a máquina até 30 graus', 'Passar em temperatura média do avesso'],
    modeloVeste: 'A modelo tem 1,70 m e veste tamanho 38',
    avaliacao: { nota: 4.7, total: 9 }
  },
  {
    id: 'saia-florida-midi',
    nome: 'Saia Florida Midi',
    categoria: 'saias',
    preco: 279.0,
    precoAntigo: null,
    tag: 'novo',
    silhueta: 'saia',
    fundo: 'rosa',
    foto: null,
    cores: [{ nome: 'Floral lilas', hex: '#d6b8e6' }],
    tamanhos: [
      { nome: 'PP', disponivel: true }, { nome: 'P', disponivel: true },
      { nome: 'M', disponivel: true }, { nome: 'G', disponivel: true },
      { nome: 'GG', disponivel: true }
    ],
    resumo: 'Evasê, estampa floral miúda, forro leve.',
    descricao: 'Saia midi evasê com estampa floral miúda em fundo claro. Cós alto com elástico na parte de trás, forro leve e movimento que acompanha o passo.',
    composição: '100% viscose - forro 100% poliéster',
    cuidados: ['Lavar a mao', 'Secar a sombra', 'Passar em temperatura baixa'],
    modeloVeste: 'A modelo tem 1,68 m e veste tamanho P',
    avaliacao: { nota: 4.9, total: 15 }
  },
  {
    id: 'vestido-longo',
    nome: 'Vestido Longo',
    categoria: 'vestidos-longos',
    preco: 389.0,
    precoAntigo: null,
    tag: 'novo',
    silhueta: 'vestido_longo',
    fundo: 'lilas',
    foto: null,
    cores: [{ nome: 'Lilas', hex: '#b38ed3' }],
    tamanhos: [
      { nome: 'PP', disponivel: true }, { nome: 'P', disponivel: true },
      { nome: 'M', disponivel: true }, { nome: 'G', disponivel: true },
      { nome: 'GG', disponivel: true }
    ],
    resumo: 'Alças finas, saia fluida até o tornozelo.',
    descricao: 'Vestido longo de alças finas com saia fluida até o tornozelo. Decote reto, costas com elástico para ajuste e fenda discreta na lateral.',
    composição: '100% viscose',
    cuidados: ['Lavar a mao', 'Não torcer', 'Secar na horizontal a sombra'],
    modeloVeste: 'A modelo tem 1,75 m e veste tamanho P',
    avaliacao: { nota: 4.8, total: 11 }
  },
  {
    id: 'camiseta-algodao-organico',
    nome: 'Camiseta Algodão Orgânico',
    categoria: 'tshirts',
    preco: 139.0,
    precoAntigo: null,
    tag: 'top',
    silhueta: 'camiseta',
    fundo: 'areia',
    cores: [
      { nome: 'Off-white', hex: '#efe9df' },
      { nome: 'Lilas', hex: '#b38ed3' },
      { nome: 'Preto', hex: '#1c1a18' }
    ],
    tamanhos: [
      { nome: 'PP', disponivel: true }, { nome: 'P', disponivel: true },
      { nome: 'M', disponivel: true }, { nome: 'G', disponivel: true },
      { nome: 'GG', disponivel: true }, { nome: 'XG', disponivel: false }
    ],
    resumo: 'Malha pesada 180g, caimento reto.',
    descricao: 'A base do guarda-roupa. Malha de algodão orgânico 180g com gola reforçada que não cede na lavagem. Modelagem reta, ombro no lugar certo.',
    composição: '100% algodão orgânico certificado',
    cuidados: ['Lavar a mao ou ciclo delicado até 30 graus', 'Não usar alvejante', 'Secar a sombra', 'Passar em temperatura média'],
    modeloVeste: 'A modelo tem 1,73 m e veste tamanho P',
    avaliacao: { nota: 4.8, total: 214 }
  },
  {
    id: 'camiseta-listrada-marinho',
    nome: 'Camiseta Listrada Marinho',
    categoria: 'manga-longa',
    preco: 159.0,
    precoAntigo: 199.0,
    tag: 'oferta',
    silhueta: 'camiseta',
    fundo: 'bruma',
    cores: [
      { nome: 'Marinho', hex: '#2a3a52' },
      { nome: 'Vinho', hex: '#6d2b34' }
    ],
    tamanhos: [
      { nome: 'P', disponivel: true }, { nome: 'M', disponivel: true },
      { nome: 'G', disponivel: true }, { nome: 'GG', disponivel: false }
    ],
    resumo: 'Listras classicas, manga 3/4.',
    descricao: 'Inspirada na mariniere francesa. Listras tecidas, não estampadas - não descascam nem desbotam com o tempo.',
    composição: '92% algodão, 8% elastano',
    cuidados: ['Lavar do avesso', 'Ciclo delicado até 30 graus', 'Não torcer', 'Secar na horizontal'],
    modeloVeste: 'A modelo tem 1,70 m e veste tamanho M',
    avaliacao: { nota: 4.6, total: 98 }
  },
  {
    id: 'camisa-linho-manga-longa',
    nome: 'Camisa de Linho Manga Longa',
    categoria: 'manga-longa',
    preco: 329.0,
    precoAntigo: null,
    tag: 'top',
    silhueta: 'camisa',
    fundo: 'gelo',
    cores: [
      { nome: 'Branco', hex: '#f3f1ec' },
      { nome: 'Areia', hex: '#d8c6ac' },
      { nome: 'Oliva', hex: '#6f7554' }
    ],
    tamanhos: [
      { nome: 'PP', disponivel: true }, { nome: 'P', disponivel: true },
      { nome: 'M', disponivel: true }, { nome: 'G', disponivel: true },
      { nome: 'GG', disponivel: true }
    ],
    resumo: 'Linho lavado, botões de madreperola.',
    descricao: 'Linho europeu pre-lavado, macio desde a primeira vez. Corte solto com costas levemente mais longas e botões de madreperola.',
    composição: '100% linho',
    cuidados: ['Lavar separadamente nas primeiras vezes', 'Ciclo delicado até 30 graus', 'Passar ainda umido', 'Não usar secadora'],
    modeloVeste: 'A modelo tem 1,75 m e veste tamanho P',
    avaliacao: { nota: 4.9, total: 156 }
  },
  {
    id: 'camisa-oversized-algodao',
    nome: 'Camisa Oversized de Algodão',
    categoria: 'blusas-camisetas',
    preco: 289.0,
    precoAntigo: null,
    tag: 'novo',
    silhueta: 'camisa',
    fundo: 'lavanda',
    cores: [
      { nome: 'Lilas', hex: '#b38ed3' },
      { nome: 'Branco', hex: '#f3f1ec' }
    ],
    tamanhos: [
      { nome: 'P', disponivel: true }, { nome: 'M', disponivel: true },
      { nome: 'G', disponivel: true }, { nome: 'GG', disponivel: true },
      { nome: 'XG', disponivel: true }
    ],
    resumo: 'Ombro caído, pode ser usada aberta.',
    descricao: 'Modelagem ampla com ombro caído, feita para ser usada fechada ou aberta sobre uma regata. Tecido encorpado que segura a forma.',
    composição: '100% algodão pima',
    cuidados: ['Ciclo delicado até 40 graus', 'Não usar alvejante', 'Passar em temperatura média'],
    modeloVeste: 'A modelo tem 1,72 m e veste tamanho P',
    avaliacao: { nota: 4.7, total: 63 }
  },
  {
    id: 'vestido-midi-viscose',
    nome: 'Vestido Midi de Viscose',
    categoria: 'vestidos-curtos',
    preco: 449.0,
    precoAntigo: null,
    tag: 'top',
    silhueta: 'vestido',
    fundo: 'rosa',
    cores: [
      { nome: 'Lilas', hex: '#b38ed3' },
      { nome: 'Rose', hex: '#c98d84' },
      { nome: 'Preto', hex: '#1c1a18' }
    ],
    tamanhos: [
      { nome: 'PP', disponivel: true }, { nome: 'P', disponivel: true },
      { nome: 'M', disponivel: true }, { nome: 'G', disponivel: true },
      { nome: 'GG', disponivel: true }
    ],
    resumo: 'Comprimento midi, cintura marcada.',
    descricao: 'Viscose com toque fluido e caimento pesado. Cintura marcada por pences e saia com movimento. Forro na parte superior.',
    composição: '100% viscose - forro 100% algodão',
    cuidados: ['Lavar a mao', 'Não torcer', 'Secar a sombra na horizontal', 'Passar do avesso'],
    modeloVeste: 'A modelo tem 1,74 m e veste tamanho P',
    avaliacao: { nota: 4.9, total: 187 }
  },
  {
    id: 'vestido-slip-cetim',
    nome: 'Vestido Slip de Cetim',
    categoria: 'vestidos-curtos',
    preco: 519.0,
    precoAntigo: 649.0,
    tag: 'oferta',
    silhueta: 'vestido',
    fundo: 'lilas',
    cores: [
      { nome: 'Champagne', hex: '#cdb694' },
      { nome: 'Grafite', hex: '#3b3a3a' }
    ],
    tamanhos: [
      { nome: 'P', disponivel: true }, { nome: 'M', disponivel: true },
      { nome: 'G', disponivel: false }, { nome: 'GG', disponivel: true }
    ],
    resumo: 'Corte enviesado, alças ajustaveis.',
    descricao: 'Cortado no vies para acompanhar o corpo sem apertar. Alças finas ajustaveis e acabamento em cadarco na barra.',
    composição: '65% viscose, 35% acetato',
    cuidados: ['Lavagem a seco recomendada', 'Não usar alvejante', 'Passar em temperatura baixa'],
    modeloVeste: 'A modelo tem 1,76 m e veste tamanho P',
    avaliacao: { nota: 4.5, total: 74 }
  },
  {
    id: 'blazer-alfaiataria-cropped',
    nome: 'Blazer de Alfaiataria Cropped',
    categoria: 'conjuntos',
    preco: 689.0,
    precoAntigo: null,
    tag: 'novo',
    silhueta: 'blazer',
    fundo: 'lilas',
    cores: [
      { nome: 'Preto', hex: '#1c1a18' },
      { nome: 'Areia', hex: '#d8c6ac' },
      { nome: 'Marinho', hex: '#2a3a52' }
    ],
    tamanhos: [
      { nome: 'PP', disponivel: true }, { nome: 'P', disponivel: true },
      { nome: 'M', disponivel: true }, { nome: 'G', disponivel: true },
      { nome: 'GG', disponivel: false }
    ],
    resumo: 'Estruturado, lapela fina, forro em cupro.',
    descricao: 'Alfaiataria de verdade: entretela termocolante, ombro construido e lapela fina passada a vapor. Forro em cupro respiravel.',
    composição: '54% poliéster, 44% viscose, 2% elastano',
    cuidados: ['Lavagem a seco', 'Não usar secadora', 'Guardar em cabide de ombro largo'],
    modeloVeste: 'A modelo tem 1,73 m e veste tamanho P',
    avaliacao: { nota: 4.8, total: 41 }
  },
  {
    id: 'calca-alfaiataria-pregas',
    nome: 'Calca de Alfaiataria com Pregas',
    categoria: 'conjuntos',
    preco: 429.0,
    precoAntigo: null,
    tag: null,
    silhueta: 'calca',
    fundo: 'areia',
    cores: [
      { nome: 'Preto', hex: '#1c1a18' },
      { nome: 'Caramelo', hex: '#9c6a3c' },
      { nome: 'Cinza', hex: '#7d7d7a' }
    ],
    tamanhos: [
      { nome: '36', disponivel: true }, { nome: '38', disponivel: true },
      { nome: '40', disponivel: true }, { nome: '42', disponivel: true },
      { nome: '44', disponivel: true }, { nome: '46', disponivel: false }
    ],
    resumo: 'Cintura alta, duas pregas, barra reta.',
    descricao: 'Duas pregas na frente que dao volume sem marcar. Cintura alta com passantes largos e bolso faca embutido.',
    composição: '62% viscose, 36% poliéster, 2% elastano',
    cuidados: ['Lavagem a seco', 'Passar do avesso em temperatura média'],
    modeloVeste: 'A modelo tem 1,73 m e veste tamanho 38',
    avaliacao: { nota: 4.7, total: 112 }
  },
  {
    id: 'short-alfaiataria',
    nome: 'Short de Alfaiataria',
    categoria: 'conjuntos',
    preco: 259.0,
    precoAntigo: null,
    tag: 'novo',
    silhueta: 'short',
    fundo: 'gelo',
    cores: [
      { nome: 'Preto', hex: '#1c1a18' },
      { nome: 'Areia', hex: '#d8c6ac' },
      { nome: 'Lilas', hex: '#b38ed3' }
    ],
    tamanhos: [
      { nome: '36', disponivel: true }, { nome: '38', disponivel: true },
      { nome: '40', disponivel: true }, { nome: '42', disponivel: true },
      { nome: '44', disponivel: true }
    ],
    resumo: 'Cintura alta, pregas e barra reta.',
    descricao: 'O mesmo tecido da calca de alfaiataria, em comprimento acima do joelho. Cintura alta com pregas frontais e bolso faca.',
    composição: '62% viscose, 36% poliéster, 2% elastano',
    cuidados: ['Lavagem a seco', 'Passar do avesso em temperatura média'],
    modeloVeste: 'A modelo tem 1,72 m e veste tamanho 38',
    avaliacao: { nota: 4.7, total: 29 }
  },
  {
    id: 'short-jeans-alto',
    nome: 'Short Jeans Cintura Alta',
    categoria: 'jeans',
    subcategoria: 'shorts-bermudas',
    preco: 219.0,
    precoAntigo: null,
    tag: null,
    silhueta: 'short',
    fundo: 'bruma',
    cores: [
      { nome: 'Azul claro', hex: '#8ba3bf' },
      { nome: 'Azul escuro', hex: '#2c3a51' },
      { nome: 'Preto', hex: '#1c1a18' }
    ],
    tamanhos: [
      { nome: '36', disponivel: true }, { nome: '38', disponivel: true },
      { nome: '40', disponivel: true }, { nome: '42', disponivel: false },
      { nome: '44', disponivel: true }
    ],
    resumo: 'Denim 11oz, barra dobrada.',
    descricao: 'Short de denim encorpado com cintura alta e barra dobrada. Modela sem apertar e ganha caimento com o uso.',
    composição: '99% algodão, 1% elastano',
    cuidados: ['Lavar do avesso', 'Secar a sombra', 'Não usar alvejante'],
    modeloVeste: 'A modelo tem 1,70 m e veste tamanho 38',
    avaliacao: { nota: 4.6, total: 51 }
  },
  {
    id: 'calca-jeans-reta-alta',
    nome: 'Calca Jeans Reta Cintura Alta',
    categoria: 'jeans',
    subcategoria: 'calcas-jeans',
    preco: 369.0,
    precoAntigo: null,
    tag: null,
    silhueta: 'jeans',
    fundo: 'bruma',
    cores: [
      { nome: 'Azul medio', hex: '#4a6485' },
      { nome: 'Azul escuro', hex: '#2c3a51' },
      { nome: 'Preto', hex: '#1c1a18' }
    ],
    tamanhos: [
      { nome: '36', disponivel: true }, { nome: '38', disponivel: true },
      { nome: '40', disponivel: true }, { nome: '42', disponivel: true },
      { nome: '44', disponivel: true }
    ],
    resumo: 'Denim rigido 12oz, lavagem média.',
    descricao: 'Denim rigido de 12oz que molda com o uso. Cintura alta, perna reta e barra sem desfiar para ajustar no comprimento que você quiser.',
    composição: '100% algodão',
    cuidados: ['Lavar do avesso com pouca agua', 'Não usar alvejante', 'Secar a sombra'],
    modeloVeste: 'A modelo tem 1,74 m e veste tamanho 38',
    avaliacao: { nota: 4.7, total: 341 }
  },
  {
    id: 'jaqueta-jeans-classica',
    nome: 'Jaqueta Jeans Classica',
    categoria: 'jeans',
    subcategoria: 'jaquetas-jeans',
    preco: 459.0,
    precoAntigo: null,
    tag: null,
    silhueta: 'blazer',
    fundo: 'bruma',
    cores: [
      { nome: 'Azul claro', hex: '#8ba3bf' },
      { nome: 'Azul escuro', hex: '#2c3a51' }
    ],
    tamanhos: [
      { nome: 'P', disponivel: true }, { nome: 'M', disponivel: true },
      { nome: 'G', disponivel: true }, { nome: 'GG', disponivel: false }
    ],
    resumo: 'Trucker classica, botões de metal.',
    descricao: 'A trucker de sempre: dois bolsos com lapela, ajuste lateral por botao e costura dupla em laranja.',
    composição: '99% algodão, 1% elastano',
    cuidados: ['Lavar do avesso', 'Não usar secadora', 'Passar em temperatura média'],
    modeloVeste: 'A modelo tem 1,70 m e veste tamanho M',
    avaliacao: { nota: 4.8, total: 129 }
  },
  {
    id: 'trench-coat-gabardine',
    nome: 'Trench Coat de Gabardine',
    categoria: 'casacos',
    preco: 1290.0,
    precoAntigo: null,
    tag: 'novo',
    silhueta: 'casaco',
    fundo: 'areia',
    cores: [
      { nome: 'Areia', hex: '#c8b291' },
      { nome: 'Preto', hex: '#1c1a18' }
    ],
    tamanhos: [
      { nome: 'P', disponivel: true }, { nome: 'M', disponivel: true },
      { nome: 'G', disponivel: true }, { nome: 'GG', disponivel: true }
    ],
    resumo: 'Gabardine impermeavel, cinto removivel.',
    descricao: 'Gabardine de algodão com tratamento impermeavel. Transpasse duplo, ombreira leve, cinto com fivela de metal escovado.',
    composição: '100% algodão com acabamento hidrorrepelente',
    cuidados: ['Lavagem a seco', 'Não usar secadora', 'Reaplicar impermeabilizante anualmente'],
    modeloVeste: 'A modelo tem 1,76 m e veste tamanho P',
    avaliacao: { nota: 5.0, total: 37 }
  },
  {
    id: 'sobretudo-la-batida',
    nome: 'Sobretudo de La Batida',
    categoria: 'casacos',
    preco: 1490.0,
    precoAntigo: 1790.0,
    tag: 'oferta',
    silhueta: 'casaco',
    fundo: 'gelo',
    cores: [
      { nome: 'Cinza', hex: '#7d7d7a' },
      { nome: 'Camelo', hex: '#b08356' }
    ],
    tamanhos: [
      { nome: 'P', disponivel: true }, { nome: 'M', disponivel: true },
      { nome: 'G', disponivel: true }, { nome: 'GG', disponivel: false }
    ],
    resumo: 'La batida encorpada, forro inteiro.',
    descricao: 'La batida de gramatura alta com forro inteiro em cupro. Comprimento abaixo do joelho e bolso embutido no vies.',
    composição: '80% la, 20% poliamida - forro 100% cupro',
    cuidados: ['Lavagem a seco', 'Escovar apos o uso', 'Guardar em capa de tecido'],
    modeloVeste: 'A modelo tem 1,75 m e veste tamanho M',
    avaliacao: { nota: 4.8, total: 52 }
  },
  {
    id: 'bolsa-couro-estruturada',
    nome: 'Bolsa de Couro Estruturada',
    categoria: 'bolsas',
    preco: 749.0,
    precoAntigo: null,
    tag: 'top',
    silhueta: 'bolsa',
    fundo: 'lilas',
    cores: [
      { nome: 'Caramelo', hex: '#9c6a3c' },
      { nome: 'Preto', hex: '#1c1a18' },
      { nome: 'Cognac', hex: '#7c4a2a' }
    ],
    tamanhos: [{ nome: 'U', disponivel: true }],
    resumo: 'Couro legitimo, alca dupla, forro em algodão.',
    descricao: 'Couro legitimo curtido ao vegetal que ganha patina com o tempo. Estrutura firme, alca dupla e um bolso interno com ziper.',
    composição: 'Couro bovino legitimo - forro 100% algodão',
    cuidados: ['Hidratar a cada 3 meses', 'Evitar exposicao ao sol', 'Guardar com o enchimento original'],
    modeloVeste: 'Medidas: 30 x 24 x 12 cm',
    avaliacao: { nota: 4.9, total: 96 }
  },
  {
    id: 'chapeu-palha-aba-larga',
    nome: 'Chapeu de Palha Aba Larga',
    categoria: 'chapeus',
    preco: 219.0,
    precoAntigo: null,
    tag: null,
    silhueta: 'chapeu',
    fundo: 'areia',
    cores: [
      { nome: 'Palha', hex: '#d3b177' },
      { nome: 'Preto', hex: '#1c1a18' }
    ],
    tamanhos: [{ nome: 'U', disponivel: true }],
    resumo: 'Palha natural trancada a mao.',
    descricao: 'Palha natural trancada a mao, com fita de gorgorao e aba de 9 cm que dobra sem marcar.',
    composição: '100% palha natural',
    cuidados: ['Limpar com pano seco', 'Guardar com a copa para baixo', 'Não molhar'],
    modeloVeste: 'Circunferencia ajustavel de 56 a 58 cm',
    avaliacao: { nota: 4.5, total: 44 }
  }
];

/* Cupons aceitos na demonstracao */
const CUPONS = {
  MARGARIDA10: { tipo: 'percentual', valor: 10, descricao: '10% de desconto' },
  PRIMEIRACOMPRA: { tipo: 'percentual', valor: 15, descricao: '15% na primeira compra' },
  FRETEGRATIS: { tipo: 'frete', valor: 100, descricao: 'Frete gratis' }
};

/* Opcoes de entrega */
const FRETES = [
  { id: 'retirada', nome: 'Retirar na loja', prazo: 'Pronto em 2 horas', preco: 0, icone: 'local' },
  { id: 'padrao', nome: 'Entrega padrao', prazo: '3 a 5 dias uteis', preco: 24.9, icone: 'caminhao' },
  { id: 'expressa', nome: 'Entrega expressa', prazo: 'Ate 24 horas', preco: 39.9, icone: 'relogio' }
];

/* Pix estatico da loja: preencha a chave (CPF/CNPJ, e-mail, celular ou
   aleatoria) exatamente como cadastrada no banco. Nome e cidade aparecem
   no app do cliente; o BR Code limita a 25 e 15 caracteres, sem acento. */
const PIX = {
  chave: 'flordemargaridamoda@gmail.com',
  nome: 'Flor de Margarida',
  cidade: 'Sao Jose dos Campos'
};

/* Formas de pagamento: Pix e real (BR Code estatico); cartao e boleto
   continuam somente como selecao, sem processamento. */
const PAGAMENTOS = [
  { id: 'pix', nome: 'Pix', detalhe: 'Aprovação na hora', icone: 'pix', desconto: 0 },
  { id: 'cartao', nome: 'Cartão de crédito', detalhe: 'Até 6x sem juros', icone: 'cartao', desconto: 0 },
  { id: 'boleto', nome: 'Boleto bancário', detalhe: 'Compensa em até 2 dias úteis', icone: 'codigo_barras', desconto: 0 }
];

/* Tabela de medidas (cm) */
const TABELA_MEDIDAS = {
  colunas: ['Tamanho', 'Busto', 'Cintura', 'Quadril'],
  linhas: [
    ['PP', '80-84', '62-66', '88-92'],
    ['P', '85-89', '67-71', '93-97'],
    ['M', '90-94', '72-76', '98-102'],
    ['G', '95-100', '77-82', '103-108'],
    ['GG', '101-106', '83-88', '109-114'],
    ['XG', '107-112', '89-94', '115-120']
  ]
};

const LIMITE_FRETE_GRATIS = 399;
