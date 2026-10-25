/* =========================================================
   Prova virtual ("Customize").
   A foto nunca sai do navegador: tudo e desenhado num canvas
   local. O corpo e descrito por 4 linhas (ombros, quadril,
   joelhos, tornozelos) que vem de deteccao automatica ou das
   guias arrastaveis; cada peca do catalogo se ajusta a elas.

   Ponto de troca do motor: desenharPeca(). Quando houver um
   servico de try-on fotorrealista, ele entra ali.
   ========================================================= */

const Prova = (() => {
  const { fmt, esc, imagem, produto, nomeCategoria, toast, luminancia } = Loja;

  const K = 'fm:prova';
  const ALTURA_MAX = 1400;
  const MEDIAPIPE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  const MODELO_POSE =
    'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

  const LINHAS = [
    { id: 'ombro', rotulo: 'Ombros' },
    { id: 'quadril', rotulo: 'Quadril' },
    { id: 'joelho', rotulo: 'Joelhos' },
    { id: 'tornozelo', rotulo: 'Tornozelos' }
  ];

  /* Posicoes iniciais (fracao do canvas) - batem com o manequim */
  const GUIAS_PADRAO = {
    ombroE: { x: 0.37, y: 0.2 }, ombroD: { x: 0.63, y: 0.2 },
    quadrilE: { x: 0.42, y: 0.47 }, quadrilD: { x: 0.58, y: 0.47 },
    joelhoE: { x: 0.43, y: 0.72 }, joelhoD: { x: 0.57, y: 0.72 },
    tornozeloE: { x: 0.44, y: 0.94 }, tornozeloD: { x: 0.56, y: 0.94 }
  };

  const ORDEM_DESENHO = ['baixo', 'vestido', 'cima', 'sobre'];

  let estado = {
    foto: null, // canvas offscreen com a foto redimensionada
    guias: JSON.parse(JSON.stringify(GUIAS_PADRAO)),
    pecas: { cima: null, baixo: null, vestido: null, sobre: null },
    cores: {},
    mostrarGuias: true,
    detectado: false
  };

  let W = 900;
  let H = 1200;
  let canvas, ctx, palco, svg, painel;
  let landmarker = null;

  /* Recortes das pecas com foto, carregados sob demanda */
  const recortes = new Map();
  const recorteDe = (p) => {
    if (!p.foto) return null;
    if (recortes.has(p.id)) return recortes.get(p.id);
    const img = new Image();
    img.onload = () => desenharTudo();
    img.onerror = () => recortes.set(p.id, 'erro');
    img.src = p.foto.recorte;
    recortes.set(p.id, img);
    return img;
  };

  /* ---------------- Persistencia (sessao) ---------------- */

  const salvar = () => {
    try {
      const dados = { guias: estado.guias, pecas: estado.pecas, cores: estado.cores, mostrarGuias: estado.mostrarGuias };
      if (estado.foto) {
        const url = estado.foto.toDataURL('image/jpeg', 0.82);
        if (url.length < 3.5e6) dados.foto = url;
      }
      sessionStorage.setItem(K, JSON.stringify(dados));
    } catch {
      /* sem storage: segue so em memoria */
    }
  };

  const restaurar = () =>
    new Promise((resolve) => {
      let dados = null;
      try {
        dados = JSON.parse(sessionStorage.getItem(K));
      } catch {
        dados = null;
      }
      if (!dados) return resolve();
      estado.guias = dados.guias || estado.guias;
      estado.pecas = { ...estado.pecas, ...(dados.pecas || {}) };
      estado.cores = dados.cores || {};
      if (typeof dados.mostrarGuias === 'boolean') estado.mostrarGuias = dados.mostrarGuias;
      if (!dados.foto) return resolve();
      const img = new Image();
      img.onload = () => {
        definirFoto(img, false);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = dados.foto;
    });

  /* ---------------- Foto ---------------- */

  const definirFoto = (img, reposicionar = true) => {
    const escala = Math.min(1, ALTURA_MAX / img.naturalHeight, ALTURA_MAX / img.naturalWidth);
    const off = document.createElement('canvas');
    off.width = Math.round(img.naturalWidth * escala);
    off.height = Math.round(img.naturalHeight * escala);
    off.getContext('2d').drawImage(img, 0, 0, off.width, off.height);
    estado.foto = off;
    estado.detectado = false;
    W = off.width;
    H = off.height;
    if (reposicionar) estado.guias = JSON.parse(JSON.stringify(GUIAS_PADRAO));
    ajustarPalco();
  };

  const removerFoto = () => {
    estado.foto = null;
    estado.detectado = false;
    W = 900;
    H = 1200;
    estado.guias = JSON.parse(JSON.stringify(GUIAS_PADRAO));
    ajustarPalco();
    salvar();
  };

  const carregarArquivo = (arquivo) => {
    if (!arquivo || !arquivo.type.startsWith('image/')) {
      toast('Escolha um arquivo de imagem (JPG, PNG ou HEIC convertido).', { tipo: 'erro' });
      return;
    }
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      definirFoto(img);
      desenharTudo();
      salvar();
      atualizarPainel();
      toast('Foto carregada. Agora detecte o corpo ou ajuste as guias.');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast('Nao consegui abrir essa imagem. Tente outra foto.', { tipo: 'erro' });
    };
    img.src = url;
  };

  /* ---------------- Deteccao automatica (MediaPipe) ---------------- */

  const detectarCorpo = async (botao) => {
    if (!estado.foto) {
      toast('Envie uma foto primeiro.', { tipo: 'erro' });
      return;
    }
    const original = botao.innerHTML;
    botao.disabled = true;
    botao.innerHTML = '<span class="btn__spinner"></span> Detectando';

    try {
      if (!landmarker) {
        const mod = await Promise.race([
          import(`${MEDIAPIPE}/vision_bundle.mjs`),
          new Promise((_, rej) => setTimeout(() => rej(new Error('tempo esgotado')), 20000))
        ]);
        const vision = await mod.FilesetResolver.forVisionTasks(`${MEDIAPIPE}/wasm`);
        landmarker = await mod.PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODELO_POSE },
          runningMode: 'IMAGE',
          numPoses: 1
        });
      }

      const resultado = landmarker.detect(estado.foto);
      const pontos = resultado.landmarks && resultado.landmarks[0];
      if (!pontos) throw new Error('nenhum corpo encontrado');

      /* Indices do MediaPipe Pose: 11/12 ombros, 23/24 quadril, 25/26 joelhos, 27/28 tornozelos.
         "E" e o ponto mais a esquerda NA IMAGEM, nao o lado esquerdo da pessoa. */
      const par = (a, b) => {
        const p1 = pontos[a];
        const p2 = pontos[b];
        return p1.x <= p2.x ? [p1, p2] : [p2, p1];
      };
      const visivel = (pt) => (pt.visibility == null ? true : pt.visibility > 0.5);
      const gravar = (nome, e, d) => {
        estado.guias[`${nome}E`] = { x: limitar(e.x), y: limitar(e.y) };
        estado.guias[`${nome}D`] = { x: limitar(d.x), y: limitar(d.y) };
      };

      const [oE, oD] = par(11, 12);
      const [qE, qD] = par(23, 24);
      gravar('ombro', oE, oD);
      gravar('quadril', qE, qD);

      /* Joelhos e tornozelos fora do quadro: o MediaPipe chuta com visibilidade baixa.
         Nesse caso estimamos pela proporcao do tronco (coxa ~ tronco, canela ~ tronco). */
      const torso = (qE.y + qD.y) / 2 - (oE.y + oD.y) / 2;
      const [jE, jD] = par(25, 26);
      const pernasVisiveis = visivel(jE) && visivel(jD);
      if (pernasVisiveis) gravar('joelho', jE, jD);
      else gravar('joelho', { x: qE.x, y: qE.y + torso * 1.05 }, { x: qD.x, y: qD.y + torso * 1.05 });

      const [tE, tD] = par(27, 28);
      if (pernasVisiveis && visivel(tE) && visivel(tD)) gravar('tornozelo', tE, tD);
      else {
        const jy = (estado.guias.joelhoE.y + estado.guias.joelhoD.y) / 2;
        gravar('tornozelo', { x: estado.guias.joelhoE.x, y: jy + torso * 1.0 }, { x: estado.guias.joelhoD.x, y: jy + torso * 1.0 });
      }

      /* Ombros muito proximos em relacao ao tronco = pessoa de lado */
      const larguraOmbros = Math.hypot(oD.x - oE.x, (oD.y - oE.y) * (H / W));
      const deLado = larguraOmbros < torso * 0.32;

      estado.detectado = true;
      desenharTudo();
      salvar();
      atualizarPainel();
      if (deLado) {
        toast('Parece que a foto esta de lado. De frente para a camera o encaixe fica bem melhor.', { tipo: 'erro' });
      } else if (!pernasVisiveis) {
        toast('Corpo detectado. As pernas estao fora do quadro: para provar partes de baixo, envie uma foto de corpo inteiro.');
      } else {
        toast('Corpo detectado. Ajuste fino nas guias, se precisar.');
      }
      return;
    } catch (erro) {
      console.warn('Deteccao automatica indisponivel:', erro);
      toast('Nao consegui detectar aqui. Arraste as guias sobre ombros, quadril, joelhos e tornozelos.', {
        tipo: 'erro'
      });
    } finally {
      botao.disabled = false;
      botao.innerHTML = original;
    }
  };

  const limitar = (v) => Math.max(0.02, Math.min(0.98, v));

  /* ---------------- Geometria ---------------- */

  const px = (p) => ({ x: p.x * W, y: p.y * H });

  const alturaLinha = (nome) => {
    const e = estado.guias[`${nome}E`];
    const d = estado.guias[`${nome}D`];
    return ((e.y + d.y) / 2) * H;
  };

  const alturaBase = (base) => {
    const ate = alturaLinha(base.ate);
    if (!base.desde) return ate;
    const desde = alturaLinha(base.desde);
    return desde + (ate - desde) * (base.t == null ? 1 : base.t);
  };

  /* Retorna os dois pontos de origem (na silhueta) e destino (na foto)
     que prendem a peca ao corpo, mais a altura que a barra deve alcancar. */
  const ancoragem = (meta) => {
    if (meta.parte === 'baixo') {
      const qE = px(estado.guias.quadrilE);
      const qD = px(estado.guias.quadrilD);
      const oE = px(estado.guias.ombroE);
      const oD = px(estado.guias.ombroD);
      /* O quadril do MediaPipe fica na articulacao; a cintura da peca sobe um pouco. */
      const torso = (qE.y + qD.y) / 2 - (oE.y + oD.y) / 2;
      const sobe = torso * 0.16;
      return {
        A: { x: qE.x, y: qE.y - sobe },
        B: { x: qD.x, y: qD.y - sobe },
        srcA: meta.cinturaE,
        srcB: meta.cinturaD,
        baseAlvo: alturaBase(meta.base)
      };
    }
    return {
      A: px(estado.guias.ombroE),
      B: px(estado.guias.ombroD),
      srcA: meta.ombroE,
      srcB: meta.ombroD,
      baseAlvo: alturaBase(meta.base)
    };
  };

  /* ---------------- Desenho ---------------- */

  const ajustarPalco = () => {
    canvas.width = W;
    canvas.height = H;
    palco.style.aspectRatio = `${W} / ${H}`;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    construirGuias();
  };

  const desenharManequim = () => {
    const g = GUIAS_PADRAO;
    const P = (p) => ({ x: p.x * W, y: p.y * H });

    ctx.fillStyle = '#ece5f4';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#d9cfe6';
    ctx.strokeStyle = '#d9cfe6';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    /* cabeca e pescoco */
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.1, W * 0.062, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = W * 0.05;
    ctx.beginPath();
    ctx.moveTo(W / 2, H * 0.15);
    ctx.lineTo(W / 2, H * 0.2);
    ctx.stroke();

    /* tronco */
    const oE = P(g.ombroE), oD = P(g.ombroD), qE = P(g.quadrilE), qD = P(g.quadrilD);
    ctx.lineWidth = W * 0.09;
    ctx.beginPath();
    ctx.moveTo(oE.x, oE.y);
    ctx.lineTo(oD.x, oD.y);
    ctx.lineTo(qD.x, qD.y);
    ctx.lineTo(qE.x, qE.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    /* bracos */
    ctx.lineWidth = W * 0.062;
    [[oE, -1], [oD, 1]].forEach(([o, lado]) => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(o.x + lado * W * 0.05, H * 0.36);
      ctx.lineTo(o.x + lado * W * 0.075, H * 0.52);
      ctx.stroke();
    });

    /* pernas */
    const jE = P(g.joelhoE), jD = P(g.joelhoD), tE = P(g.tornozeloE), tD = P(g.tornozeloD);
    ctx.lineWidth = W * 0.078;
    [[qE, jE, tE], [qD, jD, tD]].forEach(([q, j, t]) => {
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(j.x, j.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    });
  };

  /* Ancoras da peca no espaco da imagem-fonte: silhueta (grade 100) ou foto (pixels) */
  const ancorasDe = (p, meta, img) => {
    if (!p.foto) return { ...meta, folga: meta.folga };
    const a = p.foto.ancoras;
    const P = (pt) => ({ x: pt.x * img.naturalWidth, y: pt.y * img.naturalHeight });
    const base = { baseY: a.baseY * img.naturalHeight, base: meta.base, parte: meta.parte, folga: 1.06 };
    return meta.parte === 'baixo'
      ? { ...base, cinturaE: P(a.cinturaE), cinturaD: P(a.cinturaD) }
      : { ...base, ombroE: P(a.ombroE), ombroD: P(a.ombroD) };
  };

  const desenharPeca = (p, corHex) => {
    const meta = ANCORAS[p.silhueta];
    if (!meta || meta.parte === 'acessorio') return;

    const img = recorteDe(p);
    if (p.foto && (!img || img === 'erro' || !img.complete || !img.naturalWidth)) {
      if (img === 'erro') desenharSilhueta(p, corHex, meta, SILHUETAS[p.silhueta]);
      return; // desenha quando a imagem carregar
    }

    const fonte = ancorasDe(p, meta, img);
    const { A, B, srcA, srcB, baseAlvo } = ancoragem(fonte);
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const dist = Math.hypot(dx, dy);
    const LIMITE = (15 * Math.PI) / 180;
    const ang = Math.max(-LIMITE, Math.min(LIMITE, Math.atan2(dy, dx)));
    const srcDist = srcB.x - srcA.x;

    const sx = (dist / srcDist) * fonte.folga;
    const meioY = (A.y + B.y) / 2;
    const sy = Math.max(0.05, (baseAlvo - meioY) / (fonte.baseY - srcA.y));

    ctx.save();
    ctx.translate(A.x, A.y);
    ctx.rotate(ang);
    ctx.translate(-(sx * srcDist - dist) / 2, 0); // centraliza a folga
    ctx.scale(sx, sy);
    ctx.translate(-srcA.x, -srcA.y);

    if (p.foto) {
      /* Foto recortada: sombra leve para assentar no corpo, sem recolorir */
      ctx.shadowColor = 'rgba(20,14,28,.30)';
      ctx.shadowBlur = 6 / Math.min(sx, sy);
      ctx.shadowOffsetY = 2 / sy;
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      return;
    }

    desenharSilhuetaTransformada(corHex, meta, SILHUETAS[p.silhueta], sx, sy, srcA);
    ctx.restore();
  };

  const desenharSilhuetaTransformada = (corHex, meta, silhueta, sx, sy, srcA) => {
    const corpo = new Path2D(silhueta.corpo);
    const detalhe = new Path2D(silhueta.detalhe);

    ctx.shadowColor = 'rgba(20,14,28,.28)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1.2;
    ctx.fillStyle = corHex;
    ctx.globalAlpha = 0.96;
    ctx.fill(corpo);
    ctx.shadowColor = 'transparent';

    ctx.clip(corpo);
    const grad = ctx.createLinearGradient(0, srcA.y, 0, meta.baseY);
    grad.addColorStop(0, 'rgba(255,255,255,.10)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,.16)');
    ctx.fillStyle = grad;
    ctx.fill(corpo);

    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.2 / Math.min(sx, sy);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = luminancia(corHex) > 0.55 ? 'rgba(20,16,12,.30)' : 'rgba(255,255,255,.42)';
    ctx.stroke(detalhe);
  };

  /* Fallback quando a foto nao carrega: a silhueta vetorial no lugar */
  const desenharSilhueta = (p, corHex, meta) => {
    const semFoto = { ...p, foto: null };
    desenharPeca(semFoto, corHex);
  };

  const desenharTudo = () => {
    ctx.clearRect(0, 0, W, H);
    if (estado.foto) ctx.drawImage(estado.foto, 0, 0, W, H);
    else desenharManequim();

    ORDEM_DESENHO.forEach((parte) => {
      const id = estado.pecas[parte];
      if (!id) return;
      const p = produto(id);
      if (!p) return;
      const cor = estado.cores[id] || p.cores[0].hex;
      desenharPeca(p, cor);
    });

    posicionarGuias();
  };

  /* ---------------- Guias arrastaveis ---------------- */

  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    return n;
  };

  const construirGuias = () => {
    svg.innerHTML = '';
    const r = W * 0.017;
    LINHAS.forEach((l) => {
      const grupo = el('g', { class: 'guia', 'data-linha': l.id });
      grupo.appendChild(el('line', { class: 'guia__linha', 'stroke-width': W * 0.004 }));
      grupo.appendChild(el('line', { class: 'guia__pegar', 'stroke-width': W * 0.05, 'data-arrastar': 'linha' }));
      grupo.appendChild(el('circle', { class: 'guia__ponto', r, 'data-arrastar': 'E', tabindex: '0',
        role: 'slider', 'aria-label': `${l.rotulo}, lado esquerdo` }));
      grupo.appendChild(el('circle', { class: 'guia__ponto', r, 'data-arrastar': 'D', tabindex: '0',
        role: 'slider', 'aria-label': `${l.rotulo}, lado direito` }));
      const texto = el('text', { class: 'guia__rotulo', 'font-size': W * 0.026 });
      texto.textContent = l.rotulo;
      grupo.appendChild(texto);
      svg.appendChild(grupo);
    });
    posicionarGuias();
  };

  const posicionarGuias = () => {
    svg.style.display = estado.mostrarGuias ? '' : 'none';
    LINHAS.forEach((l) => {
      const g = svg.querySelector(`[data-linha="${l.id}"]`);
      if (!g) return;
      const E = px(estado.guias[`${l.id}E`]);
      const D = px(estado.guias[`${l.id}D`]);
      g.querySelectorAll('line').forEach((ln) => {
        ln.setAttribute('x1', E.x); ln.setAttribute('y1', E.y);
        ln.setAttribute('x2', D.x); ln.setAttribute('y2', D.y);
      });
      const [cE, cD] = g.querySelectorAll('circle');
      cE.setAttribute('cx', E.x); cE.setAttribute('cy', E.y);
      cD.setAttribute('cx', D.x); cD.setAttribute('cy', D.y);
      const t = g.querySelector('text');
      t.setAttribute('x', D.x + W * 0.03);
      t.setAttribute('y', D.y + W * 0.009);
    });
  };

  const ligarArrasto = () => {
    let arrasto = null;

    const paraCanvas = (e) => {
      const r = svg.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    };

    svg.addEventListener('pointerdown', (e) => {
      const alvo = e.target.closest('[data-arrastar]');
      if (!alvo) return;
      const linha = alvo.closest('[data-linha]').dataset.linha;
      const modo = alvo.dataset.arrastar;
      const p = paraCanvas(e);
      arrasto = {
        linha, modo, origem: p,
        E0: { ...estado.guias[`${linha}E`] },
        D0: { ...estado.guias[`${linha}D`] }
      };
      svg.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    svg.addEventListener('pointermove', (e) => {
      if (!arrasto) return;
      const p = paraCanvas(e);
      const dx = (p.x - arrasto.origem.x) / W;
      const dy = (p.y - arrasto.origem.y) / H;
      const { linha, modo, E0, D0 } = arrasto;
      if (modo === 'linha' || modo === 'E') {
        estado.guias[`${linha}E`] = { x: limitar(E0.x + dx), y: limitar(E0.y + dy) };
      }
      if (modo === 'linha' || modo === 'D') {
        estado.guias[`${linha}D`] = { x: limitar(D0.x + dx), y: limitar(D0.y + dy) };
      }
      desenharTudo();
    });

    const soltar = () => {
      if (!arrasto) return;
      arrasto = null;
      salvar();
    };
    svg.addEventListener('pointerup', soltar);
    svg.addEventListener('pointercancel', soltar);

    /* Teclado: setas movem o ponto focado (Shift = passo maior) */
    svg.addEventListener('keydown', (e) => {
      const alvo = e.target.closest('circle[data-arrastar]');
      if (!alvo) return;
      const passo = (e.shiftKey ? 0.02 : 0.005);
      const mapa = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo] };
      if (!mapa[e.key]) return;
      e.preventDefault();
      const chave = `${alvo.closest('[data-linha]').dataset.linha}${alvo.dataset.arrastar}`;
      const g = estado.guias[chave];
      estado.guias[chave] = { x: limitar(g.x + mapa[e.key][0]), y: limitar(g.y + mapa[e.key][1]) };
      desenharTudo();
      salvar();
    });
  };

  /* ---------------- Painel ---------------- */

  const pecasPorParte = (parte) =>
    PRODUTOS.filter((p) => ANCORAS[p.silhueta] && ANCORAS[p.silhueta].parte === parte);

  const selecionar = (parte, id) => {
    if (estado.pecas[parte] === id) {
      estado.pecas[parte] = null;
    } else {
      estado.pecas[parte] = id;
      /* vestido substitui cima + baixo, e vice-versa */
      if (parte === 'vestido') { estado.pecas.cima = null; estado.pecas.baixo = null; }
      if (parte === 'cima' || parte === 'baixo') estado.pecas.vestido = null;
    }
    desenharTudo();
    salvar();
    atualizarPainel();
  };

  const desenharPainel = () => {
    painel.innerHTML = `
      <section class="painel prova__passo" aria-labelledby="pv-foto">
        <div class="painel__topo">
          <h3 id="pv-foto"><span class="prova__num">1</span> Sua foto</h3>
        </div>
        <div data-area-foto></div>
        <p class="apoio" style="margin:12px 0 0;display:flex;gap:8px;align-items:flex-start">
          ${icone('cadeado', { classe: 'i--sm' })}
          <span>A foto fica so no seu aparelho. Nada e enviado para a loja ou para qualquer servidor.</span>
        </p>
      </section>

      <section class="painel prova__passo" aria-labelledby="pv-pecas">
        <div class="painel__topo">
          <h3 id="pv-pecas"><span class="prova__num">2</span> Pecas</h3>
        </div>
        <div class="prova__abas" role="tablist" aria-label="Tipo de peca" data-abas></div>
        <div data-lista-pecas></div>
      </section>

      <section class="painel prova__passo" aria-labelledby="pv-look">
        <div class="painel__topo">
          <h3 id="pv-look"><span class="prova__num">3</span> Seu look</h3>
        </div>
        <div data-look></div>
      </section>`;

    painel.querySelector('[data-abas]').innerHTML = PARTES.map(
      (pt, i) => `<button class="chip-aba" type="button" role="tab" data-aba="${pt.id}"
        aria-selected="${i === 0}">${pt.nome}</button>`
    ).join('');

    painel.addEventListener('click', (e) => {
      const aba = e.target.closest('[data-aba]');
      if (aba) {
        painel.querySelectorAll('[data-aba]').forEach((a) => a.setAttribute('aria-selected', String(a === aba)));
        desenharLista(aba.dataset.aba);
        return;
      }
      const tile = e.target.closest('[data-escolher]');
      if (tile) {
        selecionar(tile.dataset.parte, tile.dataset.escolher);
        return;
      }
      const cor = e.target.closest('[data-cor-peca]');
      if (cor) {
        estado.cores[cor.dataset.id] = cor.dataset.corPeca;
        desenharTudo();
        salvar();
        atualizarPainel();
        return;
      }
      if (e.target.closest('[data-remover-foto]')) { removerFoto(); desenharTudo(); atualizarPainel(); return; }
      if (e.target.closest('[data-detectar]')) { detectarCorpo(e.target.closest('[data-detectar]')); return; }
      if (e.target.closest('[data-redefinir-guias]')) {
        estado.guias = JSON.parse(JSON.stringify(GUIAS_PADRAO));
        desenharTudo(); salvar(); return;
      }
      if (e.target.closest('[data-baixar]')) { baixar(); return; }
      if (e.target.closest('[data-limpar-look]')) {
        estado.pecas = { cima: null, baixo: null, vestido: null, sobre: null };
        desenharTudo(); salvar(); atualizarPainel(); return;
      }
    });

    painel.addEventListener('change', (e) => {
      if (e.target.matches('[data-arquivo]')) {
        carregarArquivo(e.target.files[0]);
        e.target.value = '';
      }
      if (e.target.matches('[data-mostrar-guias]')) {
        estado.mostrarGuias = e.target.checked;
        posicionarGuias();
        salvar();
      }
    });

    /* Arrastar e soltar a foto sobre o palco */
    palco.addEventListener('dragover', (e) => { e.preventDefault(); palco.dataset.solta = 'true'; });
    palco.addEventListener('dragleave', () => { palco.dataset.solta = 'false'; });
    palco.addEventListener('drop', (e) => {
      e.preventDefault();
      palco.dataset.solta = 'false';
      carregarArquivo(e.dataTransfer.files[0]);
    });
  };

  const desenharLista = (parte) => {
    const lista = painel.querySelector('[data-lista-pecas]');
    const itens = pecasPorParte(parte);
    lista.innerHTML = `
      <div class="prova__grade">
        ${itens.map((p) => {
          const ativo = estado.pecas[parte] === p.id;
          const cor = estado.cores[p.id] || p.cores[0].hex;
          return `
          <button class="prova__tile" type="button" data-escolher="${p.id}" data-parte="${parte}"
                  aria-pressed="${ativo}">
            <img src="${imagem(p, cor)}" alt="" width="80" height="100" loading="lazy">
            <span class="prova__tile-nome">${esc(p.nome)}</span>
            <span class="apoio numero">${fmt(p.preco)}</span>
            ${ativo ? `<span class="prova__tile-check">${icone('check', { classe: 'i--sm' })}</span>` : ''}
          </button>`;
        }).join('')}
      </div>`;
  };

  const atualizarPainel = () => {
    /* foto */
    const area = painel.querySelector('[data-area-foto]');
    area.innerHTML = estado.foto
      ? `
        <div class="linha">
          <button class="btn btn--primario" type="button" data-detectar>
            ${icone('usuario')} ${estado.detectado ? 'Detectar de novo' : 'Detectar corpo automaticamente'}
          </button>
          <label class="btn btn--contorno">
            ${icone('troca')} Trocar foto
            <input type="file" accept="image/*" data-arquivo class="sr-only">
          </label>
          <button class="btn btn--perigo" type="button" data-remover-foto>Remover</button>
        </div>
        <div class="linha" style="margin-top:12px;justify-content:space-between">
          <label class="opcao" style="padding-left:0">
            <input type="checkbox" data-mostrar-guias ${estado.mostrarGuias ? 'checked' : ''}>
            <span class="opcao__caixa">${icone('check')}</span>
            <span class="opcao__texto">Mostrar guias do corpo</span>
          </label>
          <button class="link-botao" type="button" data-redefinir-guias>Redefinir guias</button>
        </div>
        <p class="apoio" style="margin:10px 0 0">
          ${estado.detectado
            ? 'Corpo detectado. Arraste um ponto se algo ficou fora do lugar.'
            : 'Arraste as guias ate os ombros, quadril, joelhos e tornozelos, ou use a deteccao automatica.'}
        </p>`
      : `
        <label class="prova__envio">
          <input type="file" accept="image/*" data-arquivo class="sr-only">
          ${icone('usuario', { classe: 'i--xl' })}
          <strong>Enviar foto de corpo inteiro</strong>
          <span class="apoio">De frente, em pe, com boa luz. Arraste aqui ou toque para escolher.</span>
        </label>
        <p class="apoio" style="margin:10px 0 0">
          Sem foto, as pecas aparecem no manequim ao lado.
        </p>`;

    /* lista da aba ativa */
    const abaAtiva = painel.querySelector('[data-aba][aria-selected="true"]');
    desenharLista(abaAtiva ? abaAtiva.dataset.aba : 'cima');

    /* look */
    const look = painel.querySelector('[data-look]');
    const escolhidas = ORDEM_DESENHO.map((parte) => estado.pecas[parte]).filter(Boolean).map(produto);
    look.innerHTML = escolhidas.length
      ? `
        <div class="pilha" style="gap:12px">
          ${escolhidas.map((p) => {
            const cor = estado.cores[p.id] || p.cores[0].hex;
            return `
            <div class="prova__item">
              <img src="${imagem(p, cor)}" alt="" width="48" height="60">
              <div style="min-width:0;flex:1">
                <strong style="display:block;font-size:.9375rem">${esc(p.nome)}</strong>
                <span class="apoio">${esc(nomeCategoria(p.categoria))} &middot; <span class="numero">${fmt(p.preco)}</span></span>
                <div class="grade-cores" style="margin-top:6px" role="radiogroup" aria-label="Cor de ${esc(p.nome)}">
                  ${p.cores.map((c) => `
                    <button class="cor-btn" type="button" role="radio" style="width:34px;height:34px"
                            aria-checked="${c.hex === cor}" aria-label="${esc(c.nome)}" title="${esc(c.nome)}"
                            data-cor-peca="${c.hex}" data-id="${p.id}">
                      <span class="cor-btn__disco" style="background:${c.hex};width:20px;height:20px"></span>
                    </button>`).join('')}
                </div>
              </div>
              <button class="btn btn--contorno" type="button" data-compra-rapida="${p.id}"
                      aria-label="Adicionar ${esc(p.nome)} a sacola">${icone('sacola')}</button>
            </div>`;
          }).join('')}
        </div>
        <div class="resumo__total"><span>Look completo</span>
          <span>${fmt(escolhidas.reduce((s, p) => s + p.preco, 0))}</span></div>
        <div class="linha" style="margin-top:16px">
          <button class="btn btn--primario" type="button" data-baixar>${icone('pacote')} Salvar imagem</button>
          <button class="btn btn--fantasma" type="button" data-limpar-look>Limpar look</button>
        </div>`
      : `<p class="suave" style="margin:0">Escolha pelo menos uma peca acima para montar o look.</p>`;
  };

  /* ---------------- Exportar ---------------- */

  /* As guias sao SVG por cima do canvas, entao nunca entram na imagem exportada. */
  const baixar = () => {
    canvas.toBlob((blob) => {
      if (!blob) {
        toast('Nao consegui gerar a imagem.', { tipo: 'erro' });
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'flor-de-margarida-look.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast('Imagem salva. Se o download nao abrir, tire uma captura de tela.');
    }, 'image/png');
  };

  /* ---------------- Inicio ---------------- */

  const iniciar = async () => {
    palco = document.querySelector('[data-palco]');
    canvas = palco.querySelector('canvas');
    svg = palco.querySelector('svg');
    painel = document.querySelector('[data-painel-prova]');
    ctx = canvas.getContext('2d');

    desenharPainel();
    await restaurar();

    /* ?peca=id vindo da pagina do produto */
    const pre = new URLSearchParams(location.search).get('peca');
    const p = pre && produto(pre);
    if (p && ANCORAS[p.silhueta] && ANCORAS[p.silhueta].parte !== 'acessorio') {
      const parte = ANCORAS[p.silhueta].parte;
      estado.pecas[parte] = p.id;
      if (parte === 'vestido') { estado.pecas.cima = null; estado.pecas.baixo = null; }
      else estado.pecas.vestido = null;
      const aba = painel.querySelector(`[data-aba="${parte}"]`);
      painel.querySelectorAll('[data-aba]').forEach((a) => a.setAttribute('aria-selected', String(a === aba)));
    }

    ajustarPalco();
    ligarArrasto();
    desenharTudo();
    atualizarPainel();
  };

  return { iniciar };
})();
