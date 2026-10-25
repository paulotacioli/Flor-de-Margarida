/* =========================================================
   Painel Customize - lado do navegador.

   Dois modos, decididos em tempo de execucao:
   - ONLINE (site publicado no claude.ai): o pedido vai para o
     banco compartilhado do artifact (db) e os anexos para o
     armazenamento do artifact (assets). O despacho agendado na
     maquina da administracao (ferramentas/despachar.ps1, a cada
     10 min) le a fila e executa seguindo
     ferramentas/PROTOCOLO-CUSTOMIZE.md. Quando a dona envia o
     pedido, a pagina ainda tenta um comentario "enviado ao Claude"
     para acordar uma sessao aberta na hora; para convidadas por
     e-mail isso nao e oferecido pelo plano, e tudo bem.
   - LOCAL (npm start): fala com /api/* do server.js, que executa
     `claude -p` na propria maquina.
   Sem nenhum dos dois, mostra um aviso.
   ========================================================= */

const Customize = (() => {
  const { esc, toast } = Loja;

  const LIMITE_DIA = 15;
  const LIMITE_TENTATIVAS = 5;

  const ROTULOS = {
    na_fila: { texto: 'Na fila', classe: 'status--fila' },
    em_andamento: { texto: 'Em andamento', classe: 'status--andamento' },
    concluido: { texto: 'Concluido', classe: 'status--ok' },
    falha: { texto: 'Falha', classe: 'status--falha' }
  };

  let raiz, acoes;
  let usuario = null; // { nome, dono, podeEscrever }
  let estado = null; // { solicitacoes, hoje, limiteDia, limiteTentativas, pausado, pausadoMotivo, emExecucao }
  let backend = null;
  let anexosSelecionados = [];

  /* ---------------- Formatacao ---------------- */

  const quando = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };
  const tamanho = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);
  const hoje = () => new Date().toLocaleDateString('sv-SE');
  const novoId = () => new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14) + '-' + Math.random().toString(36).slice(2, 6);

  /* =========================================================
     BACKEND ONLINE (claude.ai)
     ========================================================= */

  const criarBackendOnline = async () => {
    if (!window.claude || typeof window.claude.use !== 'function') return null;
    const db = await window.claude.use('db');
    if (!db) return null;
    const [assets, comments, user] = await Promise.all([
      window.claude.use('assets'),
      window.claude.use('comments'),
      window.claude.use('user')
    ]);

    const nomes = new Map();
    const nomeDe = async (id) => {
      if (!id) return 'Alguem';
      if (nomes.has(id)) return nomes.get(id);
      let nome = '';
      try {
        if (user && user.profiles) {
          const ps = await user.profiles([id]);
          nome = (ps && ps[id] && ps[id].name) || '';
        }
      } catch {
        nome = '';
      }
      nomes.set(id, nome || 'Alguem');
      return nomes.get(id);
    };

    let eu = { id: null, nome: 'Voce', dono: false, podeEscrever: true };
    try {
      const me = user ? await user.me() : null;
      const [dono, pode] = await Promise.all([
        user ? user.isOwner() : false,
        user ? user.can('data.write') : null
      ]);
      eu = {
        id: me ? me.id : null,
        nome: (me && me.name) || (dono ? 'Administracao' : 'Voce'),
        dono: !!dono,
        podeEscrever: pode !== false
      };
    } catch {
      /* segue com os padroes */
    }

    const docEstado = db.doc('estado/despacho');
    const pedidos = db.collection('pedidos');

    const montarEstado = async (docs, despacho) => {
      const lista = await Promise.all(
        docs.map(async (d) => {
          const s = d.data();
          return {
            id: d.id,
            texto: s.texto,
            autor: s.autorNome || (await nomeDe(s.autorId)),
            autorId: s.autorId,
            criadoEm: s.criadoEm,
            status: s.status,
            aguardando: s.aguardando || null,
            tentativas: s.tentativas || 0,
            resumo: s.resumo || null,
            motivo: s.motivo || null,
            concluidoEm: s.concluidoEm || null,
            anexos: s.anexos || [],
            aviso: s.aviso || null
          };
        })
      );
      lista.sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)));
      return {
        solicitacoes: lista,
        hoje: lista.filter((s) => s.status === 'concluido' && String(s.concluidoEm).slice(0, 10) === hoje()).length,
        limiteDia: LIMITE_DIA,
        limiteTentativas: LIMITE_TENTATIVAS,
        pausado: !!(despacho && despacho.pausado),
        pausadoMotivo: (despacho && despacho.pausadoMotivo) || '',
        emExecucao: lista.some((s) => s.status === 'em_andamento'),
        online: true
      };
    };

    let ultimosDocs = [];
    let ultimoDespacho = null;

    return {
      modo: 'online',
      usuario: eu,

      observar(cb) {
        const emitir = async () => cb(await montarEstado(ultimosDocs, ultimoDespacho));
        const parar1 = pedidos.onSnapshot(
          (snap) => {
            ultimosDocs = snap.docs;
            emitir();
          },
          (e) => toast(`Nao consegui ler os pedidos: ${e.message || e.code}`, { tipo: 'erro' })
        );
        const parar2 = docEstado.onSnapshot((snap) => {
          ultimoDespacho = snap.exists ? snap.data() : null;
          emitir();
        });
        return () => {
          parar1();
          parar2();
        };
      },

      async criar(texto, arquivos) {
        const id = novoId();
        const anexos = [];
        if (arquivos.length && !assets) throw new Error('Anexos indisponiveis para este acesso. Envie o pedido sem anexo ou peca acesso de edicao.');
        for (const f of arquivos) {
          const r = await assets.upload(f);
          anexos.push({ id: r.id, url: r.url, nome: f.name, tipo: f.type, tamanho: f.size });
        }
        const doc = {
          texto,
          anexos,
          autorId: eu.id,
          autorNome: eu.nome,
          criadoEm: new Date().toISOString(),
          status: 'na_fila',
          tentativas: 0,
          origem: 'online'
        };
        await pedidos.doc(id).set(doc);

        /* Tenta acordar uma sessao do Claude Code aberta agora (so a dona
           consegue). Sem isso, o despacho agendado pega o pedido em ate
           10 minutos; o aviso guardado e apenas informativo. */
        let aviso = null;
        try {
          const pode = comments ? await comments.canSendToClaude() : 'off';
          if (pode === 'available') {
            const alvo = document.querySelector(`[data-pedido="${id}"]`) || raiz;
            const anchor = await comments.anchorFor(alvo);
            await comments.sendToClaude({
              anchor,
              text: `Pedido ${id} (Customize) de ${eu.nome}: ${texto.slice(0, 1200)}${anexos.length ? ` [${anexos.length} anexo(s)]` : ''}`
            });
          } else {
            aviso = pode === 'no_session' ? 'sem_sessao' : 'sem_envio';
          }
        } catch (e) {
          aviso = e && e.code === 'claude_unavailable' ? 'sem_sessao' : 'sem_envio';
        }
        if (aviso) await pedidos.doc(id).update({ aviso });
        return id;
      },

      async cancelar(id) {
        const snap = await pedidos.doc(id).get();
        if (!snap.exists) throw new Error('Pedido nao encontrado.');
        const s = snap.data();
        if (s.status !== 'na_fila') throw new Error('So pedidos na fila podem ser cancelados.');
        if (!eu.dono && s.autorId !== eu.id) throw new Error('Voce so cancela os seus pedidos.');
        await pedidos.doc(id).update({ status: 'falha', motivo: `Cancelado por ${eu.nome}` });
      },

      async retomar() {
        if (!eu.dono) throw new Error('So a administracao pode retomar o despacho.');
        const snap = await docEstado.get();
        if (snap.exists) await docEstado.update({ pausado: false, pausadoMotivo: '', falhasSeguidas: 0 });
        else await docEstado.set({ pausado: false, pausadoMotivo: '', falhasSeguidas: 0 });
      },

      sair: null
    };
  };

  /* =========================================================
     BACKEND LOCAL (server.js)
     ========================================================= */

  const api = async (rota, opcoes = {}) => {
    const r = await fetch(rota, {
      method: opcoes.metodo || 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined
    });
    let dados = {};
    try {
      dados = await r.json();
    } catch {
      dados = {};
    }
    if (!r.ok) throw Object.assign(new Error(dados.erro || `Erro ${r.status}`), { status: r.status });
    return dados;
  };

  const paraBase64 = (arquivo) =>
    new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onload = () => resolve({ nome: arquivo.name, tipo: arquivo.type, base64: String(leitor.result).split(',')[1] });
      leitor.onerror = () => reject(new Error(`Nao consegui ler ${arquivo.name}`));
      leitor.readAsDataURL(arquivo);
    });

  const criarBackendLocal = async () => {
    let sessao;
    try {
      sessao = await api('/api/sessao');
    } catch (e) {
      if (e.status !== 401) return null; // sem servidor local
      sessao = null;
    }
    let temporizador = null;
    let cb = null;
    const ler = async () => {
      try {
        const e = await api('/api/solicitacoes');
        e.online = false;
        if (cb) cb(e);
        const ativo = e.emExecucao || e.solicitacoes.some((s) => s.status === 'na_fila');
        if (ativo && !temporizador) temporizador = setInterval(ler, 5000);
        if (!ativo && temporizador) {
          clearInterval(temporizador);
          temporizador = null;
        }
      } catch (erro) {
        if (erro.status === 401) {
          clearInterval(temporizador);
          temporizador = null;
          telaEntrarLocal('Sua sessao expirou. Entre de novo.');
        }
      }
    };
    return {
      modo: 'local',
      usuario: sessao ? { ...sessao.usuario, podeEscrever: true } : null,
      async entrar(codigo) {
        const r = await api('/api/entrar', { metodo: 'POST', corpo: { codigo } });
        this.usuario = { ...r.usuario, podeEscrever: true };
        return this.usuario;
      },
      observar(f) {
        cb = f;
        ler();
        return () => {
          clearInterval(temporizador);
          temporizador = null;
        };
      },
      async criar(texto, arquivos) {
        const anexos = await Promise.all(arquivos.map(paraBase64));
        const r = await api('/api/solicitacoes', { metodo: 'POST', corpo: { texto, anexos } });
        ler();
        return r.solicitacao.id;
      },
      async cancelar(id) {
        await api(`/api/solicitacoes/${id}/cancelar`, { metodo: 'POST' });
        ler();
      },
      async retomar() {
        await api('/api/retomar', { metodo: 'POST' });
        ler();
      },
      async sair() {
        await api('/api/sair', { metodo: 'POST' });
      }
    };
  };

  /* =========================================================
     TELAS
     ========================================================= */

  const telaSemBackend = () => {
    acoes.innerHTML = '';
    raiz.innerHTML = `
      <div class="painel" style="max-width:640px">
        <div class="painel__topo"><h3>${icone('info')} Painel indisponivel neste endereco</h3></div>
        <p>
          O Customize funciona no site publicado no claude.ai (para quem foi convidada como editora)
          ou no servidor local da administracao (<code>npm start</code>).
        </p>
        <p class="apoio" style="margin:0">Aqui nao ha como registrar pedidos.</p>
      </div>`;
  };

  const telaSomenteLeitura = () => {
    acoes.innerHTML = '';
    raiz.innerHTML = `
      <div class="painel" style="max-width:640px">
        <div class="painel__topo"><h3>${icone('cadeado')} Acesso restrito</h3></div>
        <p>Voce pode ver o site, mas so a administracao e a Flor de Margarida (convidadas como editoras) pedem alteracoes.</p>
      </div>`;
  };

  const telaEntrarLocal = (mensagem = '') => {
    acoes.innerHTML = '';
    raiz.innerHTML = `
      <div class="painel" style="max-width:460px">
        <div class="painel__topo"><h3>${icone('cadeado')} Acesso restrito</h3></div>
        <p class="suave">So a administracao e a Flor de Margarida tem codigo de acesso.</p>
        <form data-form-entrar novalidate>
          <div class="campo" ${mensagem ? 'data-invalido="true"' : ''}>
            <label class="campo__rotulo" for="codigo">Codigo de acesso</label>
            <input type="password" id="codigo" name="codigo" autocomplete="current-password" placeholder="FM-XXXX-XXXX" required>
            <p class="campo__erro">${mensagem ? icone('alerta') + `<span>${esc(mensagem)}</span>` : ''}</p>
          </div>
          <button class="btn btn--primario btn--bloco btn--grande" type="submit">Entrar</button>
        </form>
      </div>`;
    const form = raiz.querySelector('[data-form-entrar]');
    form.codigo.focus();
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      form.querySelector('button').disabled = true;
      try {
        usuario = await backend.entrar(form.codigo.value);
        toast(`Bem-vinda, ${usuario.nome}`);
        telaPainel();
      } catch (erro) {
        telaEntrarLocal(erro.message);
      }
    });
  };

  const telaPainel = () => {
    acoes.innerHTML = `
      <div class="linha">
        <span class="apoio">${icone('usuario', { classe: 'i--sm' })} ${esc(usuario.nome)}${backend.modo === 'online' ? ' &middot; online' : ''}</span>
        ${backend.sair ? '<button class="btn btn--fantasma" type="button" data-sair>Sair</button>' : ''}
      </div>`;
    const sair = acoes.querySelector('[data-sair]');
    if (sair) {
      sair.addEventListener('click', async () => {
        await backend.sair();
        usuario = null;
        telaEntrarLocal();
      });
    }

    raiz.innerHTML = `
      <div class="customize">
        <section class="painel" aria-labelledby="cz-novo">
          <div class="painel__topo"><h3 id="cz-novo">Novo pedido</h3></div>
          ${
            usuario.podeEscrever
              ? `
          <form data-form-pedido novalidate>
            <div class="resumo-erros" role="alert"></div>
            <div class="campo">
              <label class="campo__rotulo" for="texto">O que voce quer mudar no site? <span class="obrigatorio" aria-hidden="true">*</span></label>
              <textarea id="texto" name="texto" rows="6" required maxlength="4000"
                        placeholder="Ex.: Trocar a frase do topo da home por 'Vista o que te faz florescer'. Colocar o vestido longo em destaque nas novidades."></textarea>
              <p class="campo__ajuda">Seja especifica: onde fica, o que esta hoje e como deve ficar. Um pedido por assunto funciona melhor.</p>
              <p class="campo__erro"></p>
            </div>
            <div class="campo">
              <span class="campo__rotulo">Anexos <span class="campo__opcional">opcional - imagens ou PDF, ate 5</span></span>
              <label class="prova__envio" style="padding:20px">
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" multiple data-anexos class="sr-only">
                ${icone('pacote', { classe: 'i--lg' })}
                <strong>Escolher arquivos</strong>
                <span class="apoio">Fotos de referencia, print da tela, PDF com o texto...</span>
              </label>
              <div class="fichas" data-lista-anexos style="margin:8px 0 0"></div>
            </div>
            <div class="linha" style="justify-content:space-between">
              <span class="apoio" data-cota></span>
              <button class="btn btn--primario btn--grande" type="submit">${icone('seta_direita')} Enviar pedido</button>
            </div>
          </form>`
              : `<p class="suave" style="margin:0">Voce pode acompanhar os pedidos, mas nao registrar novos com este acesso.</p>`
          }
        </section>

        <section aria-labelledby="cz-lista">
          <div class="secao-topo" style="margin-bottom:16px">
            <h2 id="cz-lista" style="font-size:1.5rem;margin:0">Pedidos</h2>
            <span class="apoio" data-resumo-fila></span>
          </div>
          <div data-aviso-pausa></div>
          <div class="pilha" data-lista-pedidos></div>
        </section>
      </div>`;

    const form = raiz.querySelector('[data-form-pedido]');
    if (form) {
      const inputAnexos = form.querySelector('[data-anexos]');
      anexosSelecionados = [];
      inputAnexos.addEventListener('change', () => {
        for (const f of [...inputAnexos.files]) {
          if (anexosSelecionados.length >= 5) {
            toast('No maximo 5 anexos por pedido.', { tipo: 'erro' });
            break;
          }
          if (f.size > 8 * 1024 * 1024) {
            toast(`${f.name} passa de 8 MB.`, { tipo: 'erro' });
            continue;
          }
          anexosSelecionados.push(f);
        }
        inputAnexos.value = '';
        desenharAnexos();
      });
      form.querySelector('[data-lista-anexos]').addEventListener('click', (e) => {
        const b = e.target.closest('[data-remover-anexo]');
        if (!b) return;
        anexosSelecionados.splice(Number(b.dataset.removerAnexo), 1);
        desenharAnexos();
      });

      Componentes.ligarValidacao(form);
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!Componentes.validarFormulario(form)) return;
        const botao = form.querySelector('button[type="submit"]');
        botao.disabled = true;
        botao.innerHTML = '<span class="btn__spinner"></span> Enviando';
        try {
          await backend.criar(form.texto.value.trim(), anexosSelecionados);
          form.reset();
          anexosSelecionados = [];
          desenharAnexos();
          toast('Pedido na fila. Voce acompanha o andamento aqui embaixo.');
        } catch (erro) {
          if (erro.status === 401) return telaEntrarLocal('Sua sessao expirou. Entre de novo.');
          toast(erro.message || 'Nao consegui enviar o pedido.', { tipo: 'erro' });
        } finally {
          botao.disabled = false;
          botao.innerHTML = `${icone('seta_direita')} Enviar pedido`;
        }
      });
      desenharAnexos();
    }

    raiz.querySelector('[data-lista-pedidos]').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-cancelar]');
      if (!b) return;
      if (!confirm('Cancelar este pedido?')) return;
      try {
        await backend.cancelar(b.dataset.cancelar);
      } catch (erro) {
        toast(erro.message, { tipo: 'erro' });
      }
    });
    raiz.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-retomar]')) return;
      try {
        await backend.retomar();
        toast('Despacho retomado.');
      } catch (erro) {
        toast(erro.message, { tipo: 'erro' });
      }
    });

    backend.observar(aplicarEstado);
  };

  const desenharAnexos = () => {
    const lista = raiz.querySelector('[data-lista-anexos]');
    if (!lista) return;
    lista.innerHTML = anexosSelecionados
      .map(
        (f, i) => `<span class="ficha">${esc(f.name)} <span class="apoio">${tamanho(f.size)}</span>
          <button type="button" data-remover-anexo="${i}" aria-label="Remover ${esc(f.name)}">${icone('fechar', { classe: 'i--sm' })}</button></span>`
      )
      .join('');
  };

  /* ---------------- Lista de pedidos ---------------- */

  const aplicarEstado = (novo) => {
    estado = novo;
    const cota = raiz.querySelector('[data-cota]');
    if (cota) cota.innerHTML = `<span class="numero">${estado.hoje}</span> de ${estado.limiteDia} alteracoes concluidas hoje`;

    const resumo = raiz.querySelector('[data-resumo-fila]');
    const naFila = estado.solicitacoes.filter((s) => s.status === 'na_fila').length;
    if (resumo) resumo.textContent = estado.emExecucao ? 'Executando um pedido agora' : naFila ? `${naFila} na fila` : 'Fila vazia';

    const aviso = raiz.querySelector('[data-aviso-pausa]');
    if (aviso) {
      aviso.innerHTML = estado.pausado
        ? `<div class="resumo-erros" data-visivel="true" style="margin-bottom:16px">
             ${icone('alerta', { classe: 'i--lg' })}
             <div><strong>Despacho pausado</strong><p style="margin:4px 0 8px;font-size:.875rem">${esc(estado.pausadoMotivo)}</p>
             ${usuario.dono ? '<button class="btn btn--contorno" type="button" data-retomar>Retomar despacho</button>' : '<span class="apoio">Avise a administracao para retomar.</span>'}
             </div></div>`
        : estado.hoje >= estado.limiteDia
          ? `<p class="campo__ajuda" style="margin-bottom:16px">${icone('info', { classe: 'i--sm' })} Limite de ${estado.limiteDia} alteracoes por dia atingido. Novos pedidos ficam na fila e comecam amanha.</p>`
          : '';
    }

    const lista = raiz.querySelector('[data-lista-pedidos]');
    if (!lista) return;
    lista.innerHTML = estado.solicitacoes.length
      ? estado.solicitacoes.map(cardPedido).join('')
      : `<div class="vazio" style="padding:40px 16px">${icone('pacote', { classe: 'i--xl' })}<h3>Nenhum pedido ainda</h3><p>O primeiro pedido aparece aqui com o andamento.</p></div>`;
  };

  const cardPedido = (s) => {
    const r = ROTULOS[s.status] || ROTULOS.na_fila;
    let detalhe = '';
    if (s.status === 'concluido') detalhe = `${icone('check_circulo', { classe: 'i--sm' })} ${esc(s.resumo || 'Alteracao aplicada.')}`;
    else if (s.status === 'falha') detalhe = `<span class="pedido__detalhe--falha">${icone('alerta', { classe: 'i--sm' })} ${esc(s.motivo || 'Sem motivo registrado.')}</span>`;
    else if (s.status === 'em_andamento') detalhe = `${icone('relogio', { classe: 'i--sm' })} Tentativa ${s.tentativas + 1} de ${estado.limiteTentativas}. Isso costuma levar alguns minutos.`;
    else if (s.aguardando === 'limite_diario') detalhe = `${icone('relogio', { classe: 'i--sm' })} Aguardando o proximo dia (limite diario atingido).`;
    else if (s.tentativas) detalhe = `${icone('troca', { classe: 'i--sm' })} Vai tentar de novo (${s.tentativas} de ${estado.limiteTentativas} tentativas).`;
    else detalhe = `${icone('relogio', { classe: 'i--sm' })} Na fila. O despacho automatico da administracao comeca em ate 10 minutos.`;
    const podeCancelar = s.status === 'na_fila' && (usuario.dono || (s.autorId ? s.autorId === backend.usuario.id : s.autor === usuario.nome));
    return `
      <article class="pedido" data-pedido="${esc(s.id)}" data-status="${s.status}">
        <div class="pedido__topo">
          <span class="status ${r.classe}">${s.status === 'em_andamento' ? '<span class="btn__spinner"></span>' : ''}${r.texto}</span>
          <span class="apoio">${esc(s.autor)} &middot; ${quando(s.criadoEm)}${s.concluidoEm ? ` &middot; concluido ${quando(s.concluidoEm)}` : ''}</span>
          ${podeCancelar ? `<button class="btn btn--perigo" style="margin-left:auto;min-height:36px;padding:6px 12px" type="button" data-cancelar="${esc(s.id)}">Cancelar</button>` : ''}
        </div>
        <p class="pedido__texto">${esc(s.texto)}</p>
        ${
          s.anexos && s.anexos.length
            ? `<div class="fichas" style="margin:0">${s.anexos
                .map((a) => `<a class="ficha" href="${esc(a.url)}" target="_blank" rel="noopener">${icone(a.tipo === 'application/pdf' ? 'pacote' : 'usuario', { classe: 'i--sm' })} ${esc(a.nome)}</a>`)
                .join('')}</div>`
            : ''
        }
        ${detalhe ? `<p class="pedido__detalhe">${detalhe}</p>` : ''}
      </article>`;
  };

  /* ---------------- Inicio ---------------- */

  const iniciar = async () => {
    raiz = document.querySelector('[data-customize]');
    acoes = document.querySelector('[data-sessao-acoes]');
    if (!raiz) return;

    backend = await criarBackendOnline();
    if (backend) {
      usuario = backend.usuario;
      if (!usuario.podeEscrever && !usuario.dono) {
        telaSomenteLeitura();
        return;
      }
      telaPainel();
      return;
    }

    backend = await criarBackendLocal();
    if (!backend) {
      telaSemBackend();
      return;
    }
    if (backend.usuario) {
      usuario = backend.usuario;
      telaPainel();
    } else {
      telaEntrarLocal();
    }
  };

  return { iniciar };
})();
