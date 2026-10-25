/* =========================================================
   Nucleo: formatacao, imagens, tema, carrinho, favoritos,
   toasts, foco acessivel, cabecalho e rodape compartilhados.
   ========================================================= */

const Loja = (() => {
  const K_CARRINHO = 'fm:carrinho';
  const K_FAVORITOS = 'fm:favoritos';
  const K_TEMA = 'fm:tema';
  const K_CHECKOUT = 'fm:checkout';
  const K_PEDIDOS = 'fm:pedidos';

  /* ---------------- Utilitarios ---------------- */

  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const esc = (t) =>
    String(t).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  const produto = (id) => PRODUTOS.find((p) => p.id === id) || null;

  const categoria = (id) => CATEGORIAS.find((c) => c.id === id) || null;

  const nomeCategoria = (id) => (categoria(id) || {}).nome || id;

  const luminancia = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  };

  /* Imagem do produto: silhueta vetorial sobre painel tonal.
     Substituir por <img src="produto.fotos[i]"> quando houver fotografia. */
  const VISTAS = [
    'translate(4 14) scale(.92)',
    'translate(-12 -4) scale(1.26)',
    'rotate(-7 50 62) translate(6 18) scale(.86)'
  ];

  /* Peca com foto real: card e zoom vem prontos de ferramentas/preparar_peca.py.
     A cor selecionada nao muda a foto (cada foto e de uma cor). */
  const imagem = (prod, corHex, vista = 0) => {
    if (prod.foto) return vista === 1 ? prod.foto.zoom : prod.foto.card;
    return imagemSilhueta(prod, corHex, vista);
  };

  const imagemSilhueta = (prod, corHex, vista = 0) => {
    const silhueta = SILHUETAS[prod.silhueta] || SILHUETAS.camiseta;
    const [f1, f2] = FUNDOS[prod.fundo] || FUNDOS.areia;
    const cor = corHex || (prod.cores[0] && prod.cores[0].hex) || '#c9beb0';
    const traco = luminancia(cor) > 0.55 ? 'rgba(20,16,12,.30)' : 'rgba(255,255,255,.42)';
    const id = `g${prod.id.replace(/[^a-z0-9]/gi, '')}${vista}`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 125" width="400" height="500">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${f1}"/><stop offset="1" stop-color="${f2}"/>
        </linearGradient>
      </defs>
      <rect width="100" height="125" fill="url(#${id})"/>
      <circle cx="50" cy="60" r="36" fill="#ffffff" opacity=".22"/>
      <g transform="${VISTAS[vista] || VISTAS[0]}">
        <path d="${silhueta.corpo}" fill="${cor}"/>
        <path d="${silhueta.detalhe}" fill="none" stroke="${traco}" stroke-width="1.4"
              stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>`;

    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/\s+/g, ' '));
  };

  /* ---------------- Armazenamento ---------------- */

  const ler = (chave, padrao) => {
    try {
      const bruto = JSON.parse(localStorage.getItem(chave));
      return bruto == null ? padrao : bruto;
    } catch {
      return padrao;
    }
  };

  const gravar = (chave, valor) => {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
    } catch {
      /* navegacao privada: segue so em memoria nesta pagina */
    }
  };

  /* ---------------- Tema claro/escuro ---------------- */

  const tema = {
    atual() {
      return ler(K_TEMA, null);
    },
    aplicar(valor) {
      if (valor) document.documentElement.setAttribute('data-tema', valor);
      else document.documentElement.removeAttribute('data-tema');
      document.querySelectorAll('[data-alternar-tema]').forEach((b) => {
        const escuro = tema.efetivo() === 'escuro';
        const rotulo = escuro ? 'Usar tema claro' : 'Usar tema escuro';
        b.innerHTML = icone(escuro ? 'sol' : 'lua') + (b.dataset.rotulo ? `<span>${rotulo}</span>` : '');
        b.setAttribute('aria-label', rotulo);
        b.setAttribute('title', escuro ? 'Tema claro' : 'Tema escuro');
      });
    },
    efetivo() {
      const salvo = tema.atual();
      if (salvo) return salvo;
      const host = document.documentElement.dataset.theme; // carimbo do visualizador (claude.ai)
      if (host === 'dark') return 'escuro';
      if (host === 'light') return 'claro';
      return matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
    },
    alternar() {
      const novo = tema.efetivo() === 'escuro' ? 'claro' : 'escuro';
      gravar(K_TEMA, novo);
      tema.aplicar(novo);
    }
  };

  /* ---------------- Toast ---------------- */

  let seqToast = 0;

  const toast = (mensagem, opcoes = {}) => {
    let pilha = document.querySelector('.toasts');
    if (!pilha) {
      pilha = document.createElement('div');
      pilha.className = 'toasts';
      pilha.setAttribute('role', 'status');
      pilha.setAttribute('aria-live', 'polite');
      document.body.appendChild(pilha);
    }

    const id = `toast-${++seqToast}`;
    const el = document.createElement('div');
    el.className = 'toast';
    el.id = id;
    el.innerHTML =
      icone(opcoes.tipo === 'erro' ? 'alerta' : 'check_circulo') +
      `<span>${esc(mensagem)}</span>` +
      (opcoes.acao ? `<button type="button" class="toast__acao">${esc(opcoes.acao)}</button>` : '');

    pilha.appendChild(el);

    const remover = () => {
      el.dataset.saindo = 'true';
      setTimeout(() => el.remove(), 200);
    };
    const timer = setTimeout(remover, opcoes.acao ? 6000 : 3600);

    const botao = el.querySelector('.toast__acao');
    if (botao) {
      botao.addEventListener('click', () => {
        clearTimeout(timer);
        remover();
        if (opcoes.aoAcionar) opcoes.aoAcionar();
      });
    }
    return el;
  };

  /* ---------------- Foco: drawer e modal ---------------- */

  const FOCAVEIS =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  let camadaAberta = null;

  const abrirCamada = (el) => {
    if (!el) return;
    camadaAberta = { el, anterior: document.activeElement };
    el.dataset.aberto = 'true';
    el.removeAttribute('inert');
    document.querySelector('[data-scrim]').dataset.aberto = 'true';
    document.body.classList.add('trava-scroll');
    setTimeout(() => {
      const alvo = el.querySelector('[data-foco-inicial]') || el.querySelector(FOCAVEIS);
      if (alvo) alvo.focus();
    }, 60);
  };

  const fecharCamada = () => {
    if (!camadaAberta) return;
    const { el, anterior } = camadaAberta;
    el.dataset.aberto = 'false';
    el.setAttribute('inert', '');
    const scrim = document.querySelector('[data-scrim]');
    if (scrim) scrim.dataset.aberto = 'false';
    document.body.classList.remove('trava-scroll');
    camadaAberta = null;
    if (anterior && anterior.focus) anterior.focus();
  };

  document.addEventListener('keydown', (e) => {
    if (!camadaAberta) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      fecharCamada();
      return;
    }
    if (e.key !== 'Tab') return;
    const focaveis = [...camadaAberta.el.querySelectorAll(FOCAVEIS)].filter(
      (n) => n.offsetParent !== null
    );
    if (!focaveis.length) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  });

  /* ---------------- Favoritos ---------------- */

  const favoritos = {
    lista: () => ler(K_FAVORITOS, []),
    tem: (id) => favoritos.lista().includes(id),
    alternar(id) {
      const atual = favoritos.lista();
      const novo = atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id];
      gravar(K_FAVORITOS, novo);
      document.dispatchEvent(new CustomEvent('favoritos:mudou'));
      return novo.includes(id);
    }
  };

  /* ---------------- Carrinho ---------------- */

  const chaveItem = (id, cor, tamanho) => `${id}::${cor}::${tamanho}`;

  const lerCarrinho = () =>
    ler(K_CARRINHO, []).filter((i) => produto(i.id) && i.quantidade > 0);

  const gravarCarrinho = (itens) => {
    gravar(K_CARRINHO, itens);
    document.dispatchEvent(new CustomEvent('carrinho:mudou'));
  };

  const carrinho = {
    itens() {
      return lerCarrinho().map((i) => {
        const p = produto(i.id);
        const cor = p.cores.find((c) => c.nome === i.cor) || p.cores[0];
        return {
          chave: chaveItem(i.id, i.cor, i.tamanho),
          id: i.id,
          produto: p,
          nome: p.nome,
          cor: cor.nome,
          corHex: cor.hex,
          tamanho: i.tamanho,
          preco: p.preco,
          quantidade: i.quantidade,
          subtotal: p.preco * i.quantidade
        };
      });
    },

    adicionar({ id, cor, tamanho, quantidade = 1 }) {
      const p = produto(id);
      if (!p) return false;
      const itens = lerCarrinho();
      const chave = chaveItem(id, cor, tamanho);
      const existente = itens.find((i) => chaveItem(i.id, i.cor, i.tamanho) === chave);
      if (existente) existente.quantidade = Math.min(20, existente.quantidade + quantidade);
      else itens.push({ id, cor, tamanho, quantidade });
      gravarCarrinho(itens);
      return true;
    },

    definirQuantidade(chave, quantidade) {
      const qtd = Math.max(0, Math.min(20, Number(quantidade) || 0));
      if (qtd === 0) return carrinho.remover(chave);
      const itens = lerCarrinho();
      const item = itens.find((i) => chaveItem(i.id, i.cor, i.tamanho) === chave);
      if (item) item.quantidade = qtd;
      gravarCarrinho(itens);
    },

    remover(chave) {
      gravarCarrinho(lerCarrinho().filter((i) => chaveItem(i.id, i.cor, i.tamanho) !== chave));
    },

    restaurar(item) {
      const itens = lerCarrinho();
      itens.push({ id: item.id, cor: item.cor, tamanho: item.tamanho, quantidade: item.quantidade });
      gravarCarrinho(itens);
    },

    limpar() {
      gravarCarrinho([]);
    },

    total() {
      return lerCarrinho().reduce((s, i) => s + i.quantidade, 0);
    },

    /* Calculo unico usado no carrinho, no checkout e no resumo. */
    totais({ freteId = 'padrao', cupom = null, pagamentoId = null } = {}) {
      const subtotal = carrinho.itens().reduce((s, i) => s + i.subtotal, 0);

      const regraCupom = cupom ? CUPONS[cupom] : null;
      const descontoCupom =
        regraCupom && regraCupom.tipo === 'percentual' ? (subtotal * regraCupom.valor) / 100 : 0;

      const opcaoFrete = FRETES.find((f) => f.id === freteId) || FRETES[1];
      let frete = opcaoFrete.preco;
      const baseFrete = subtotal - descontoCupom;
      const ganhouFreteGratis = opcaoFrete.id === 'padrao' && baseFrete >= LIMITE_FRETE_GRATIS;
      if (ganhouFreteGratis || (regraCupom && regraCupom.tipo === 'frete')) frete = 0;
      if (subtotal === 0) frete = 0;

      const formaPagamento = PAGAMENTOS.find((p) => p.id === pagamentoId) || null;
      const descontoPagamento = formaPagamento
        ? ((subtotal - descontoCupom) * formaPagamento.desconto) / 100
        : 0;

      return {
        subtotal,
        descontoCupom,
        descontoPagamento,
        frete,
        opcaoFrete,
        formaPagamento,
        ganhouFreteGratis,
        faltaFreteGratis: Math.max(0, LIMITE_FRETE_GRATIS - baseFrete),
        total: Math.max(0, subtotal - descontoCupom - descontoPagamento + frete)
      };
    }
  };

  /* ---------------- Rascunho do checkout ---------------- */

  const checkout = {
    ler: () => ler(K_CHECKOUT, {}),
    salvar(dados) {
      gravar(K_CHECKOUT, { ...checkout.ler(), ...dados });
    },
    limpar() {
      gravar(K_CHECKOUT, {});
    }
  };

  const pedidos = {
    lista: () => ler(K_PEDIDOS, []),
    salvar(pedido) {
      gravar(K_PEDIDOS, [pedido, ...pedidos.lista()].slice(0, 20));
    }
  };

  /* ---------------- Cabecalho e rodape ---------------- */

  const LINKS = [
    { href: 'produtos.html?ordem=novidades', texto: 'News', pagina: 'novidades' },
    { href: 'produtos.html?departamento=roupas', texto: 'Roupas', pagina: 'roupas', departamento: 'roupas' },
    { href: 'produtos.html?departamento=acessorios', texto: 'Acessórios', pagina: 'acessorios', departamento: 'acessorios' },
    { href: 'index.html#customize', texto: 'Customize', pagina: 'customize' },
    { href: 'sobre.html', texto: 'A loja', pagina: 'sobre' },
    { href: 'contato.html', texto: 'Contato', pagina: 'contato' }
  ];

  const departamento = (id) => DEPARTAMENTOS.find((d) => d.id === id);
  const visiveis = (g) => g.categorias.filter((c) => !c.oculto);

  /* Uma categoria no menu: link simples ou, quando tem subcategorias,
     botao que expande os desdobramentos (Jeans > Calças, Shorts...). */
  const itemCategoria = (c, prefixo) => {
    const subs = SUBCATEGORIAS[c.id];
    if (!subs) {
      return `<a class="submenu__item" role="menuitem" href="produtos.html?categoria=${c.id}">${c.nome}</a>`;
    }
    return `
      <button class="submenu__item submenu__item--toggle" type="button"
              data-toggle-sub aria-controls="${prefixo}-${c.id}" aria-expanded="false">
        ${c.nome} ${icone('chevron_baixo', { classe: 'i--sm' })}
      </button>
      <div class="submenu__subs" id="${prefixo}-${c.id}" hidden>
        <a role="menuitem" href="produtos.html?categoria=${c.id}">Ver tudo em ${c.nome}</a>
        ${subs
          .map((sc) => `<a role="menuitem" href="produtos.html?categoria=${c.id}&amp;subcategoria=${sc.id}">${sc.nome}</a>`)
          .join('')}
      </div>`;
  };

  /* Painel dropdown de um departamento: uma coluna por grupo (Roupas)
     ou uma unica coluna com as categorias (Acessórios). */
  const submenuDepartamento = (dep) => `
    <div class="submenu submenu--${dep.id}" role="menu" aria-label="${dep.nome}">
      ${dep.grupos
        .map(
          (g) => `
        <div class="submenu__col">
          ${
            g.nome
              ? `<a class="submenu__grupo" role="menuitem" href="produtos.html?grupo=${g.id}">${g.nome}</a>`
              : ''
          }
          ${visiveis(g).map((c) => itemCategoria(c, `sub-${dep.id}`)).join('')}
        </div>`
        )
        .join('')}
      <a class="submenu__tudo" role="menuitem" href="produtos.html?departamento=${dep.id}">
        Ver tudo em ${dep.nome} ${icone('seta_direita', { classe: 'i--sm' })}
      </a>
    </div>`;

  /* No catalogo, o item ativo do menu depende do que esta filtrado na URL */
  const paginaAtiva = (pagina) => {
    if (pagina !== 'produtos') return pagina;
    const q = new URLSearchParams(location.search);
    if (q.get('ordem') === 'novidades' && !q.get('categoria') && !q.get('grupo') && !q.get('departamento')) return 'novidades';
    const dep =
      q.get('departamento') ||
      (GRUPOS.find((g) => g.id === q.get('grupo')) || {}).departamento ||
      (CATEGORIAS.find((c) => c.id === (q.get('categoria') || '').split(',')[0]) || {}).departamento;
    return dep || 'roupas';
  };

  const montarCabecalho = (pagina) => {
    const alvo = document.querySelector('[data-cabecalho]');
    if (!alvo) return;

    const ativa = paginaAtiva(pagina);
    alvo.innerHTML = `
      <div class="aviso-topo"><span class="aviso-topo__frase" data-letreiro></span></div>
      <div class="cabecalho">
        <div class="container cabecalho__int">
          <button class="btn-icone abrir-menu" type="button" data-abrir="menu"
                  aria-label="Abrir menu de navegação" aria-controls="drawer-menu" aria-expanded="false">
            ${icone('menu', { classe: 'i--lg' })}
          </button>

          <a class="marca" href="index.html" aria-label="Flor de Margarida, moda feminina e acessórios - página inicial">
            <img class="marca__selo" src="assets/img/selo.png" alt="" width="42" height="42">
            <span class="marca__nome" aria-hidden="true">
              Flor de Margarida
              <small>Moda Feminina &amp; Acessórios</small>
            </span>
          </a>

          <nav class="nav-principal" aria-label="Navegação principal">
            ${LINKS.map((l) => {
              const atual = l.pagina === ativa ? ' aria-current="page"' : '';
              if (l.departamento) {
                return `<div class="nav-drop">
                  <a href="${l.href}"${atual} aria-haspopup="true">${l.texto} ${icone('chevron_baixo', { classe: 'i--sm' })}</a>
                  ${submenuDepartamento(departamento(l.departamento))}
                </div>`;
              }
              return `<a href="${l.href}"${atual}>${l.texto}</a>`;
            }).join('')}
          </nav>

          <div class="cabecalho__acoes">
            <button class="btn-icone" type="button" data-abrir="busca"
                    aria-label="Buscar produtos" aria-controls="modal-busca">
              ${icone('busca', { classe: 'i--lg' })}
            </button>
            <button class="btn-icone so-desktop" type="button" data-alternar-tema aria-label="Alternar tema"></button>
            <a class="btn-icone so-desktop" href="produtos.html?favoritos=1" aria-label="Meus favoritos">
              ${icone('coracao', { classe: 'i--lg' })}
              <span class="contagem numero" data-contagem-favoritos hidden>0</span>
            </a>
            <button class="btn-icone" type="button" data-abrir="sacola"
                    aria-label="Abrir sacola de compras" aria-controls="drawer-sacola" aria-expanded="false">
              ${icone('sacola', { classe: 'i--lg' })}
              <span class="contagem numero" data-contagem-carrinho hidden>0</span>
            </button>
          </div>
        </div>
      </div>`;
  };

  const montarRodape = () => {
    const alvo = document.querySelector('[data-rodape]');
    if (!alvo) return;
    alvo.className = 'rodape';
    alvo.innerHTML = `
      <div class="container">
        <div class="rodape__grade">
          <div>
            <a class="marca marca--rodape" href="index.html" aria-label="Flor de Margarida, pagina inicial">
              <img class="marca__lockup marca__lockup--escura" src="assets/img/marca-escura.png"
                   alt="Flor de Margarida - Moda Feminina e Acessorios" width="420" height="244">
              <img class="marca__lockup marca__lockup--clara" src="assets/img/marca-clara.png"
                   alt="" aria-hidden="true" width="420" height="244">
            </a>
            <p class="suave" style="margin-top:12px;font-size:.875rem;max-width:34ch">
              Para mulheres que florescem todos os dias.<br>
              Moda feminina e acessórios em São José dos Campos, SP.
            </p>
            <div class="selos-confianca">
              <span class="selo-confianca">${icone('local')} São José dos Campos, SP</span>
              <span class="selo-confianca">${icone('folha')} Peças selecionadas</span>
            </div>
          </div>
          <div>
            <h4>Comprar</h4>
            <ul>
              ${GRUPOS.filter((g) => g.nome)
                .map((g) => `<li><a href="produtos.html?grupo=${g.id}">${g.nome}</a></li>`)
                .join('')}
              <li><a href="produtos.html?departamento=acessorios">Acessórios</a></li>
              <li><a href="produtos.html">Ver tudo</a></li>
            </ul>
          </div>
          <div>
            <h4>Ajuda</h4>
            <ul>
              <li><a href="contato.html">Fale com a gente</a></li>
              <li><a href="sobre.html">Trocas e devoluções</a></li>
              <li><a href="sobre.html">Guia de medidas</a></li>
              <li><a href="carrinho.html">Minha sacola</a></li>
            </ul>
          </div>
          <div>
            <h4>Receba as novidades</h4>
            <p class="apoio" style="margin:0">Novidades e lançamentos, uma vez por mês.</p>
            <form class="newsletter" data-newsletter>
              <label class="sr-only" for="email-newsletter">Seu e-mail</label>
              <input type="email" id="email-newsletter" name="email" placeholder="voce@email.com" required autocomplete="email">
              <button class="btn btn--primario" type="submit" aria-label="Assinar novidades">
                ${icone('seta_direita')}
              </button>
            </form>
          </div>
        </div>
        <div class="rodape__base">
          <span>&copy; ${new Date().getFullYear()} Flor de Margarida &middot; Projeto de demonstração</span>
          <span>Nenhum pagamento é processado neste site.</span>
        </div>
      </div>`;

    const form = alvo.querySelector('[data-newsletter]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      toast('Pronto! Você vai receber a próxima carta.');
      form.reset();
    });
  };

  /* Camadas globais: scrim, menu mobile, sacola e busca */
  const montarCamadas = () => {
    if (document.querySelector('[data-scrim]')) return;

    const camadas = document.createElement('div');
    camadas.innerHTML = `
      <div class="scrim" data-scrim data-aberto="false"></div>

      <aside class="drawer drawer--esquerda" id="drawer-menu" data-camada="menu" inert
             role="dialog" aria-modal="true" aria-label="Menu de navegação">
        <div class="drawer__topo">
          <h2>Navegar</h2>
          <button class="btn-icone" type="button" data-fechar aria-label="Fechar menu">${icone('fechar', { classe: 'i--lg' })}</button>
        </div>
        <div class="drawer__corpo">
          <nav aria-label="Navegação do menu">
            <ul class="menu-mobile">
              ${LINKS.map((l) => {
                if (!l.departamento) {
                  return `<li><a class="menu-mobile__item" href="${l.href}">${l.texto} ${icone('chevron_direita')}</a></li>`;
                }
                const dep = departamento(l.departamento);
                return `<li>
                  <button class="menu-mobile__item" type="button" data-toggle-sub
                          aria-controls="mdep-${dep.id}" aria-expanded="false">
                    ${l.texto} ${icone('chevron_baixo')}
                  </button>
                  <div class="menu-mobile__sub" id="mdep-${dep.id}" hidden>
                    <a class="menu-mobile__tudo" href="produtos.html?departamento=${dep.id}">Ver tudo em ${dep.nome}</a>
                    ${dep.grupos
                      .map(
                        (g) => `
                      ${g.nome ? `<a class="menu-mobile__grupo" href="produtos.html?grupo=${g.id}">${g.nome}</a>` : ''}
                      <ul class="menu-mobile__lista">
                        ${visiveis(g)
                          .map((c) => {
                            const subs = SUBCATEGORIAS[c.id];
                            if (!subs) return `<li><a href="produtos.html?categoria=${c.id}">${c.nome}</a></li>`;
                            return `<li>
                              <button type="button" class="menu-mobile__cat" data-toggle-sub
                                      aria-controls="msub-${c.id}" aria-expanded="false">
                                ${c.nome} ${icone('chevron_baixo', { classe: 'i--sm' })}
                              </button>
                              <ul class="menu-mobile__lista menu-mobile__lista--sub" id="msub-${c.id}" hidden>
                                <li><a href="produtos.html?categoria=${c.id}">Ver tudo em ${c.nome}</a></li>
                                ${subs
                                  .map((sc) => `<li><a href="produtos.html?categoria=${c.id}&amp;subcategoria=${sc.id}">${sc.nome}</a></li>`)
                                  .join('')}
                              </ul>
                            </li>`;
                          })
                          .join('')}
                      </ul>`
                      )
                      .join('')}
                  </div>
                </li>`;
              }).join('')}
            </ul>
          </nav>
          <div class="menu-mobile__extras">
            <a href="produtos.html?favoritos=1" style="display:flex;align-items:center;gap:12px;min-height:48px">
              ${icone('coracao')} Meus favoritos
              <span class="contagem numero" data-contagem-favoritos hidden
                    style="position:static;margin-left:auto">0</span>
            </a>
            <button type="button" data-alternar-tema data-rotulo="1"
                    style="display:flex;align-items:center;gap:12px;min-height:48px;width:100%;
                           background:none;border:0;padding:0;cursor:pointer;text-align:left;color:inherit"></button>
          </div>
        </div>
      </aside>

      <aside class="drawer" id="drawer-sacola" data-camada="sacola" inert
             role="dialog" aria-modal="true" aria-label="Sacola de compras">
        <div class="drawer__topo">
          <h2>Sua sacola <span class="suave numero" data-sacola-contagem></span></h2>
          <button class="btn-icone" type="button" data-fechar aria-label="Fechar sacola">${icone('fechar', { classe: 'i--lg' })}</button>
        </div>
        <div class="drawer__corpo" data-sacola-corpo></div>
        <div class="drawer__rodape" data-sacola-rodape hidden></div>
      </aside>

      <div class="modal" id="modal-busca" data-camada="busca" inert
           role="dialog" aria-modal="true" aria-label="Buscar produtos">
        <div class="modal__caixa" style="padding:24px">
          <form data-form-busca role="search">
            <label class="sr-only" for="busca-global">Buscar produtos</label>
            <div class="busca">
              ${icone('busca')}
              <input type="search" id="busca-global" name="q" data-foco-inicial
                     placeholder="Buscar por peça, tecido ou cor..." autocomplete="off">
            </div>
          </form>
          <p class="apoio" style="margin:16px 0 8px">Buscas frequentes</p>
          <div class="linha">
            ${['linho', 'vestido', 'conjuntos', 'jeans', 'saia']
              .map(
                (t) =>
                  `<a class="btn btn--contorno" style="min-height:36px;padding:6px 14px" href="produtos.html?busca=${t}">${t}</a>`
              )
              .join('')}
          </div>
          <div data-busca-resultados style="margin-top:20px"></div>
        </div>
      </div>`;

    while (camadas.firstElementChild) document.body.appendChild(camadas.firstElementChild);

    document.querySelector('[data-scrim]').addEventListener('click', fecharCamada);
    document.querySelectorAll('[data-fechar]').forEach((b) => b.addEventListener('click', fecharCamada));
    document.querySelectorAll('.modal').forEach((m) =>
      m.addEventListener('click', (e) => {
        if (e.target === m) fecharCamada();
      })
    );

    document.addEventListener('click', (e) => {
      const gatilho = e.target.closest('[data-abrir]');
      if (!gatilho) return;
      const nome = gatilho.dataset.abrir;
      if (nome === 'sacola') renderizarSacola();
      abrirCamada(document.querySelector(`[data-camada="${nome}"]`));
    });

    /* Busca ao vivo dentro do modal */
    const campoBusca = document.querySelector('#busca-global');
    const resultados = document.querySelector('[data-busca-resultados]');
    let debounce;
    campoBusca.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        const termo = campoBusca.value.trim().toLowerCase();
        if (termo.length < 2) {
          resultados.innerHTML = '';
          return;
        }
        const achados = PRODUTOS.filter(
          (p) =>
            p.nome.toLowerCase().includes(termo) ||
            p.resumo.toLowerCase().includes(termo) ||
            nomeCategoria(p.categoria).toLowerCase().includes(termo) ||
            p.cores.some((c) => c.nome.toLowerCase().includes(termo))
        ).slice(0, 5);

        resultados.innerHTML = achados.length
          ? `<p class="apoio">${achados.length} resultado(s)</p>` +
            achados
              .map(
                (p) => `
              <a href="produto.html?id=${p.id}" style="display:flex;gap:12px;align-items:center;padding:8px;border-radius:8px">
                <img src="${imagem(p, p.cores[0].hex)}" alt="" width="48" height="60"
                     style="width:48px;height:60px;object-fit:cover;border-radius:6px">
                <span style="flex:1">
                  <strong style="display:block;font-size:.9375rem">${esc(p.nome)}</strong>
                  <span class="apoio">${esc(nomeCategoria(p.categoria))}</span>
                </span>
                <strong class="numero">${fmt(p.preco)}</strong>
              </a>`
              )
              .join('')
          : `<p class="suave">Nada encontrado para "${esc(campoBusca.value)}". Tente outro termo ou veja o <a class="link" href="produtos.html">catalogo completo</a>.</p>`;
      }, 220);
    });

    document.querySelector('[data-form-busca]').addEventListener('submit', (e) => {
      e.preventDefault();
      const termo = campoBusca.value.trim();
      location.href = termo ? `produtos.html?busca=${encodeURIComponent(termo)}` : 'produtos.html';
    });
  };

  /* Conteudo da sacola lateral */
  const renderizarSacola = () => {
    const corpo = document.querySelector('[data-sacola-corpo]');
    const rodape = document.querySelector('[data-sacola-rodape]');
    const contagem = document.querySelector('[data-sacola-contagem]');
    if (!corpo) return;

    const itens = carrinho.itens();
    contagem.textContent = itens.length ? `(${carrinho.total()})` : '';

    if (!itens.length) {
      corpo.innerHTML = `
        <div class="vazio">
          ${icone('carrinho_vazio', { classe: 'i--xl' })}
          <h3>Sua sacola esta vazia</h3>
          <p>Que tal comecar pelas novidades da estacao?</p>
          <a class="btn btn--primario" href="produtos.html">Ver o catalogo</a>
        </div>`;
      rodape.hidden = true;
      return;
    }

    corpo.innerHTML = itens
      .map(
        (i) => `
      <div class="item-linha" style="grid-template-columns:64px 1fr auto">
        <div class="item-linha__midia">
          <img src="${imagem(i.produto, i.corHex)}" alt="${esc(i.nome)}" width="64" height="80" loading="lazy">
        </div>
        <div>
          <p class="item-linha__nome" style="font-size:.9375rem">${esc(i.nome)}</p>
          <p class="item-linha__variacao">
            <span class="amostra" style="background:${i.corHex}"></span>${esc(i.cor)} &middot; ${esc(i.tamanho)}
          </p>
          <div class="item-linha__ctrl">
            <div class="quantidade" style="transform:scale(.85);transform-origin:left">
              <button type="button" data-sacola-menos="${i.chave}" aria-label="Diminuir quantidade de ${esc(i.nome)}">${icone('menos')}</button>
              <output aria-live="off">${i.quantidade}</output>
              <button type="button" data-sacola-mais="${i.chave}" aria-label="Aumentar quantidade de ${esc(i.nome)}">${icone('mais')}</button>
            </div>
          </div>
        </div>
        <div>
          <div class="item-linha__valor numero">${fmt(i.subtotal)}</div>
          <button class="btn btn--perigo btn--pequeno" style="min-height:32px;padding:4px 8px;font-size:.75rem;margin-top:8px"
                  type="button" data-sacola-remover="${i.chave}">Remover</button>
        </div>
      </div>`
      )
      .join('');

    const t = carrinho.totais({ freteId: 'padrao' });
    rodape.hidden = false;
    rodape.innerHTML = `
      ${
        t.faltaFreteGratis > 0
          ? `<p class="apoio" style="margin:0 0 4px">Faltam <strong class="numero">${fmt(t.faltaFreteGratis)}</strong> para o frete gratis</p>
             <div class="barra-progresso"><div class="barra-progresso__preenchimento"
                  style="transform:scaleX(${Math.min(1, t.subtotal / LIMITE_FRETE_GRATIS).toFixed(3)})"></div></div>`
          : `<p class="apoio" style="margin:0 0 12px;color:var(--c-sucesso)">Frete gratis liberado</p>`
      }
      <div class="resumo__total"><span>Subtotal</span><span class="numero">${fmt(t.subtotal)}</span></div>
      <p class="apoio" style="margin:4px 0 12px">Frete e cupom sao calculados no checkout.</p>
      <a class="btn btn--primario btn--bloco btn--grande" href="carrinho.html">Ver sacola e finalizar</a>
      <button class="btn btn--fantasma btn--bloco" type="button" data-fechar>Continuar comprando</button>`;

    rodape.querySelector('[data-fechar]').addEventListener('click', fecharCamada);
  };

  /* Delegacao dos controles da sacola lateral */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sacola-mais], [data-sacola-menos], [data-sacola-remover]');
    if (!btn) return;
    const { sacolaMais, sacolaMenos, sacolaRemover } = btn.dataset;
    const itens = carrinho.itens();

    if (sacolaRemover) {
      const item = itens.find((i) => i.chave === sacolaRemover);
      carrinho.remover(sacolaRemover);
      if (item) {
        toast(`${item.nome} removido`, {
          acao: 'Desfazer',
          aoAcionar: () => {
            carrinho.restaurar(item);
            renderizarSacola();
          }
        });
      }
    } else {
      const chave = sacolaMais || sacolaMenos;
      const item = itens.find((i) => i.chave === chave);
      if (item) carrinho.definirQuantidade(chave, item.quantidade + (sacolaMais ? 1 : -1));
    }
    renderizarSacola();
  });

  /* ---------------- Contadores ---------------- */

  const atualizarContadores = () => {
    const nCarrinho = carrinho.total();
    document.querySelectorAll('[data-contagem-carrinho]').forEach((el) => {
      el.textContent = nCarrinho;
      el.hidden = nCarrinho === 0;
    });
    const nFav = favoritos.lista().length;
    document.querySelectorAll('[data-contagem-favoritos]').forEach((el) => {
      el.textContent = nFav;
      el.hidden = nFav === 0;
    });
    const botaoSacola = document.querySelector('[data-abrir="sacola"]');
    if (botaoSacola) {
      botaoSacola.setAttribute(
        'aria-label',
        nCarrinho ? `Abrir sacola, ${nCarrinho} item(ns)` : 'Abrir sacola, vazia'
      );
    }
  };

  /* ---------------- Inicializacao ---------------- */

  /* Letreiro rotativo do topo: 3 frases, troca a cada 5s */
  const FRASES_LETREIRO = [
    'Frete grátis acima de R$ 199,00 no Estado de SP',
    'Nas demais regiões do Brasil, R$ 399,00',
    'Trocas em 30 dias*'
  ];
  const iniciarLetreiro = () => {
    const el = document.querySelector('[data-letreiro]');
    if (!el) return;
    let i = 0;
    el.textContent = FRASES_LETREIRO[0];
    setInterval(() => {
      i = (i + 1) % FRASES_LETREIRO.length;
      el.style.opacity = '0';
      setTimeout(() => {
        el.textContent = FRASES_LETREIRO[i];
        el.style.opacity = '1';
      }, 300);
    }, 5000);
  };

  const iniciar = () => {
    tema.aplicar(tema.atual());
    const pagina = document.body.dataset.pagina || '';
    montarCabecalho(pagina);
    iniciarLetreiro();
    montarRodape();
    montarCamadas();
    atualizarContadores();
    tema.aplicar(tema.atual());

    document.addEventListener('carrinho:mudou', atualizarContadores);
    document.addEventListener('favoritos:mudou', atualizarContadores);
    window.addEventListener('storage', (e) => {
      if ([K_CARRINHO, K_FAVORITOS].includes(e.key)) atualizarContadores();
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-alternar-tema]')) tema.alternar();

      const toggleSub = e.target.closest('[data-toggle-sub]');
      if (toggleSub) {
        const alvo = document.getElementById(toggleSub.getAttribute('aria-controls'));
        const aberto = toggleSub.getAttribute('aria-expanded') === 'true';
        toggleSub.setAttribute('aria-expanded', String(!aberto));
        if (alvo) alvo.hidden = aberto;
      }
    });
  };

  return {
    fmt, esc, icone, produto, categoria, nomeCategoria, imagem, luminancia,
    toast, tema, carrinho, favoritos, checkout, pedidos,
    abrirCamada, fecharCamada, renderizarSacola, iniciar
  };
})();
