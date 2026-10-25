/* =========================================================
   Componentes reutilizaveis: card de produto, compra rapida,
   acordeao e validacao de formularios.
   ========================================================= */

const Componentes = (() => {
  const { fmt, esc, imagem, nomeCategoria, produto, carrinho, favoritos, toast } = Loja;

  /* ---------------- Avaliacao ---------------- */

  const estrelas = (avaliacao) => {
    const cheias = Math.round(avaliacao.nota);
    return `<span class="linha" style="gap:4px" role="img"
      aria-label="Nota ${avaliacao.nota.toFixed(1)} de 5, ${avaliacao.total} avaliacoes">
      <span style="display:flex;gap:1px;color:var(--c-acento)">
        ${Array.from({ length: 5 }, (_, i) =>
          `<svg class="i i--sm" viewBox="0 0 24 24" fill="${i < cheias ? 'currentColor' : 'none'}"
             stroke="currentColor" stroke-width="1.4" aria-hidden="true">
             <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 17l-5.3 2.7 1.1-5.9-4.3-4.1 5.9-.8Z"/></svg>`
        ).join('')}
      </span>
      <span class="apoio numero">${avaliacao.nota.toFixed(1)} (${avaliacao.total})</span>
    </span>`;
  };

  /* ---------------- Card de produto ---------------- */

  const ETIQUETAS = {
    novo: { texto: 'Novo', classe: 'etiqueta--novo' },
    oferta: { texto: 'Oferta', classe: 'etiqueta--oferta' },
    top: { texto: 'Mais amado', classe: 'etiqueta--top' }
  };

  const cardProduto = (p) => {
    const etiqueta = p.tag ? ETIQUETAS[p.tag] : null;
    const esgotado = !p.tamanhos.some((t) => t.disponivel);
    const favorito = favoritos.tem(p.id);
    const desconto = p.precoAntigo
      ? Math.round(((p.precoAntigo - p.preco) / p.precoAntigo) * 100)
      : 0;

    return `
    <article class="card" data-card="${p.id}">
      <div class="card__topo">
        <a class="card__midia" href="produto.html?id=${p.id}" tabindex="-1" aria-hidden="true">
          <img src="${imagem(p, p.cores[0].hex)}" alt="" width="400" height="500" loading="lazy" decoding="async">
        </a>

        <div class="card__etiquetas">
          ${etiqueta ? `<span class="etiqueta ${etiqueta.classe}">${etiqueta.texto}</span>` : ''}
          ${desconto ? `<span class="etiqueta etiqueta--oferta">-${desconto}%</span>` : ''}
          ${esgotado ? '<span class="etiqueta etiqueta--esgotado">Esgotado</span>' : ''}
        </div>

        <button class="card__favorito" type="button" data-favoritar="${p.id}"
                aria-pressed="${favorito}" aria-label="${favorito ? 'Remover' : 'Salvar'} ${esc(p.nome)} nos favoritos">
          ${icone('coracao')}
        </button>

        ${
          esgotado
            ? ''
            : `<div class="card__rapido">
                 <button class="btn" type="button" data-compra-rapida="${p.id}">
                   ${icone('sacola')} Compra rapida
                 </button>
               </div>`
        }
      </div>

      <div class="card__corpo">
        <h3 class="card__nome"><a href="produto.html?id=${p.id}">${esc(p.nome)}</a></h3>
        <p class="card__meta">${esc(nomeCategoria(p.categoria))} &middot; ${esc(p.resumo)}</p>
        <div class="card__precos">
          <span class="preco numero${desconto ? ' preco--desconto' : ''}">${fmt(p.preco)}</span>
          ${p.precoAntigo ? `<span class="preco--antigo numero">${fmt(p.precoAntigo)}</span>` : ''}
        </div>
        <div class="amostras" aria-label="Cores disponiveis: ${p.cores.map((c) => c.nome).join(', ')}">
          ${p.cores.map((c) => `<span class="amostra" style="background:${c.hex}" title="${esc(c.nome)}"></span>`).join('')}
        </div>
      </div>
    </article>`;
  };

  /* ---------------- Compra rapida (modal) ---------------- */

  const garantirModalRapido = () => {
    let modal = document.querySelector('[data-camada="rapida"]');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'modal-compra-rapida';
    modal.dataset.camada = 'rapida';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Compra rapida');
    modal.setAttribute('inert', '');
    modal.innerHTML = '<div class="modal__caixa" data-rapida-corpo></div>';
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) Loja.fecharCamada();
    });
    return modal;
  };

  const abrirCompraRapida = (id) => {
    const p = produto(id);
    if (!p) return;

    const modal = garantirModalRapido();
    const corpo = modal.querySelector('[data-rapida-corpo]');
    const estado = { cor: p.cores[0].nome, tamanho: null };

    const desenhar = () => {
      const corHex = p.cores.find((c) => c.nome === estado.cor).hex;
      corpo.innerHTML = `
        <button class="btn-icone modal__fechar" type="button" data-fechar-rapida aria-label="Fechar">
          ${icone('fechar', { classe: 'i--lg' })}
        </button>
        <div style="display:grid;grid-template-columns:160px 1fr;gap:24px;align-items:start">
          <img src="${imagem(p, corHex)}" alt="${esc(p.nome)}" width="160" height="200"
               style="width:160px;height:200px;object-fit:cover;border-radius:12px">
          <div>
            <p class="olho">${esc(nomeCategoria(p.categoria))}</p>
            <h2 style="font-size:1.5rem;margin:4px 0 8px">${esc(p.nome)}</h2>
            <p class="preco numero" style="font-size:1.25rem">${fmt(p.preco)}</p>

            <div class="bloco-opcao" style="margin-top:20px">
              <div class="bloco-opcao__topo">
                <h3 id="rapida-cor">Cor</h3>
                <span class="bloco-opcao__valor">${esc(estado.cor)}</span>
              </div>
              <div class="grade-cores" role="radiogroup" aria-labelledby="rapida-cor">
                ${p.cores
                  .map(
                    (c) => `<button class="cor-btn" type="button" role="radio"
                      aria-checked="${c.nome === estado.cor}" aria-label="${esc(c.nome)}" data-rapida-cor="${esc(c.nome)}">
                      <span class="cor-btn__disco" style="background:${c.hex}"></span></button>`
                  )
                  .join('')}
              </div>
            </div>

            <div class="bloco-opcao">
              <div class="bloco-opcao__topo">
                <h3 id="rapida-tam">Tamanho</h3>
                <a class="link-botao" href="produto.html?id=${p.id}">Guia de medidas</a>
              </div>
              <div class="grade-tamanhos" role="radiogroup" aria-labelledby="rapida-tam">
                ${p.tamanhos
                  .map(
                    (t) => `<button class="tam-btn" type="button" role="radio"
                      aria-checked="${t.nome === estado.tamanho}" ${t.disponivel ? '' : 'disabled'}
                      aria-label="Tamanho ${t.nome}${t.disponivel ? '' : ', esgotado'}"
                      data-rapida-tam="${t.nome}">${t.nome}</button>`
                  )
                  .join('')}
              </div>
              <p class="campo__erro" data-erro-tamanho style="margin-top:8px">
                ${icone('alerta')} Escolha um tamanho para continuar.
              </p>
            </div>

            <button class="btn btn--primario btn--bloco btn--grande" type="button" data-rapida-add>
              ${icone('sacola')} Adicionar a sacola
            </button>
            <a class="btn btn--fantasma btn--bloco" href="produto.html?id=${p.id}" style="margin-top:8px">
              Ver todos os detalhes
            </a>
          </div>
        </div>`;

      corpo.querySelector('[data-fechar-rapida]').addEventListener('click', Loja.fecharCamada);

      corpo.querySelectorAll('[data-rapida-cor]').forEach((b) =>
        b.addEventListener('click', () => {
          estado.cor = b.dataset.rapidaCor;
          desenhar();
        })
      );

      corpo.querySelectorAll('[data-rapida-tam]').forEach((b) =>
        b.addEventListener('click', () => {
          estado.tamanho = b.dataset.rapidaTam;
          desenhar();
        })
      );

      corpo.querySelector('[data-rapida-add]').addEventListener('click', () => {
        const erro = corpo.querySelector('[data-erro-tamanho]');
        if (!estado.tamanho) {
          erro.style.display = 'flex';
          const primeiro = corpo.querySelector('.tam-btn:not([disabled])');
          if (primeiro) primeiro.focus();
          return;
        }
        carrinho.adicionar({ id: p.id, cor: estado.cor, tamanho: estado.tamanho, quantidade: 1 });
        Loja.fecharCamada();
        toast(`${p.nome} (${estado.tamanho}) na sacola`, {
          acao: 'Ver sacola',
          aoAcionar: () => {
            Loja.renderizarSacola();
            Loja.abrirCamada(document.querySelector('[data-camada="sacola"]'));
          }
        });
      });
    };

    desenhar();
    Loja.abrirCamada(modal);
  };

  /* ---------------- Delegacao das grades ---------------- */

  const ligarGrades = () => {
    document.addEventListener('click', (e) => {
      const fav = e.target.closest('[data-favoritar]');
      if (fav) {
        const id = fav.dataset.favoritar;
        const ativo = favoritos.alternar(id);
        fav.setAttribute('aria-pressed', String(ativo));
        const p = produto(id);
        fav.setAttribute(
          'aria-label',
          `${ativo ? 'Remover' : 'Salvar'} ${p ? p.nome : ''} nos favoritos`
        );
        toast(ativo ? 'Salvo nos favoritos' : 'Removido dos favoritos');
        return;
      }

      const rapida = e.target.closest('[data-compra-rapida]');
      if (rapida) abrirCompraRapida(rapida.dataset.compraRapida);
    });
  };

  /* ---------------- Acordeao ---------------- */

  const ligarAcordeoes = (escopo = document) => {
    escopo.querySelectorAll('.acordeao__cabeca').forEach((cabeca) => {
      cabeca.addEventListener('click', () => {
        const aberto = cabeca.getAttribute('aria-expanded') === 'true';
        cabeca.setAttribute('aria-expanded', String(!aberto));
        const corpo = document.getElementById(cabeca.getAttribute('aria-controls'));
        if (corpo) corpo.dataset.aberto = String(!aberto);
      });
    });
  };

  /* ---------------- Mascaras ---------------- */

  const digitos = (v) => v.replace(/\D/g, '');

  const MASCARAS = {
    cpf: (v) =>
      digitos(v)
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4'),
    cep: (v) => digitos(v).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2'),
    telefone: (v) => {
      const d = digitos(v).slice(0, 11);
      if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
      return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
    },
    cartao: (v) => digitos(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '),
    validade: (v) => digitos(v).slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2'),
    cvv: (v) => digitos(v).slice(0, 4)
  };

  /* ---------------- Validacao ---------------- */

  /* Cada regra devolve mensagem com causa + como corrigir. */
  const REGRAS = {
    email: {
      valido: (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v),
      erro: 'E-mail invalido. Inclua o @ e o dominio, por exemplo nome@email.com.'
    },
    cpf: {
      valido: (v) => digitos(v).length === 11,
      erro: 'CPF incompleto. Digite os 11 numeros.'
    },
    cep: {
      valido: (v) => digitos(v).length === 8,
      erro: 'CEP incompleto. Digite os 8 numeros, por exemplo 01310-100.'
    },
    telefone: {
      valido: (v) => digitos(v).length >= 10,
      erro: 'Telefone incompleto. Inclua o DDD, por exemplo (11) 91234-5678.'
    },
    cartao: {
      valido: (v) => digitos(v).length >= 13,
      erro: 'Numero do cartao incompleto. Confira os digitos impressos na frente.'
    },
    validade: {
      valido: (v) => {
        const d = digitos(v);
        if (d.length !== 4) return false;
        const mes = Number(d.slice(0, 2));
        return mes >= 1 && mes <= 12;
      },
      erro: 'Validade invalida. Use o formato MM/AA, por exemplo 09/28.'
    },
    cvv: {
      valido: (v) => digitos(v).length >= 3,
      erro: 'Codigo de seguranca incompleto. Sao 3 digitos no verso do cartao.'
    },
    nome: {
      valido: (v) => v.trim().split(/\s+/).length >= 2,
      erro: 'Informe nome e sobrenome, como aparece no documento.'
    }
  };

  const campoDe = (input) => input.closest('.campo');

  const validarCampo = (input) => {
    const campo = campoDe(input);
    if (!campo) return true;
    const valor = input.value.trim();
    const regra = input.dataset.regra ? REGRAS[input.dataset.regra] : null;
    let erro = '';

    if (input.required && !valor) {
      erro = `${input.dataset.nomeCampo || 'Este campo'} e obrigatorio.`;
    } else if (valor && regra && !regra.valido(valor)) {
      erro = regra.erro;
    }

    const alvoErro = campo.querySelector('.campo__erro');
    if (erro) {
      campo.dataset.invalido = 'true';
      input.setAttribute('aria-invalid', 'true');
      if (alvoErro) alvoErro.innerHTML = `${icone('alerta')}<span>${esc(erro)}</span>`;
    } else {
      campo.dataset.invalido = 'false';
      input.removeAttribute('aria-invalid');
    }
    return !erro;
  };

  /* Valida no blur (nunca a cada tecla) e limpa o erro enquanto corrige. */
  const ligarValidacao = (form) => {
    form.querySelectorAll('input, select, textarea').forEach((input) => {
      if (input.dataset.mascara && MASCARAS[input.dataset.mascara]) {
        input.addEventListener('input', () => {
          const pos = input.value.length;
          input.value = MASCARAS[input.dataset.mascara](input.value);
          if (pos !== input.value.length) input.setSelectionRange(input.value.length, input.value.length);
        });
      }
      input.addEventListener('blur', () => validarCampo(input));
      input.addEventListener('input', () => {
        const campo = campoDe(input);
        if (campo && campo.dataset.invalido === 'true') validarCampo(input);
      });
    });
  };

  /* Valida tudo, monta o resumo no topo e foca o primeiro campo invalido. */
  const validarFormulario = (form) => {
    const inputs = [...form.querySelectorAll('input, select, textarea')].filter(
      (i) => i.offsetParent !== null && i.type !== 'hidden'
    );
    const invalidos = inputs.filter((i) => !validarCampo(i));
    const resumo = form.querySelector('.resumo-erros');

    if (invalidos.length) {
      if (resumo) {
        resumo.dataset.visivel = 'true';
        resumo.innerHTML = `
          ${icone('alerta', { classe: 'i--lg' })}
          <div>
            <strong>Revise ${invalidos.length === 1 ? 'um campo' : `${invalidos.length} campos`} antes de continuar</strong>
            <ul>
              ${invalidos
                .map((i) => {
                  const campo = campoDe(i);
                  const msg = campo.querySelector('.campo__erro');
                  return `<li><a href="#${i.id}">${esc(msg ? msg.textContent.trim() : i.name)}</a></li>`;
                })
                .join('')}
            </ul>
          </div>`;
        resumo.querySelectorAll('a').forEach((a) =>
          a.addEventListener('click', (e) => {
            e.preventDefault();
            const alvo = document.querySelector(a.getAttribute('href'));
            if (alvo) alvo.focus();
          })
        );
      }
      invalidos[0].focus();
      return false;
    }

    if (resumo) resumo.dataset.visivel = 'false';
    return true;
  };

  const dadosDoFormulario = (form) => Object.fromEntries(new FormData(form).entries());

  return {
    estrelas, cardProduto, abrirCompraRapida, ligarGrades, ligarAcordeoes,
    ligarValidacao, validarCampo, validarFormulario, dadosDoFormulario, MASCARAS
  };
})();
