/* =========================================================
   Controladores de pagina.
   <body data-pagina="..."> define qual roda (roteador no fim).
   ========================================================= */

const { fmt, esc, imagem, produto, nomeCategoria, carrinho, favoritos, toast } = Loja;
const { cardProduto, estrelas } = Componentes;

/* =========================================================
   HOME
   ========================================================= */

function paginaInicio() {
  /* Colagem do hero: foto de campanha da loja + duas pecas em destaque */
  const colagem = document.querySelector('[data-colagem]');
  if (colagem) {
    const pecas = ['vestido-midi-viscose', 'blazer-alfaiataria-cropped'].map(produto);
    colagem.innerHTML = `
      <a class="colagem__peca colagem__peca--a" href="produtos.html?ordem=novidades"
         aria-label="Novidades da estacao">
        <img src="assets/img/campanha.jpg" alt="Campanha da nova estacao da Flor de Margarida"
             width="480" height="640" fetchpriority="high">
      </a>
      <a class="colagem__peca colagem__peca--b" href="produto.html?id=${pecas[0].id}"
         aria-label="${esc(pecas[0].nome)}">
        <img src="${imagem(pecas[0], pecas[0].cores[0].hex)}" alt="${esc(pecas[0].nome)}"
             width="400" height="500" loading="lazy">
      </a>
      <a class="colagem__peca colagem__peca--c" href="produto.html?id=${pecas[1].id}"
         aria-label="${esc(pecas[1].nome)}">
        <img src="${imagem(pecas[1], pecas[1].cores[0].hex, 1)}" alt="${esc(pecas[1].nome)}"
             width="400" height="500" loading="lazy">
      </a>
      <span class="selo-flutuante">${icone('local')} São José dos Campos</span>`;
  }

  /* Bento de categorias */
  const bento = document.querySelector('[data-bento]');
  if (bento) {
    const destaque = [
      { href: 'produtos.html?grupo=pecas-unicas', nome: 'Vestidos', cats: ['vestidos-curtos', 'vestidos-longos'], classe: 'bento__item--alto', prod: 'vestido-midi-viscose' },
      { href: 'produtos.html?categoria=conjuntos', nome: 'Conjuntos', cats: ['conjuntos'], classe: 'bento__item--largo', prod: 'blazer-alfaiataria-cropped' },
      { href: 'produtos.html?categoria=jeans', nome: 'Jeans', cats: ['jeans'], classe: '', prod: 'calca-jeans-reta-alta' },
      { href: 'produtos.html?categoria=casacos', nome: 'Casacos', cats: ['casacos'], classe: 'bento__item--largo', prod: 'trench-coat-gabardine' },
      { href: 'produtos.html?departamento=acessorios', nome: 'Acessórios', cats: CATEGORIAS.filter((c) => c.departamento === 'acessorios').map((c) => c.id), classe: '', prod: 'bolsa-couro-estruturada' }
    ];
    bento.innerHTML = destaque
      .map((d) => {
        const p = produto(d.prod);
        const total = PRODUTOS.filter((x) => d.cats.includes(x.categoria)).length;
        const [f1, f2] = FUNDOS[p.fundo];
        return `
        <a class="bento__item ${d.classe}" href="${d.href}"
           style="background:linear-gradient(120deg, ${f1}, ${f2})">
          <img src="${imagem(p, p.cores[0].hex)}" alt="" loading="lazy">
          <span class="bento__rotulo">${d.nome} ${icone('seta_direita', { classe: 'i--sm' })}</span>
          <span class="sr-only">${total} pecas</span>
        </a>`;
      })
      .join('');
  }

  /* Novidades */
  const grade = document.querySelector('[data-novidades]');
  if (grade) {
    const novos = [...PRODUTOS].sort((a, b) => (b.tag === 'novo') - (a.tag === 'novo')).slice(0, 4);
    grade.innerHTML = novos.map(cardProduto).join('');
  }

  /* Mais amados */
  const amados = document.querySelector('[data-amados]');
  if (amados) {
    amados.innerHTML = [...PRODUTOS]
      .sort((a, b) => b.avaliacao.nota - a.avaliacao.nota || b.avaliacao.total - a.avaliacao.total)
      .slice(0, 4)
      .map(cardProduto)
      .join('');
  }
}

/* =========================================================
   CATALOGO
   ========================================================= */

function paginaProdutos() {
  const grade = document.querySelector('[data-grade]');
  const contador = document.querySelector('[data-contador]');
  const fichas = document.querySelector('[data-fichas]');
  const painelFiltros = document.querySelector('[data-filtros]');
  const ancora = document.querySelector('[data-filtros-ancora]');
  const ordemSel = document.querySelector('[data-ordem]');
  const buscaInput = document.querySelector('[data-busca-catalogo]');

  const params = new URLSearchParams(location.search);
  const listaDe = (chave) => (params.get(chave) || '').split(',').filter(Boolean);

  const estado = {
    departamento: params.get('departamento') || '',
    grupo: params.get('grupo') || '',
    categorias: listaDe('categoria'),
    subcategorias: listaDe('subcategoria'),
    /* Categorias com as subcategorias abertas (acordeao do filtro).
       Comeca abrindo as que ja tem uma subcategoria selecionada. */
    expandidas: [
      ...new Set(
        listaDe('subcategoria')
          .map((sid) =>
            Object.keys(SUBCATEGORIAS).find((cat) =>
              SUBCATEGORIAS[cat].some((s) => s.id === sid)
            )
          )
          .filter(Boolean)
      )
    ],
    tamanhos: listaDe('tamanho'),
    cores: listaDe('cor'),
    precoMax: Number(params.get('precoMax')) || 0,
    busca: params.get('busca') || '',
    ordem: params.get('ordem') || 'relevancia',
    somenteFavoritos: params.get('favoritos') === '1'
  };

  /* Cabecalho da colecao: nome, descricao de SEO e metatags seguem o que
     esta filtrado (departamento > grupo > categoria). */
  const catalogoInfo = () => {
    const dep = DEPARTAMENTOS.find((d) => d.id === estado.departamento);
    const grp = GRUPOS.find((g) => g.id === estado.grupo);
    const cat = estado.categorias.length === 1 ? Loja.categoria(estado.categorias[0]) : null;
    if (cat) {
      const g = GRUPOS.find((x) => x.id === cat.grupo);
      const d = DEPARTAMENTOS.find((x) => x.id === cat.departamento);
      return { olho: g && g.nome ? `${d.nome} · ${g.nome}` : d.nome, titulo: cat.nome, seo: g.seo, palavras: g.palavras };
    }
    if (grp) {
      const d = DEPARTAMENTOS.find((x) => x.id === grp.departamento);
      return { olho: d.nome, titulo: grp.nome || d.nome, seo: grp.seo, palavras: grp.palavras };
    }
    if (dep) return { olho: 'Coleção', titulo: dep.nome, seo: dep.seo, palavras: dep.palavras };
    if (estado.ordem === 'novidades') return { olho: 'Chegou agora', titulo: 'Novidades', seo: '', palavras: [] };
    if (estado.somenteFavoritos) return { olho: 'Salvos por você', titulo: 'Meus favoritos', seo: '', palavras: [] };
    return { olho: 'Coleção completa', titulo: 'Todas as peças', seo: '', palavras: [] };
  };

  const atualizarCabecalhoCatalogo = () => {
    const info = catalogoInfo();
    const olho = document.querySelector('[data-catalogo-olho]');
    const titulo = document.querySelector('[data-catalogo-titulo]');
    const desc = document.querySelector('[data-catalogo-descricao]');
    if (olho) olho.textContent = info.olho;
    if (titulo) titulo.textContent = info.titulo;
    if (desc) {
      desc.textContent = info.seo;
      desc.hidden = !info.seo;
    }
    document.title = `${info.titulo} - Flor de Margarida`;
    const meta = (nome, valor) => {
      let el = document.querySelector(`meta[name="${nome}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.name = nome;
        document.head.appendChild(el);
      }
      el.content = valor;
    };
    if (info.seo) meta('description', info.seo);
    if (info.palavras.length) meta('keywords', info.palavras.join(', '));
  };
  atualizarCabecalhoCatalogo();

  /* Palavras-chave do grupo entram na busca interna: "camiseta feminina"
     encontra as t-shirts mesmo sem a palavra no nome da peca. */
  const palavrasDe = (p) => {
    const c = Loja.categoria(p.categoria);
    const g = c && GRUPOS.find((x) => x.id === c.grupo);
    const d = c && DEPARTAMENTOS.find((x) => x.id === c.departamento);
    return [...((g && g.palavras) || []), ...((d && d.palavras) || [])].join(' ');
  };

  const PRECO_TETO = Math.ceil(Math.max(...PRODUTOS.map((p) => p.preco)) / 100) * 100;
  if (!estado.precoMax) estado.precoMax = PRECO_TETO;

  buscaInput.value = estado.busca;
  ordemSel.value = estado.ordem;

  /* --- Opcoes derivadas do catalogo --- */
  const todosTamanhos = [...new Set(PRODUTOS.flatMap((p) => p.tamanhos.map((t) => t.nome)))].sort(
    (a, b) => {
      const ia = TAMANHOS_ORDEM.indexOf(a);
      const ib = TAMANHOS_ORDEM.indexOf(b);
      if (ia === -1 && ib === -1) return Number(a) - Number(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    }
  );
  const todasCores = [];
  PRODUTOS.forEach((p) =>
    p.cores.forEach((c) => {
      if (!todasCores.some((x) => x.nome === c.nome)) todasCores.push(c);
    })
  );

  /* Subcategorias: refino por tipo dentro de cada categoria que as tenha */
  const todasSubs = Object.values(SUBCATEGORIAS).flat();
  const nomeSub = (id) => (todasSubs.find((s) => s.id === id) || {}).nome || id;

  /* --- Filtro --- */
  const filtrar = () => {
    const termo = estado.busca.trim().toLowerCase();
    return PRODUTOS.filter((p) => {
      const cat = Loja.categoria(p.categoria) || {};
      if (estado.departamento && cat.departamento !== estado.departamento) return false;
      if (estado.grupo && cat.grupo !== estado.grupo) return false;
      if (estado.categorias.length && !estado.categorias.includes(p.categoria)) return false;
      if (estado.subcategorias.length && !estado.subcategorias.includes(p.subcategoria)) return false;
      if (estado.tamanhos.length && !p.tamanhos.some((t) => t.disponivel && estado.tamanhos.includes(t.nome)))
        return false;
      if (estado.cores.length && !p.cores.some((c) => estado.cores.includes(c.nome))) return false;
      if (p.preco > estado.precoMax) return false;
      if (estado.somenteFavoritos && !favoritos.tem(p.id)) return false;
      if (termo) {
        const alvo = `${p.nome} ${p.resumo} ${nomeCategoria(p.categoria)} ${palavrasDe(p)} ${p.cores
          .map((c) => c.nome)
          .join(' ')}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      return true;
    });
  };

  const ordenar = (lista) => {
    const copia = [...lista];
    switch (estado.ordem) {
      case 'menor': return copia.sort((a, b) => a.preco - b.preco);
      case 'maior': return copia.sort((a, b) => b.preco - a.preco);
      case 'nome': return copia.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      case 'novidades': return copia.sort((a, b) => (b.tag === 'novo') - (a.tag === 'novo'));
      case 'avaliacao': return copia.sort((a, b) => b.avaliacao.nota - a.avaliacao.nota);
      default: return copia.sort((a, b) => b.avaliacao.total - a.avaliacao.total);
    }
  };

  /* --- URL reflete o estado (deep link + voltar do navegador) --- */
  const sincronizarUrl = () => {
    const url = new URL(location.href);
    const set = (k, v) => (v && v.length ? url.searchParams.set(k, v) : url.searchParams.delete(k));
    set('departamento', estado.departamento);
    set('grupo', estado.grupo);
    set('categoria', estado.categorias.join(','));
    set('subcategoria', estado.subcategorias.join(','));
    set('tamanho', estado.tamanhos.join(','));
    set('cor', estado.cores.join(','));
    set('busca', estado.busca);
    set('ordem', estado.ordem === 'relevancia' ? '' : estado.ordem);
    set('precoMax', estado.precoMax < PRECO_TETO ? String(estado.precoMax) : '');
    set('favoritos', estado.somenteFavoritos ? '1' : '');
    history.replaceState(null, '', url);
  };

  /* --- Painel de filtros --- */
  const desenharFiltros = () => {
    const contarCategoria = (id) => PRODUTOS.filter((p) => p.categoria === id).length;
    const contarSub = (id) => PRODUTOS.filter((p) => p.subcategoria === id).length;

    /* So os departamentos/grupos do recorte atual aparecem no painel */
    const departamentosVisiveis = DEPARTAMENTOS.filter(
      (d) => !estado.departamento || d.id === estado.departamento
    ).map((d) => ({
      ...d,
      grupos: d.grupos.filter((g) => !estado.grupo || g.id === estado.grupo)
    })).filter((d) => d.grupos.length);

    const blocoCategoria = (c) => {
            const subs = SUBCATEGORIAS[c.id];
            const aberto = estado.expandidas.includes(c.id);
            return `
            <div class="filtro-cat">
              <div class="filtro-cat__topo">
                <label class="opcao">
                  <input type="checkbox" data-filtro="categorias" value="${c.id}"
                         ${estado.categorias.includes(c.id) ? 'checked' : ''}>
                  <span class="opcao__caixa">${icone('check')}</span>
                  <span class="opcao__texto">${c.nome}</span>
                  <span class="opcao__qtd">${contarCategoria(c.id)}</span>
                </label>
                ${
                  subs
                    ? `<button type="button" class="filtro-cat__btn" data-expandir="${c.id}"
                               aria-expanded="${aberto}" aria-label="${aberto ? 'Recolher' : 'Expandir'} subcategorias de ${c.nome}">
                        ${icone('chevron_baixo')}
                      </button>`
                    : ''
                }
              </div>
              ${
                subs && aberto
                  ? `<div class="filtro-cat__subs">
                      ${subs
                        .map(
                          (sc) => `
                        <label class="opcao">
                          <input type="checkbox" data-filtro="subcategorias" value="${sc.id}"
                                 ${estado.subcategorias.includes(sc.id) ? 'checked' : ''}>
                          <span class="opcao__caixa">${icone('check')}</span>
                          <span class="opcao__texto">${sc.nome}</span>
                          <span class="opcao__qtd">${contarSub(sc.id)}</span>
                        </label>`
                        )
                        .join('')}
                    </div>`
                  : ''
              }
            </div>`;
    };

    painelFiltros.innerHTML = `
      ${departamentosVisiveis
        .map(
          (d) => `
      <div class="filtro-grupo">
        <h3>${d.nome}</h3>
        ${d.grupos
          .map(
            (g) => `
          ${g.nome ? `<p class="filtro-subtitulo">${g.nome}</p>` : ''}
          <div class="filtro-lista">
            ${g.categorias.filter((c) => !c.oculto || estado.categorias.includes(c.id)).map(blocoCategoria).join('')}
          </div>`
          )
          .join('')}
      </div>`
        )
        .join('')}

      <div class="filtro-grupo">
        <h3 id="filtro-tamanho">Tamanho</h3>
        <div class="grade-tamanhos" role="group" aria-labelledby="filtro-tamanho">
          ${todosTamanhos
            .map(
              (t) => `<button class="tam-btn" type="button" data-filtro-tamanho="${t}"
                aria-pressed="${estado.tamanhos.includes(t)}">${t}</button>`
            )
            .join('')}
        </div>
      </div>

      <div class="filtro-grupo">
        <h3 id="filtro-cor">Cor</h3>
        <div class="grade-cores" role="group" aria-labelledby="filtro-cor">
          ${todasCores
            .map(
              (c) => `<button class="cor-btn" type="button" data-filtro-cor="${esc(c.nome)}"
                aria-pressed="${estado.cores.includes(c.nome)}" aria-label="${esc(c.nome)}" title="${esc(c.nome)}">
                <span class="cor-btn__disco" style="background:${c.hex}"></span></button>`
            )
            .join('')}
        </div>
      </div>

      <div class="filtro-grupo">
        <h3><label for="filtro-preco">Preço máximo</label></h3>
        <input type="range" id="filtro-preco" min="100" max="${PRECO_TETO}" step="50"
               value="${estado.precoMax}" style="width:100%;min-height:44px;padding:0"
               aria-describedby="filtro-preco-valor">
        <p id="filtro-preco-valor" class="apoio numero" style="margin:4px 0 0">Até ${fmt(estado.precoMax)}</p>
      </div>

      <div class="filtro-grupo">
        <label class="opcao">
          <input type="checkbox" data-filtro-favoritos ${estado.somenteFavoritos ? 'checked' : ''}>
          <span class="opcao__caixa">${icone('check')}</span>
          <span class="opcao__texto">Só os meus favoritos</span>
        </label>
      </div>

      <button class="btn btn--fantasma btn--bloco" type="button" data-limpar-filtros>Limpar filtros</button>`;
  };

  /* --- Fichas do que esta ativo --- */
  const desenharFichas = () => {
    const dep = DEPARTAMENTOS.find((d) => d.id === estado.departamento);
    const grp = GRUPOS.find((g) => g.id === estado.grupo);
    const ativos = [
      ...(dep ? [{ tipo: 'departamento', valor: dep.id, texto: dep.nome }] : []),
      ...(grp && grp.nome ? [{ tipo: 'grupo', valor: grp.id, texto: grp.nome }] : []),
      ...estado.categorias.map((c) => ({ tipo: 'categorias', valor: c, texto: nomeCategoria(c) })),
      ...estado.subcategorias.map((c) => ({ tipo: 'subcategorias', valor: c, texto: nomeSub(c) })),
      ...estado.tamanhos.map((t) => ({ tipo: 'tamanhos', valor: t, texto: `Tamanho ${t}` })),
      ...estado.cores.map((c) => ({ tipo: 'cores', valor: c, texto: c })),
      ...(estado.busca ? [{ tipo: 'busca', valor: estado.busca, texto: `"${estado.busca}"` }] : []),
      ...(estado.precoMax < PRECO_TETO
        ? [{ tipo: 'precoMax', valor: '', texto: `Até ${fmt(estado.precoMax)}` }]
        : []),
      ...(estado.somenteFavoritos ? [{ tipo: 'favoritos', valor: '', texto: 'Favoritos' }] : [])
    ];

    fichas.innerHTML = ativos.length
      ? ativos
          .map(
            (a) => `<span class="ficha">${esc(a.texto)}
              <button type="button" data-remover-ficha="${a.tipo}" data-valor="${esc(a.valor)}"
                      aria-label="Remover filtro ${esc(a.texto)}">${icone('fechar', { classe: 'i--sm' })}</button>
            </span>`
          )
          .join('') +
        `<button class="btn btn--fantasma" style="min-height:36px;padding:6px 14px" type="button" data-limpar-filtros>Limpar tudo</button>`
      : '';
  };

  /* --- Render --- */
  const renderizar = () => {
    atualizarCabecalhoCatalogo();
    const lista = ordenar(filtrar());
    contador.textContent =
      lista.length === 1 ? '1 peça encontrada' : `${lista.length} peças encontradas`;

    grade.innerHTML = lista.length
      ? lista.map(cardProduto).join('')
      : `<div class="vazio" style="grid-column:1/-1">
           ${icone('busca', { classe: 'i--xl' })}
           <h3>Nenhuma peça com esses filtros</h3>
           <p>Tente remover um filtro ou ampliar a faixa de preco.</p>
           <button class="btn btn--primario" type="button" data-limpar-filtros>Limpar filtros</button>
         </div>`;

    desenharFichas();
    sincronizarUrl();
  };

  /* --- Interacoes do painel (delegado no proprio painel, que pode mudar de lugar) --- */
  painelFiltros.addEventListener('change', (e) => {
    const check = e.target.closest('[data-filtro]');
    if (check) {
      const chave = check.dataset.filtro;
      estado[chave] = check.checked
        ? [...estado[chave], check.value]
        : estado[chave].filter((v) => v !== check.value);
      renderizar();
      return;
    }
    if (e.target.matches('[data-filtro-favoritos]')) {
      estado.somenteFavoritos = e.target.checked;
      renderizar();
    }
  });

  painelFiltros.addEventListener('input', (e) => {
    if (e.target.id !== 'filtro-preco') return;
    estado.precoMax = Number(e.target.value);
    const rotulo = painelFiltros.querySelector('#filtro-preco-valor');
    if (rotulo) rotulo.textContent = `Até ${fmt(estado.precoMax)}`;
    renderizar();
  });

  painelFiltros.addEventListener('click', (e) => {
    const exp = e.target.closest('[data-expandir]');
    if (exp) {
      const id = exp.dataset.expandir;
      estado.expandidas = estado.expandidas.includes(id)
        ? estado.expandidas.filter((x) => x !== id)
        : [...estado.expandidas, id];
      desenharFiltros();
      const foco = painelFiltros.querySelector(`[data-expandir="${id}"]`);
      if (foco) foco.focus();
      return;
    }
    const tam = e.target.closest('[data-filtro-tamanho]');
    if (tam) {
      const v = tam.dataset.filtroTamanho;
      estado.tamanhos = estado.tamanhos.includes(v)
        ? estado.tamanhos.filter((x) => x !== v)
        : [...estado.tamanhos, v];
      tam.setAttribute('aria-pressed', String(estado.tamanhos.includes(v)));
      renderizar();
      return;
    }
    const cor = e.target.closest('[data-filtro-cor]');
    if (cor) {
      const v = cor.dataset.filtroCor;
      estado.cores = estado.cores.includes(v)
        ? estado.cores.filter((x) => x !== v)
        : [...estado.cores, v];
      cor.setAttribute('aria-pressed', String(estado.cores.includes(v)));
      renderizar();
    }
  });

  /* --- Limpar / remover fichas (delegado no documento) --- */
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-limpar-filtros]')) {
      estado.departamento = '';
      estado.grupo = '';
      estado.categorias = [];
      estado.subcategorias = [];
      estado.tamanhos = [];
      estado.cores = [];
      estado.busca = '';
      estado.precoMax = PRECO_TETO;
      estado.somenteFavoritos = false;
      buscaInput.value = '';
      desenharFiltros();
      renderizar();
      return;
    }

    const ficha = e.target.closest('[data-remover-ficha]');
    if (!ficha) return;
    const { removerFicha: tipo, valor } = ficha.dataset;
    if (tipo === 'busca') { estado.busca = ''; buscaInput.value = ''; }
    else if (tipo === 'precoMax') estado.precoMax = PRECO_TETO;
    else if (tipo === 'favoritos') estado.somenteFavoritos = false;
    else if (tipo === 'departamento' || tipo === 'grupo') estado[tipo] = '';
    else estado[tipo] = estado[tipo].filter((v) => v !== valor);
    desenharFiltros();
    renderizar();
  });

  /* --- Busca e ordenacao --- */
  let debounce;
  buscaInput.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      estado.busca = buscaInput.value;
      renderizar();
    }, 200);
  });

  ordemSel.addEventListener('change', () => {
    estado.ordem = ordemSel.value;
    renderizar();
  });

  /* --- Filtros em gaveta no mobile --- */
  const botaoFiltros = document.querySelector('[data-abrir-filtros]');
  if (botaoFiltros) {
    const gaveta = document.createElement('aside');
    gaveta.className = 'drawer drawer--esquerda';
    gaveta.id = 'drawer-filtros';
    gaveta.dataset.camada = 'filtros';
    gaveta.setAttribute('inert', '');
    gaveta.setAttribute('role', 'dialog');
    gaveta.setAttribute('aria-modal', 'true');
    gaveta.setAttribute('aria-label', 'Filtros');
    gaveta.innerHTML = `
      <div class="drawer__topo">
        <h2>Filtros</h2>
        <button class="btn-icone" type="button" data-fechar-filtros aria-label="Fechar filtros">
          ${icone('fechar', { classe: 'i--lg' })}
        </button>
      </div>
      <div class="drawer__corpo" data-gaveta-corpo></div>
      <div class="drawer__rodape">
        <button class="btn btn--primario btn--bloco btn--grande" type="button" data-fechar-filtros
                data-gaveta-total></button>
      </div>`;
    document.body.appendChild(gaveta);

    const corpoGaveta = gaveta.querySelector('[data-gaveta-corpo]');
    const rotuloVer = () =>
      'Ver ' + contador.textContent.replace(/ encontradas?$/, '');

    const fechar = () => {
      ancora.appendChild(painelFiltros);
      Loja.fecharCamada();
    };

    botaoFiltros.addEventListener('click', () => {
      corpoGaveta.appendChild(painelFiltros);
      gaveta.querySelector('[data-gaveta-total]').textContent = rotuloVer();
      Loja.abrirCamada(gaveta);
    });

    gaveta.querySelectorAll('[data-fechar-filtros]').forEach((b) => b.addEventListener('click', fechar));

    /* Mantem o rotulo do botao "Ver N pecas" em dia */
    const observador = new MutationObserver(() => {
      const alvo = gaveta.querySelector('[data-gaveta-total]');
      if (alvo) alvo.textContent = rotuloVer();
    });
    observador.observe(contador, { childList: true, characterData: true, subtree: true });
  }

  document.addEventListener('favoritos:mudou', () => {
    if (estado.somenteFavoritos) renderizar();
  });

  desenharFiltros();
  renderizar();
}

/* =========================================================
   PRODUTO
   ========================================================= */

/* Parcelamento automatico pelo valor da peca: parcelas de ~R$ 50, no maximo
   6x, e so libera 6x quando o valor chega a R$ 300 (abaixo disso, ate 5x). */
function parcelamento(preco) {
  const teto = preco >= 300 ? 6 : 5;
  let n = Math.round(preco / 50);
  if (n < 1) n = 1;
  if (n > teto) n = teto;
  return { n, valor: preco / n };
}

/* Consulta simulada de regiao por CEP (mesma tabela do checkout) */
function regiaoCep(cep) {
  const faixas = [
    [1, 11, 'São Paulo', 'SP'], [12, 12, 'São José dos Campos', 'SP'],
    [13, 19, 'Campinas', 'SP'], [20, 28, 'Rio de Janeiro', 'RJ'],
    [29, 29, 'Vitória', 'ES'], [30, 39, 'Belo Horizonte', 'MG'],
    [40, 48, 'Salvador', 'BA'], [50, 56, 'Recife', 'PE'],
    [60, 63, 'Fortaleza', 'CE'], [70, 73, 'Brasília', 'DF'],
    [80, 87, 'Curitiba', 'PR'], [88, 89, 'Florianópolis', 'SC'],
    [90, 99, 'Porto Alegre', 'RS']
  ];
  const prefixo = Number(cep.slice(0, 2));
  const faixa = faixas.find(([a, b]) => prefixo >= a && prefixo <= b);
  return faixa ? { cidade: faixa[2], uf: faixa[3] } : null;
}

function paginaProduto() {
  const alvo = document.querySelector('[data-produto]');
  const id = new URLSearchParams(location.search).get('id');
  const p = id ? produto(id) : null;

  if (!p) {
    alvo.innerHTML = `
      <div class="vazio">
        ${icone('pacote', { classe: 'i--xl' })}
        <h3>Nao encontramos essa peca</h3>
        <p>O link pode estar desatualizado ou a peca saiu de linha.</p>
        <a class="btn btn--primario" href="produtos.html">Ver o catalogo</a>
      </div>`;
    return;
  }

  document.title = `${p.nome} - Flor de Margarida`;

  const primeiroDisponivel = p.tamanhos.find((t) => t.disponivel);
  const estado = {
    cor: p.cores[0].nome,
    tamanho: p.tamanhos.length === 1 && primeiroDisponivel ? primeiroDisponivel.nome : null,
    quantidade: 1,
    vista: 0
  };

  const corHex = () => p.cores.find((c) => c.nome === estado.cor).hex;
  const desconto = p.precoAntigo
    ? Math.round(((p.precoAntigo - p.preco) / p.precoAntigo) * 100)
    : 0;

  const desenhar = () => {
    const favorito = favoritos.tem(p.id);

    alvo.innerHTML = `
      <nav class="migalhas" aria-label="Voce esta em">
        <a href="index.html">Inicio</a> ${icone('chevron_direita')}
        ${(() => {
          const c = Loja.categoria(p.categoria) || {};
          const d = DEPARTAMENTOS.find((x) => x.id === c.departamento);
          const g = GRUPOS.find((x) => x.id === c.grupo);
          return [
            d ? `<a href="produtos.html?departamento=${d.id}">${d.nome}</a> ${icone('chevron_direita')}` : '',
            g && g.nome ? `<a href="produtos.html?grupo=${g.id}">${g.nome}</a> ${icone('chevron_direita')}` : ''
          ].join('');
        })()}
        <a href="produtos.html?categoria=${p.categoria}">${nomeCategoria(p.categoria)}</a> ${icone('chevron_direita')}
        <span aria-current="page">${esc(p.nome)}</span>
      </nav>

      <div class="produto">
        <div class="galeria">
          <div class="galeria__miniaturas" role="group" aria-label="Vistas da peca">
            ${[0, 1, 2]
              .map(
                (v) => `<button class="galeria__mini" type="button" data-vista="${v}"
                  aria-pressed="${v === estado.vista}" aria-label="Ver imagem ${v + 1} de 3">
                  <img src="${imagem(p, corHex(), v)}" alt="" width="76" height="95" loading="lazy">
                </button>`
              )
              .join('')}
          </div>
          <div class="galeria__principal">
            <img src="${imagem(p, corHex(), estado.vista)}"
                 alt="${esc(p.nome)} na cor ${esc(estado.cor)}" width="400" height="500">
          </div>
        </div>

        <div>
          <div class="produto__cabeca">
            <p class="olho">${nomeCategoria(p.categoria)}</p>
            <h1 class="produto__titulo">${esc(p.nome)}</h1>
            ${estrelas(p.avaliacao)}
            <div class="produto__precos">
              <span class="preco numero${desconto ? ' preco--desconto' : ''}" style="font-size:1.75rem">${fmt(p.preco)}</span>
              ${p.precoAntigo ? `<span class="preco--antigo numero">${fmt(p.precoAntigo)}</span>` : ''}
              ${desconto ? `<span class="etiqueta etiqueta--oferta">-${desconto}%</span>` : ''}
            </div>
            ${(() => {
              const parc = parcelamento(p.preco);
              return parc.n >= 2
                ? `<p class="parcelas numero">ou em até ${parc.n}x de ${fmt(parc.valor)} sem juros</p>`
                : `<p class="parcelas numero">pagamento à vista</p>`;
            })()}
          </div>

          <div class="bloco-opcao">
            <div class="bloco-opcao__topo">
              <h3 id="rot-cor">Cor</h3>
              <span class="bloco-opcao__valor">${esc(estado.cor)}</span>
            </div>
            <div class="grade-cores" role="radiogroup" aria-labelledby="rot-cor">
              ${p.cores
                .map(
                  (c) => `<button class="cor-btn" type="button" role="radio"
                    aria-checked="${c.nome === estado.cor}" aria-label="${esc(c.nome)}" data-cor="${esc(c.nome)}">
                    <span class="cor-btn__disco" style="background:${c.hex}"></span></button>`
                )
                .join('')}
            </div>
          </div>

          <div class="bloco-opcao">
            <div class="bloco-opcao__topo">
              <h3 id="rot-tam">Tamanho${estado.tamanho ? `: ${estado.tamanho}` : ''}</h3>
              <button class="link-botao" type="button" data-abrir-medidas>
                ${icone('regua', { classe: 'i--sm' })} Guia de medidas
              </button>
            </div>
            <div class="grade-tamanhos" role="radiogroup" aria-labelledby="rot-tam">
              ${p.tamanhos
                .map(
                  (t) => `<button class="tam-btn" type="button" role="radio"
                    aria-checked="${t.nome === estado.tamanho}" ${t.disponivel ? '' : 'disabled'}
                    aria-label="Tamanho ${t.nome}${t.disponivel ? '' : ', esgotado'}" data-tamanho="${t.nome}">
                    ${t.nome}</button>`
                )
                .join('')}
            </div>
            <p class="campo__erro" data-erro-tamanho style="margin-top:10px">
              ${icone('alerta')}<span>Escolha um tamanho para adicionar a sacola.</span>
            </p>
            <p class="apoio" style="margin-top:8px">${esc(p.modeloVeste)}</p>
          </div>

          <div class="bloco-opcao">
            <div class="bloco-opcao__topo"><h3 id="rot-qtd">Quantidade</h3></div>
            <div class="quantidade" role="group" aria-labelledby="rot-qtd">
              <button type="button" data-qtd="-1" aria-label="Diminuir quantidade"
                ${estado.quantidade <= 1 ? 'disabled' : ''}>${icone('menos')}</button>
              <output aria-live="polite" aria-label="Quantidade">${estado.quantidade}</output>
              <button type="button" data-qtd="1" aria-label="Aumentar quantidade"
                ${estado.quantidade >= 10 ? 'disabled' : ''}>${icone('mais')}</button>
            </div>
          </div>

          <div class="acoes-produto">
            <button class="btn btn--primario btn--grande" type="button" data-adicionar>
              ${icone('sacola')} Adicionar a sacola
            </button>
            <button class="btn btn--contorno btn--grande" type="button" data-favoritar="${p.id}"
                    aria-pressed="${favorito}" aria-label="${favorito ? 'Remover dos' : 'Salvar nos'} favoritos">
              ${icone('coracao')}
            </button>
          </div>

          <div class="calc-frete" style="margin-top:12px">
            <button class="btn btn--contorno btn--bloco" type="button" data-abrir-frete
                    aria-expanded="false" aria-controls="calc-frete-corpo">
              ${icone('caminhao')} Calcular o frete
            </button>
            <div id="calc-frete-corpo" hidden style="margin-top:12px">
              <div class="campo" style="margin-bottom:0">
                <label class="campo__rotulo" for="cep-produto">Digite seu CEP</label>
                <div style="display:flex;gap:8px;align-items:flex-start">
                  <input type="text" id="cep-produto" inputmode="numeric" maxlength="9"
                         placeholder="00000-000" autocomplete="postal-code"
                         aria-describedby="frete-status" style="flex:1">
                  <button class="btn btn--primario" type="button" data-calcular-frete>Calcular</button>
                </div>
                <p class="campo__ajuda" data-frete-status aria-live="polite" style="margin-top:8px"></p>
              </div>
            </div>
          </div>

          <div class="selos-confianca" style="margin-top:20px">
            <span class="selo-confianca">${icone('caminhao')} Frete gratis acima de ${fmt(LIMITE_FRETE_GRATIS)}</span>
            <span class="selo-confianca">${icone('troca')} 30 dias para trocar</span>
            <span class="selo-confianca">${icone('escudo')} Compra protegida</span>
          </div>

          <div style="margin-top:32px">
            <div class="acordeao">
              <button class="acordeao__cabeca" type="button" aria-expanded="true" aria-controls="ac-1">
                Sobre a peca ${icone('chevron_baixo')}
              </button>
              <div class="acordeao__corpo" id="ac-1" data-aberto="true"><div>
                <p>${esc(p.descricao)}</p>
              </div></div>
            </div>
            <div class="acordeao">
              <button class="acordeao__cabeca" type="button" aria-expanded="false" aria-controls="ac-2">
                Composicao e cuidados ${icone('chevron_baixo')}
              </button>
              <div class="acordeao__corpo" id="ac-2" data-aberto="false"><div>
                <p><strong>Composicao:</strong> ${esc(p.composicao)}</p>
                <ul>${p.cuidados.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
              </div></div>
            </div>
            <div class="acordeao">
              <button class="acordeao__cabeca" type="button" aria-expanded="false" aria-controls="ac-3">
                Entrega e trocas ${icone('chevron_baixo')}
              </button>
              <div class="acordeao__corpo" id="ac-3" data-aberto="false"><div>
                <ul>
                  <li>Retirada na loja em 2 horas</li>
                  <li>Entrega padrão em 3 a 5 dias úteis</li>
                  <li>Entrega expressa em até 24 horas</li>
                  <li>Trocas gratuitas em até 30 dias, com a etiqueta original</li>
                </ul>
              </div></div>
            </div>
          </div>
        </div>
      </div>`;

    Componentes.ligarAcordeoes(alvo);

    alvo.querySelectorAll('[data-vista]').forEach((b) =>
      b.addEventListener('click', () => {
        estado.vista = Number(b.dataset.vista);
        desenhar();
      })
    );
    alvo.querySelectorAll('[data-cor]').forEach((b) =>
      b.addEventListener('click', () => {
        estado.cor = b.dataset.cor;
        desenhar();
      })
    );
    alvo.querySelectorAll('[data-tamanho]').forEach((b) =>
      b.addEventListener('click', () => {
        estado.tamanho = b.dataset.tamanho;
        desenhar();
      })
    );
    alvo.querySelectorAll('[data-qtd]').forEach((b) =>
      b.addEventListener('click', () => {
        estado.quantidade = Math.max(1, Math.min(10, estado.quantidade + Number(b.dataset.qtd)));
        desenhar();
      })
    );

    alvo.querySelector('[data-abrir-medidas]').addEventListener('click', abrirMedidas);

    alvo.querySelector('[data-adicionar]').addEventListener('click', (e) => {
      if (!estado.tamanho) {
        alvo.querySelector('[data-erro-tamanho]').style.display = 'flex';
        const primeiro = alvo.querySelector('.tam-btn:not([disabled])');
        if (primeiro) primeiro.focus();
        return;
      }
      const botao = e.currentTarget;
      botao.disabled = true;
      botao.innerHTML = '<span class="btn__spinner"></span> Adicionando';

      /* Ponto de integracao: POST /api/carrinho */
      setTimeout(() => {
        carrinho.adicionar({
          id: p.id,
          cor: estado.cor,
          tamanho: estado.tamanho,
          quantidade: estado.quantidade
        });
        botao.disabled = false;
        botao.innerHTML = `${icone('check')} Adicionado`;
        setTimeout(() => (botao.innerHTML = `${icone('sacola')} Adicionar a sacola`), 1600);
        toast(`${p.nome} (${estado.cor}, ${estado.tamanho}) na sacola`, {
          acao: 'Ver sacola',
          aoAcionar: () => {
            Loja.renderizarSacola();
            Loja.abrirCamada(document.querySelector('[data-camada="sacola"]'));
          }
        });
      }, 320);
    });

    /* Calcular o frete pelo CEP (consulta simulada) */
    const abrirFrete = alvo.querySelector('[data-abrir-frete]');
    const corpoFrete = alvo.querySelector('#calc-frete-corpo');
    const cepInput = alvo.querySelector('#cep-produto');
    const freteStatus = alvo.querySelector('[data-frete-status]');

    abrirFrete.addEventListener('click', () => {
      const aberto = abrirFrete.getAttribute('aria-expanded') === 'true';
      abrirFrete.setAttribute('aria-expanded', String(!aberto));
      corpoFrete.hidden = aberto;
      if (!aberto) cepInput.focus();
    });

    cepInput.addEventListener('input', () => {
      let v = cepInput.value.replace(/\D/g, '').slice(0, 8);
      if (v.length > 5) v = `${v.slice(0, 5)}-${v.slice(5)}`;
      cepInput.value = v;
    });

    const calcularFrete = () => {
      const limpo = cepInput.value.replace(/\D/g, '');
      if (limpo.length !== 8) {
        freteStatus.innerHTML = `${icone('alerta', { classe: 'i--sm' })} Digite um CEP válido com 8 dígitos.`;
        return;
      }
      const regiao = regiaoCep(limpo);
      if (!regiao) {
        freteStatus.innerHTML = `${icone('alerta', { classe: 'i--sm' })} Não localizamos esse CEP.`;
        return;
      }
      const padrao = FRETES.find((f) => f.id === 'padrao');
      const expressa = FRETES.find((f) => f.id === 'expressa');
      freteStatus.innerHTML = `
        <strong>${esc(regiao.cidade)}/${esc(regiao.uf)}</strong><br>
        ${esc(padrao.nome)}: ${fmt(padrao.preco)} &middot; ${esc(padrao.prazo)}<br>
        ${esc(expressa.nome)}: ${fmt(expressa.preco)} &middot; ${esc(expressa.prazo)}<br>
        <span class="suave">Frete grátis em compras acima de ${fmt(LIMITE_FRETE_GRATIS)}.</span>`;
    };

    alvo.querySelector('[data-calcular-frete]').addEventListener('click', calcularFrete);
    cepInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        calcularFrete();
      }
    });
  };

  /* Guia de medidas */
  const abrirMedidas = () => {
    let modal = document.querySelector('[data-camada="medidas"]');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal';
      modal.dataset.camada = 'medidas';
      modal.id = 'modal-medidas';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'titulo-medidas');
      modal.setAttribute('inert', '');
      modal.innerHTML = `
        <div class="modal__caixa">
          <button class="btn-icone modal__fechar" type="button" data-fechar-medidas aria-label="Fechar guia de medidas">
            ${icone('fechar', { classe: 'i--lg' })}
          </button>
          <h2 id="titulo-medidas">Guia de medidas</h2>
          <p class="suave">Medidas do corpo em centimetros. Na duvida entre dois tamanhos, escolha o maior.</p>
          <table class="tabela-medidas">
            <thead><tr>${TABELA_MEDIDAS.colunas.map((c) => `<th scope="col">${c}</th>`).join('')}</tr></thead>
            <tbody>
              ${TABELA_MEDIDAS.linhas
                .map(
                  (l) =>
                    `<tr><th scope="row">${l[0]}</th>${l.slice(1).map((c) => `<td>${c}</td>`).join('')}</tr>`
                )
                .join('')}
            </tbody>
          </table>
          <p class="apoio" style="margin-top:16px">
            Ainda em duvida? <a class="link" href="contato.html">Fale com a gente</a> e a gente ajuda a escolher.
          </p>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) Loja.fecharCamada();
      });
      modal.querySelector('[data-fechar-medidas]').addEventListener('click', Loja.fecharCamada);
    }
    Loja.abrirCamada(modal);
  };

  desenhar();

  /* Relacionados */
  const relacionados = PRODUTOS.filter((x) => x.categoria === p.categoria && x.id !== p.id).slice(0, 4);
  const secao = document.querySelector('[data-relacionados]');
  if (relacionados.length && secao) {
    secao.innerHTML = `
      <div class="secao-topo"><div><p class="olho">Combina com</p><h2>Da mesma familia</h2></div></div>
      <div class="grade-produtos">${relacionados.map(cardProduto).join('')}</div>`;
  }
}

/* =========================================================
   SACOLA
   ========================================================= */

function paginaCarrinho() {
  const alvo = document.querySelector('[data-carrinho]');
  const rascunho = Loja.checkout.ler();
  let cupom = rascunho.cupom || null;

  const desenhar = () => {
    const itens = carrinho.itens();

    if (!itens.length) {
      alvo.innerHTML = `
        <div class="vazio">
          ${icone('carrinho_vazio', { classe: 'i--xl' })}
          <h3>Sua sacola está vazia</h3>
          <p>Suas peças favoritas ficam guardadas aqui até você decidir.</p>
          <div class="linha" style="justify-content:center;margin-top:8px">
            <a class="btn btn--primario" href="produtos.html">Ver o catálogo</a>
            <a class="btn btn--contorno" href="produtos.html?favoritos=1">Meus favoritos</a>
          </div>
        </div>`;
      return;
    }

    const t = carrinho.totais({ freteId: 'padrao', cupom });

    alvo.innerHTML = `
      <div class="layout-carrinho">
        <section aria-label="Peças na sacola">
          ${itens
            .map(
              (i) => `
            <div class="item-linha">
              <a class="item-linha__midia" href="produto.html?id=${i.id}">
                <img src="${imagem(i.produto, i.corHex)}" alt="${esc(i.nome)}" width="96" height="120" loading="lazy">
              </a>
              <div>
                <p class="item-linha__nome">
                  <a href="produto.html?id=${i.id}">${esc(i.nome)}</a>
                </p>
                <p class="item-linha__variacao">
                  <span class="amostra" style="background:${i.corHex}"></span>${esc(i.cor)}
                  <span aria-hidden="true">&middot;</span> Tamanho ${esc(i.tamanho)}
                </p>
                <p class="apoio numero" style="margin:2px 0 0">${fmt(i.preco)} cada</p>
                <div class="item-linha__ctrl">
                  <div class="quantidade">
                    <button type="button" data-menos="${i.chave}" aria-label="Diminuir quantidade de ${esc(i.nome)}">${icone('menos')}</button>
                    <output aria-live="polite" aria-label="Quantidade de ${esc(i.nome)}">${i.quantidade}</output>
                    <button type="button" data-mais="${i.chave}" aria-label="Aumentar quantidade de ${esc(i.nome)}">${icone('mais')}</button>
                  </div>
                  <button class="btn btn--perigo" type="button" data-remover="${i.chave}">Remover</button>
                </div>
              </div>
              <div class="item-linha__valor numero">${fmt(i.subtotal)}</div>
            </div>`
            )
            .join('')}

          <div class="linha" style="margin-top:24px">
            <a class="btn btn--contorno" href="produtos.html">${icone('seta_esquerda')} Continuar comprando</a>
          </div>
        </section>

        <aside class="resumo">
          <div class="painel">
            <div class="painel__topo"><h3>Resumo</h3></div>

            ${
              t.faltaFreteGratis > 0
                ? `<p class="apoio" style="margin:0">Faltam <strong class="numero">${fmt(t.faltaFreteGratis)}</strong> para o frete grátis</p>
                   <div class="barra-progresso">
                     <div class="barra-progresso__preenchimento" style="transform:scaleX(${Math.min(
                       1,
                       t.subtotal / LIMITE_FRETE_GRATIS
                     ).toFixed(3)})"></div>
                   </div>`
                : `<p class="apoio" style="margin:0 0 12px;color:var(--c-sucesso);display:flex;align-items:center;gap:6px">
                     ${icone('check_circulo', { classe: 'i--sm' })} Frete grátis liberado</p>`
            }

            <div class="resumo__linha"><span>Subtotal (${carrinho.total()} ${carrinho.total() === 1 ? 'peça' : 'peças'})</span><span>${fmt(t.subtotal)}</span></div>
            ${
              t.descontoCupom
                ? `<div class="resumo__linha" style="color:var(--c-sucesso)"><span>Cupom ${esc(cupom)}</span><span>- ${fmt(t.descontoCupom)}</span></div>`
                : ''
            }
            <div class="resumo__linha"><span>Frete estimado</span><span>${t.frete === 0 ? 'Grátis' : fmt(t.frete)}</span></div>
            <div class="resumo__total"><span>Total</span><span>${fmt(t.total)}</span></div>
            ${(() => {
              const parc = parcelamento(t.total);
              return parc.n >= 2
                ? `<p class="apoio numero" style="margin:4px 0 0">ou em até ${parc.n}x de ${fmt(parc.valor)} sem juros</p>`
                : '';
            })()}

            <a class="btn btn--primario btn--bloco btn--grande" href="checkout.html" style="margin-top:16px">
              Finalizar compra ${icone('seta_direita')}
            </a>

            <div class="selos-confianca">
              <span class="selo-confianca">${icone('cadeado')} Ambiente seguro</span>
              <span class="selo-confianca">${icone('troca')} 30 dias para trocar</span>
            </div>
          </div>

          <div class="painel">
            <div class="painel__topo"><h3>Cupom</h3></div>
            <form class="cupom" data-form-cupom>
              <label class="sr-only" for="cupom">Código do cupom</label>
              <input type="text" id="cupom" name="cupom" placeholder="Ex: MARGARIDA10"
                     value="${cupom ? esc(cupom) : ''}" autocomplete="off">
              <button class="btn btn--contorno" type="submit">Aplicar</button>
            </form>
            <p class="campo__ajuda" style="margin-top:8px" data-cupom-msg>
              ${
                cupom
                  ? `Cupom <strong>${esc(cupom)}</strong> aplicado: ${CUPONS[cupom].descricao}.`
                  : 'Teste MARGARIDA10, PRIMEIRACOMPRA ou FRETEGRATIS.'
              }
            </p>
          </div>
        </aside>
      </div>`;

    const formCupom = alvo.querySelector('[data-form-cupom]');
    formCupom.addEventListener('submit', (e) => {
      e.preventDefault();
      const codigo = formCupom.cupom.value.trim().toUpperCase();
      const msg = alvo.querySelector('[data-cupom-msg]');
      if (!codigo) {
        cupom = null;
        Loja.checkout.salvar({ cupom: null });
        desenhar();
        return;
      }
      if (!CUPONS[codigo]) {
        msg.innerHTML = `<span style="color:var(--c-perigo)">Cupom "${esc(codigo)}" não existe ou expirou. Confira o código e tente de novo.</span>`;
        formCupom.cupom.focus();
        return;
      }
      cupom = codigo;
      Loja.checkout.salvar({ cupom });
      toast(`Cupom aplicado: ${CUPONS[codigo].descricao}`);
      desenhar();
    });
  };

  alvo.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-mais], [data-menos], [data-remover]');
    if (!botao) return;
    const { mais, menos, remover } = botao.dataset;

    if (remover) {
      const item = carrinho.itens().find((i) => i.chave === remover);
      carrinho.remover(remover);
      if (item) {
        toast(`${item.nome} removido da sacola`, {
          acao: 'Desfazer',
          aoAcionar: () => {
            carrinho.restaurar(item);
            desenhar();
          }
        });
      }
    } else {
      const chave = mais || menos;
      const item = carrinho.itens().find((i) => i.chave === chave);
      if (item) carrinho.definirQuantidade(chave, item.quantidade + (mais ? 1 : -1));
    }
    desenhar();
  });

  desenhar();
}

/* =========================================================
   CHECKOUT - 4 etapas + confirmacao
   ========================================================= */

const ETAPAS = [
  { id: 1, titulo: 'Identificação' },
  { id: 2, titulo: 'Entrega' },
  { id: 3, titulo: 'Pagamento' },
  { id: 4, titulo: 'Revisão' }
];

function paginaCheckout() {
  const raiz = document.querySelector('[data-checkout]');
  const trilha = document.querySelector('[data-passos]');
  const painelResumo = document.querySelector('[data-resumo]');

  if (!carrinho.itens().length) {
    document.querySelector('[data-checkout-layout]').innerHTML = `
      <div class="vazio">
        ${icone('carrinho_vazio', { classe: 'i--xl' })}
        <h3>Não há nada para finalizar</h3>
        <p>Sua sacola está vazia. Escolha uma peça para continuar.</p>
        <a class="btn btn--primario" href="produtos.html">Ver o catálogo</a>
      </div>`;
    trilha.remove();
    return;
  }

  const dados = Loja.checkout.ler();
  let etapa = 1;

  /* --- Consulta de CEP simulada (troque por ViaCEP ou similar) --- */
  const consultarCep = (cep) =>
    new Promise((resolve) => {
      setTimeout(() => {
        const faixas = [
          [1, 11, 'São Paulo', 'SP'], [12, 12, 'São José dos Campos', 'SP'],
          [13, 19, 'Campinas', 'SP'], [20, 28, 'Rio de Janeiro', 'RJ'],
          [29, 29, 'Vitória', 'ES'], [30, 39, 'Belo Horizonte', 'MG'],
          [40, 48, 'Salvador', 'BA'], [50, 56, 'Recife', 'PE'],
          [60, 63, 'Fortaleza', 'CE'], [70, 73, 'Brasília', 'DF'],
          [80, 87, 'Curitiba', 'PR'], [88, 89, 'Florianópolis', 'SC'],
          [90, 99, 'Porto Alegre', 'RS']
        ];
        const prefixo = Number(cep.slice(0, 2));
        const faixa = faixas.find(([a, b]) => prefixo >= a && prefixo <= b);
        resolve(faixa ? { cidade: faixa[2], uf: faixa[3], bairro: 'Centro' } : null);
      }, 600);
    });

  /* --- Trilha de passos --- */
  const desenharPassos = () => {
    trilha.innerHTML = ETAPAS.map((e, i) => {
      const estadoPasso = e.id === etapa ? 'ativo' : e.id < etapa ? 'feito' : 'futuro';
      return `
        ${i > 0 ? '<span class="passo__traco" aria-hidden="true"></span>' : ''}
        <span class="passo" data-estado="${estadoPasso}"
              ${e.id === etapa ? 'aria-current="step"' : ''}>
          <span class="passo__num numero">${estadoPasso === 'feito' ? icone('check', { classe: 'i--sm' }) : e.id}</span>
          <span>${e.titulo}</span>
        </span>`;
    }).join('');
  };

  /* --- Resumo lateral --- */
  const desenharResumo = () => {
    const itens = carrinho.itens();
    const t = carrinho.totais({
      freteId: dados.frete || 'padrao',
      cupom: dados.cupom || null,
      pagamentoId: dados.pagamento || null
    });

    painelResumo.innerHTML = `
      <div class="painel">
        <div class="painel__topo">
          <h3>Seu pedido</h3>
          <a class="link-botao" href="carrinho.html">Editar</a>
        </div>

        <div style="display:grid;gap:12px;margin-bottom:16px">
          ${itens
            .map(
              (i) => `
            <div style="display:grid;grid-template-columns:48px 1fr auto;gap:12px;align-items:center">
              <img src="${imagem(i.produto, i.corHex)}" alt="" width="48" height="60"
                   style="width:48px;height:60px;object-fit:cover;border-radius:6px">
              <div style="min-width:0">
                <div style="font-size:.875rem;font-weight:600">${esc(i.nome)}</div>
                <div class="apoio">${esc(i.cor)} &middot; ${esc(i.tamanho)} &middot; ${i.quantidade}x</div>
              </div>
              <strong class="numero" style="font-size:.875rem">${fmt(i.subtotal)}</strong>
            </div>`
            )
            .join('')}
        </div>

        <div class="resumo__linha"><span>Subtotal</span><span>${fmt(t.subtotal)}</span></div>
        ${t.descontoCupom ? `<div class="resumo__linha" style="color:var(--c-sucesso)"><span>Cupom ${esc(dados.cupom)}</span><span>- ${fmt(t.descontoCupom)}</span></div>` : ''}
        <div class="resumo__linha"><span>${t.opcaoFrete.nome}</span><span>${t.frete === 0 ? 'Grátis' : fmt(t.frete)}</span></div>
        ${t.descontoPagamento ? `<div class="resumo__linha" style="color:var(--c-sucesso)"><span>Desconto Pix</span><span>- ${fmt(t.descontoPagamento)}</span></div>` : ''}
        <div class="resumo__total"><span>Total</span><span>${fmt(t.total)}</span></div>

        <div class="selos-confianca">
          <span class="selo-confianca">${icone('cadeado')} Dados protegidos</span>
          <span class="selo-confianca">${icone('troca')} 30 dias para trocar</span>
        </div>
      </div>`;
  };

  /* --- Etapa 1: identificacao --- */
  const etapaIdentificacao = () => `
    <form class="etapa" data-form-etapa novalidate>
      <div class="resumo-erros" role="alert" aria-live="assertive"></div>
      <div class="painel">
        <div class="painel__topo"><h3>Quem está comprando</h3></div>

        <div class="campo">
          <label class="campo__rotulo" for="nome">Nome completo <span class="obrigatorio" aria-hidden="true">*</span></label>
          <input type="text" id="nome" name="nome" required autocomplete="name"
                 data-regra="nome" data-nome-campo="O nome" value="${esc(dados.nome || '')}">
          <p class="campo__ajuda">Como aparece no documento.</p>
          <p class="campo__erro"></p>
        </div>

        <div class="dupla">
          <div class="campo">
            <label class="campo__rotulo" for="email">E-mail <span class="obrigatorio" aria-hidden="true">*</span></label>
            <input type="email" id="email" name="email" required autocomplete="email" inputmode="email"
                   data-regra="email" data-nome-campo="O e-mail" value="${esc(dados.email || '')}">
            <p class="campo__ajuda">Enviamos o código de rastreio para cá.</p>
            <p class="campo__erro"></p>
          </div>
          <div class="campo">
            <label class="campo__rotulo" for="telefone">Celular <span class="obrigatorio" aria-hidden="true">*</span></label>
            <input type="tel" id="telefone" name="telefone" required autocomplete="tel" inputmode="tel"
                   placeholder="(11) 91234-5678" data-mascara="telefone" data-regra="telefone"
                   data-nome-campo="O celular" value="${esc(dados.telefone || '')}">
            <p class="campo__erro"></p>
          </div>
        </div>

        <div class="campo">
          <label class="campo__rotulo" for="cpf">CPF <span class="obrigatorio" aria-hidden="true">*</span></label>
          <input type="text" id="cpf" name="cpf" required autocomplete="off" inputmode="numeric"
                 placeholder="000.000.000-00" data-mascara="cpf" data-regra="cpf"
                 data-nome-campo="O CPF" value="${esc(dados.cpf || '')}">
          <p class="campo__ajuda">Usado apenas para emissão da nota fiscal.</p>
          <p class="campo__erro"></p>
        </div>
      </div>

      <div class="acoes-etapa">
        <a class="btn btn--fantasma" href="carrinho.html">${icone('seta_esquerda')} Voltar à sacola</a>
        <button class="btn btn--primario btn--grande" type="submit">Continuar para entrega ${icone('seta_direita')}</button>
      </div>
    </form>`;

  /* --- Etapa 2: entrega --- */
  const etapaEntrega = () => `
    <form class="etapa" data-form-etapa novalidate>
      <div class="resumo-erros" role="alert" aria-live="assertive"></div>

      <div class="painel">
        <div class="painel__topo"><h3>Endereço de entrega</h3></div>

        <div class="dupla">
          <div class="campo">
            <label class="campo__rotulo" for="cep">CEP <span class="obrigatorio" aria-hidden="true">*</span></label>
            <input type="text" id="cep" name="cep" required inputmode="numeric" autocomplete="postal-code"
                   placeholder="00000-000" data-mascara="cep" data-regra="cep"
                   data-nome-campo="O CEP" value="${esc(dados.cep || '')}">
            <p class="campo__ajuda" data-cep-status>Preenchemos cidade e estado para você.</p>
            <p class="campo__erro"></p>
          </div>
          <div class="campo">
            <label class="campo__rotulo" for="numero">Número <span class="obrigatorio" aria-hidden="true">*</span></label>
            <input type="text" id="numero" name="numero" required inputmode="numeric"
                   data-nome-campo="O numero" value="${esc(dados.numero || '')}">
            <p class="campo__erro"></p>
          </div>
        </div>

        <div class="campo">
          <label class="campo__rotulo" for="endereco">Rua <span class="obrigatorio" aria-hidden="true">*</span></label>
          <input type="text" id="endereco" name="endereco" required autocomplete="street-address"
                 data-nome-campo="A rua" value="${esc(dados.endereco || '')}">
          <p class="campo__erro"></p>
        </div>

        <div class="dupla">
          <div class="campo">
            <label class="campo__rotulo" for="bairro">Bairro <span class="obrigatorio" aria-hidden="true">*</span></label>
            <input type="text" id="bairro" name="bairro" required data-nome-campo="O bairro"
                   value="${esc(dados.bairro || '')}">
            <p class="campo__erro"></p>
          </div>
          <div class="campo">
            <label class="campo__rotulo" for="complemento">Complemento <span class="campo__opcional">opcional</span></label>
            <input type="text" id="complemento" name="complemento" placeholder="Apto, bloco, referência"
                   value="${esc(dados.complemento || '')}">
          </div>
        </div>

        <div class="dupla">
          <div class="campo">
            <label class="campo__rotulo" for="cidade">Cidade <span class="obrigatorio" aria-hidden="true">*</span></label>
            <input type="text" id="cidade" name="cidade" required autocomplete="address-level2"
                   data-nome-campo="A cidade" value="${esc(dados.cidade || '')}">
            <p class="campo__erro"></p>
          </div>
          <div class="campo">
            <label class="campo__rotulo" for="uf">Estado <span class="obrigatorio" aria-hidden="true">*</span></label>
            <select id="uf" name="uf" required data-nome-campo="O estado">
              <option value="">Selecione</option>
              ${['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS', 'BA', 'PE', 'CE', 'DF', 'GO']
                .map((uf) => `<option value="${uf}"${dados.uf === uf ? ' selected' : ''}>${uf}</option>`)
                .join('')}
            </select>
            <p class="campo__erro"></p>
          </div>
        </div>
      </div>

      <div class="painel">
        <div class="painel__topo"><h3>Como você quer receber</h3></div>
        <div class="escolhas" role="radiogroup" aria-label="Forma de entrega">
          ${FRETES.map(
            (f) => `
            <label class="escolha">
              <input type="radio" name="frete" value="${f.id}" ${(dados.frete || 'padrao') === f.id ? 'checked' : ''}>
              <span class="escolha__marca"></span>
              <span class="escolha__icone">${icone(f.icone)}</span>
              <span class="escolha__texto">
                <strong>${f.nome}</strong>
                <span>${f.prazo}</span>
              </span>
              <span class="escolha__valor">${f.preco === 0 ? 'Grátis' : fmt(f.preco)}</span>
            </label>`
          ).join('')}
        </div>
        <p class="campo__ajuda" style="margin-top:12px">
          ${icone('info', { classe: 'i--sm' })} Frete padrão sai de graça em compras acima de ${fmt(LIMITE_FRETE_GRATIS)}.
        </p>
      </div>

      <div class="acoes-etapa">
        <button class="btn btn--fantasma" type="button" data-voltar>${icone('seta_esquerda')} Voltar</button>
        <button class="btn btn--primario btn--grande" type="submit">Continuar para pagamento ${icone('seta_direita')}</button>
      </div>
    </form>`;

  /* --- Etapa 3: pagamento (somente selecao, sem processamento) --- */
  const etapaPagamento = () => {
    const escolhido = dados.pagamento || 'pix';
    return `
    <form class="etapa" data-form-etapa novalidate>
      <div class="resumo-erros" role="alert" aria-live="assertive"></div>

      <div class="painel">
        <div class="painel__topo"><h3>Forma de pagamento</h3></div>
        <div class="escolhas" role="radiogroup" aria-label="Forma de pagamento">
          ${PAGAMENTOS.map(
            (m) => `
            <label class="escolha">
              <input type="radio" name="pagamento" value="${m.id}" ${escolhido === m.id ? 'checked' : ''}>
              <span class="escolha__marca"></span>
              <span class="escolha__icone">${icone(m.icone)}</span>
              <span class="escolha__texto">
                <strong>${m.nome}</strong>
                <span>${m.detalhe}</span>
              </span>
            </label>`
          ).join('')}
        </div>

        <div data-detalhe-pagamento style="margin-top:20px"></div>

        <p class="campo__ajuda" style="margin-top:20px;display:flex;gap:8px;align-items:flex-start">
          ${icone('info', { classe: 'i--sm' })}
          <span>Demonstração: a seleção é registrada no pedido, mas nenhuma cobrança é feita e nenhum dado
          de pagamento sai do seu navegador.</span>
        </p>
      </div>

      <div class="acoes-etapa">
        <button class="btn btn--fantasma" type="button" data-voltar>${icone('seta_esquerda')} Voltar</button>
        <button class="btn btn--primario btn--grande" type="submit">Revisar pedido ${icone('seta_direita')}</button>
      </div>
    </form>`;
  };

  const detalhePagamento = (metodo, container) => {
    const totalCarrinho = carrinho.totais({
      freteId: dados.frete || 'padrao',
      cupom: dados.cupom || null
    }).total;
    const maxParcelas = parcelamento(totalCarrinho).n;

    if (metodo === 'pix') {
      container.innerHTML = `
        <div class="painel" style="background:var(--c-superficie-2);border-style:dashed">
          <div class="linha" style="align-items:flex-start;gap:16px;flex-wrap:nowrap">
            <span class="escolha__icone">${icone('pix')}</span>
            <div>
              <strong>QR Code e copia e cola na confirmação do pedido</strong>
              <p class="apoio" style="margin:4px 0 0">
                Pague pelo app do seu banco em até 30 minutos. O pedido é separado assim que o Pix cair.
              </p>
            </div>
          </div>
        </div>`;
      return;
    }

    if (metodo === 'boleto') {
      container.innerHTML = `
        <div class="painel" style="background:var(--c-superficie-2);border-style:dashed">
          <div class="linha" style="align-items:flex-start;gap:16px;flex-wrap:nowrap">
            <span class="escolha__icone">${icone('codigo_barras')}</span>
            <div>
              <strong>Boleto disponível na confirmação</strong>
              <p class="apoio" style="margin:4px 0 0">
                Vence em 2 dias úteis. As peças ficam reservadas até a compensação.
              </p>
            </div>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="painel" style="background:var(--c-superficie-2)">
        <div class="campo">
          <label class="campo__rotulo" for="cartao-numero">Número do cartão <span class="obrigatorio" aria-hidden="true">*</span></label>
          <input type="text" id="cartao-numero" name="cartaoNumero" required inputmode="numeric"
                 placeholder="0000 0000 0000 0000" data-mascara="cartao" data-regra="cartao"
                 data-nome-campo="O numero do cartao" autocomplete="off">
          <p class="campo__erro"></p>
        </div>
        <div class="campo">
          <label class="campo__rotulo" for="cartao-nome">Nome impresso no cartão <span class="obrigatorio" aria-hidden="true">*</span></label>
          <input type="text" id="cartao-nome" name="cartaoNome" required data-nome-campo="O nome do cartao" autocomplete="off">
          <p class="campo__erro"></p>
        </div>
        <div class="tripla">
          <div class="campo">
            <label class="campo__rotulo" for="cartao-validade">Validade <span class="obrigatorio" aria-hidden="true">*</span></label>
            <input type="text" id="cartao-validade" name="cartaoValidade" required inputmode="numeric"
                   placeholder="MM/AA" data-mascara="validade" data-regra="validade"
                   data-nome-campo="A validade" autocomplete="off">
            <p class="campo__erro"></p>
          </div>
          <div class="campo">
            <label class="campo__rotulo" for="cartao-cvv">CVV <span class="obrigatorio" aria-hidden="true">*</span></label>
            <input type="text" id="cartao-cvv" name="cartaoCvv" required inputmode="numeric"
                   placeholder="000" data-mascara="cvv" data-regra="cvv"
                   data-nome-campo="O CVV" autocomplete="off">
            <p class="campo__erro"></p>
          </div>
          <div class="campo">
            <label class="campo__rotulo" for="parcelas">Parcelas</label>
            <select id="parcelas" name="parcelas">
              ${Array.from({ length: maxParcelas }, (_, k) => k + 1)
                .map((n) => `<option value="${n}">${n}x sem juros</option>`)
                .join('')}
            </select>
          </div>
        </div>
        <p class="campo__ajuda">
          ${icone('cadeado', { classe: 'i--sm' })} Campos de demonstração. Nada é enviado, salvo ou cobrado.
        </p>
      </div>`;
  };

  /* --- Etapa 4: revisao --- */
  const etapaRevisao = () => {
    const t = carrinho.totais({
      freteId: dados.frete || 'padrao',
      cupom: dados.cupom || null,
      pagamentoId: dados.pagamento
    });
    const metodo = PAGAMENTOS.find((m) => m.id === dados.pagamento) || PAGAMENTOS[0];

    return `
      <form class="etapa" data-form-etapa novalidate>
        <div class="painel">
          <div class="painel__topo"><h3>Confira antes de confirmar</h3></div>
          <dl style="margin:0">
            <div class="revisao-bloco">
              <div class="revisao-bloco__topo">
                <div>
                  <dt>Contato</dt>
                  <dd>${esc(dados.nome || '')}</dd>
                  <dd class="suave">${esc(dados.email || '')} &middot; ${esc(dados.telefone || '')}</dd>
                </div>
                <button class="link-botao" type="button" data-ir="1">Alterar</button>
              </div>
            </div>
            <div class="revisao-bloco">
              <div class="revisao-bloco__topo">
                <div>
                  <dt>Entrega</dt>
                  <dd>${esc(dados.endereco || '')}, ${esc(dados.numero || '')}${dados.complemento ? ` - ${esc(dados.complemento)}` : ''}</dd>
                  <dd class="suave">${esc(dados.bairro || '')} &middot; ${esc(dados.cidade || '')}/${esc(dados.uf || '')} &middot; ${esc(dados.cep || '')}</dd>
                  <dd class="suave">${t.opcaoFrete.nome} &middot; ${t.opcaoFrete.prazo}</dd>
                </div>
                <button class="link-botao" type="button" data-ir="2">Alterar</button>
              </div>
            </div>
            <div class="revisao-bloco">
              <div class="revisao-bloco__topo">
                <div>
                  <dt>Pagamento</dt>
                  <dd>${metodo.nome}</dd>
                  <dd class="suave">${metodo.detalhe}</dd>
                </div>
                <button class="link-botao" type="button" data-ir="3">Alterar</button>
              </div>
            </div>
          </dl>
        </div>

        <div class="painel">
          <div class="painel__topo"><h3>Total a pagar</h3></div>
          <div class="resumo__linha"><span>Subtotal</span><span>${fmt(t.subtotal)}</span></div>
          ${t.descontoCupom ? `<div class="resumo__linha" style="color:var(--c-sucesso)"><span>Cupom</span><span>- ${fmt(t.descontoCupom)}</span></div>` : ''}
          <div class="resumo__linha"><span>Entrega</span><span>${t.frete === 0 ? 'Grátis' : fmt(t.frete)}</span></div>
          ${t.descontoPagamento ? `<div class="resumo__linha" style="color:var(--c-sucesso)"><span>Desconto ${metodo.nome}</span><span>- ${fmt(t.descontoPagamento)}</span></div>` : ''}
          <div class="resumo__total"><span>Total</span><span>${fmt(t.total)}</span></div>
        </div>

        <div class="acoes-etapa">
          <button class="btn btn--fantasma" type="button" data-voltar>${icone('seta_esquerda')} Voltar</button>
          <button class="btn btn--primario btn--grande" type="submit" data-confirmar>
            ${icone('cadeado')} Confirmar pedido
          </button>
        </div>
      </form>`;
  };

  /* --- Confirmacao --- */
  const mostrarConfirmacao = (pedido) => {
    document.querySelector('[data-checkout-layout]').innerHTML = `
      <div class="confirmacao">
        <div class="confirmacao__icone">${icone('check', { classe: 'i--xl' })}</div>
        <h1>Pedido confirmado</h1>
        <p class="suave" style="margin-inline:auto">
          Obrigada, ${esc((pedido.cliente.nome || '').split(' ')[0])}. Já estamos separando suas peças.
        </p>
        <div class="pedido-codigo">${icone('pacote')} ${pedido.codigo}</div>

        <div class="linha-tempo">
          <div class="linha-tempo__item" data-atual="true">
            <span class="linha-tempo__ponto">${icone('check', { classe: 'i--sm' })}</span>
            <div><strong>Pedido recebido</strong><span>Confirmação enviada para ${esc(pedido.cliente.email)}</span></div>
          </div>
          <div class="linha-tempo__item">
            <span class="linha-tempo__ponto">${icone('tesoura', { classe: 'i--sm' })}</span>
            <div><strong>Separação e conferência</strong><span>Até 1 dia útil</span></div>
          </div>
          <div class="linha-tempo__item">
            <span class="linha-tempo__ponto">${icone('caminhao', { classe: 'i--sm' })}</span>
            <div><strong>${esc(pedido.entrega.nome)}</strong><span>${esc(pedido.entrega.prazo)}</span></div>
          </div>
        </div>

        ${pedido.pagamentoId === 'pix' ? '<div class="painel" style="text-align:left" data-pix></div>' : ''}

        <div class="painel" style="text-align:left">
          <div class="resumo__linha"><span>Forma de pagamento</span><span>${esc(pedido.pagamento)}</span></div>
          <div class="resumo__linha"><span>Itens</span><span class="numero">${pedido.itens.length}</span></div>
          <div class="resumo__total"><span>Total</span><span>${fmt(pedido.total)}</span></div>
        </div>

        ${
          pedido.pagamentoId === 'pix'
            ? ''
            : `<p class="apoio" style="margin-top:24px">
          Demonstração: nenhuma cobrança foi feita e nenhum e-mail foi enviado de verdade.
        </p>`
        }
        <div class="linha" style="justify-content:center;margin-top:8px">
          <a class="btn btn--primario" href="produtos.html">Continuar comprando</a>
          <a class="btn btn--contorno" href="index.html">Voltar ao início</a>
        </div>
      </div>`;

    if (pedido.pagamentoId === 'pix' && typeof Pix !== 'undefined') {
      Pix.renderizar(document.querySelector('[data-pix]'), {
        valor: pedido.total,
        txid: pedido.codigo.replace(/[^A-Za-z0-9]/g, ''),
        descricao: `Pedido ${pedido.codigo}`
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* --- Render de etapa --- */
  const renderizarEtapa = () => {
    const mapa = { 1: etapaIdentificacao, 2: etapaEntrega, 3: etapaPagamento, 4: etapaRevisao };
    raiz.innerHTML = mapa[etapa]();
    desenharPassos();
    desenharResumo();

    const form = raiz.querySelector('[data-form-etapa]');
    Componentes.ligarValidacao(form);

    const voltar = form.querySelector('[data-voltar]');
    if (voltar) voltar.addEventListener('click', () => irPara(etapa - 1));

    form.querySelectorAll('[data-ir]').forEach((b) =>
      b.addEventListener('click', () => irPara(Number(b.dataset.ir)))
    );

    /* Etapa 2: consulta de CEP e recalculo do frete */
    if (etapa === 2) {
      const cep = form.querySelector('#cep');
      const status = form.querySelector('[data-cep-status]');
      cep.addEventListener('blur', async () => {
        const limpo = cep.value.replace(/\D/g, '');
        if (limpo.length !== 8) return;
        status.innerHTML = `<span class="btn__spinner" style="display:inline-block;vertical-align:-2px"></span> Buscando endereço...`;
        const achado = await consultarCep(limpo);
        if (achado) {
          form.querySelector('#cidade').value = achado.cidade;
          form.querySelector('#uf').value = achado.uf;
          if (!form.querySelector('#bairro').value) form.querySelector('#bairro').value = achado.bairro;
          status.innerHTML = `${icone('check_circulo', { classe: 'i--sm' })} Endereço encontrado. Confira e complete o número.`;
          form.querySelector('#numero').focus();
        } else {
          status.innerHTML = `${icone('alerta', { classe: 'i--sm' })} Não localizamos esse CEP. Preencha cidade e estado manualmente.`;
        }
      });

      form.querySelectorAll('[name="frete"]').forEach((r) =>
        r.addEventListener('change', () => {
          dados.frete = r.value;
          Loja.checkout.salvar({ frete: r.value });
          desenharResumo();
        })
      );
    }

    /* Etapa 3: alterna o detalhe conforme o metodo */
    if (etapa === 3) {
      const container = form.querySelector('[data-detalhe-pagamento]');
      const aplicar = (valor) => {
        dados.pagamento = valor;
        Loja.checkout.salvar({ pagamento: valor });
        detalhePagamento(valor, container);
        Componentes.ligarValidacao(form);
        desenharResumo();
      };
      form.querySelectorAll('[name="pagamento"]').forEach((r) =>
        r.addEventListener('change', () => aplicar(r.value))
      );
      aplicar(dados.pagamento || 'pix');
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!Componentes.validarFormulario(form)) return;

      Object.assign(dados, Componentes.dadosDoFormulario(form));
      Loja.checkout.salvar(dados);

      if (etapa < 4) {
        irPara(etapa + 1);
        return;
      }

      /* Confirmacao: aqui entraria POST /api/pedidos + gateway de pagamento */
      const botao = form.querySelector('[data-confirmar]');
      botao.disabled = true;
      botao.innerHTML = '<span class="btn__spinner"></span> Confirmando';

      setTimeout(() => {
        const t = carrinho.totais({
          freteId: dados.frete || 'padrao',
          cupom: dados.cupom || null,
          pagamentoId: dados.pagamento
        });
        const metodo = PAGAMENTOS.find((m) => m.id === dados.pagamento) || PAGAMENTOS[0];
        const pedido = {
          codigo: 'FM-' + String(Math.floor(100000 + Math.random() * 899999)),
          cliente: { nome: dados.nome, email: dados.email, telefone: dados.telefone },
          endereco: {
            cep: dados.cep, rua: dados.endereco, numero: dados.numero,
            bairro: dados.bairro, cidade: dados.cidade, uf: dados.uf
          },
          entrega: t.opcaoFrete,
          pagamento: metodo.nome,
          pagamentoId: metodo.id,
          itens: carrinho.itens().map((i) => ({
            nome: i.nome, cor: i.cor, tamanho: i.tamanho, quantidade: i.quantidade, preco: i.preco
          })),
          total: t.total,
          data: new Date().toISOString()
        };

        Loja.pedidos.salvar(pedido);
        carrinho.limpar();
        Loja.checkout.limpar();
        trilha.remove();
        mostrarConfirmacao(pedido);
      }, 900);
    });

    /* Foco no inicio da etapa, para leitor de tela e teclado */
    const titulo = raiz.querySelector('h3');
    if (titulo) {
      titulo.setAttribute('tabindex', '-1');
      titulo.focus({ preventScroll: true });
    }
  };

  const irPara = (n) => {
    etapa = Math.max(1, Math.min(4, n));
    renderizarEtapa();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  renderizarEtapa();
}

/* =========================================================
   CONTATO
   ========================================================= */

function paginaContato() {
  const form = document.querySelector('[data-form-contato]');
  if (!form) return;
  Componentes.ligarValidacao(form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!Componentes.validarFormulario(form)) return;

    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    botao.innerHTML = '<span class="btn__spinner"></span> Enviando';

    setTimeout(() => {
      form.innerHTML = `
        <div class="vazio" style="padding:32px 0">
          ${icone('check_circulo', { classe: 'i--xl' })}
          <h3>Mensagem enviada</h3>
          <p>Respondemos em ate 1 dia util no e-mail informado.</p>
        </div>`;
      toast('Mensagem enviada com sucesso');
    }, 700);
  });
}

/* =========================================================
   ROTEADOR
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  Loja.iniciar();
  Componentes.ligarGrades();
  Componentes.ligarAcordeoes();

  const rotas = {
    inicio: paginaInicio,
    produtos: paginaProdutos,
    produto: paginaProduto,
    carrinho: paginaCarrinho,
    checkout: paginaCheckout,
    contato: paginaContato,
    provador: () => typeof Prova !== 'undefined' && Prova.iniciar(),
    customize: () => typeof Customize !== 'undefined' && Customize.iniciar()
  };

  const rota = rotas[document.body.dataset.pagina];
  if (rota) rota();

  /* Home com rota #customize: esconde a vitrine e mostra o painel. */
  const painel = document.querySelector('[data-painel-customize]');
  const home = document.querySelector('[data-home]');
  if (painel && home) {
    let iniciado = false;
    const aplicarHash = () => {
      const ativo = location.hash === '#customize';
      painel.hidden = !ativo;
      home.hidden = ativo;
      document.title = ativo ? 'Customize - Flor de Margarida' : 'Flor de Margarida - Moda Feminina e Acessorios';
      document.querySelectorAll('.nav-principal a').forEach((a) => {
        const eCustomize = a.getAttribute('href') === 'index.html#customize';
        if (ativo === eCustomize) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      if (ativo && !iniciado && typeof Customize !== 'undefined') {
        iniciado = true;
        Customize.iniciar();
      }
      if (ativo) window.scrollTo(0, 0);
    };
    aplicarHash();
    window.addEventListener('hashchange', aplicarHash);
  }
});
