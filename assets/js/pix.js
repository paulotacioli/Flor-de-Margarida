/* =========================================================
   Pix estatico: gera o BR Code (padrao EMV do Banco Central)
   com a chave da loja, o valor e o codigo do pedido, e desenha
   o QR Code + "copia e cola". Nao depende de servidor nem de
   provedor: a confirmacao do pagamento e feita pela loja.

   Configuracao em dados.js (PIX): chave, nome e cidade.
   ========================================================= */

const Pix = (() => {
  /* Campo EMV: ID (2 digitos) + tamanho (2 digitos) + valor */
  const campo = (id, valor) => {
    const v = String(valor);
    return id + String(v.length).padStart(2, '0') + v;
  };

  /* Remove acentos e tudo que nao e letra/numero/espaco:
     o BR Code so aceita o conjunto basico de caracteres. */
  const limpar = (texto, max) =>
    String(texto || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()
      .slice(0, max);

  /* CRC16-CCITT (polinomio 0x1021, inicial 0xFFFF), exigido no campo 63 */
  const crc16 = (texto) => {
    let crc = 0xffff;
    for (let i = 0; i < texto.length; i++) {
      crc ^= texto.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  };

  /**
   * Monta o payload do Pix estatico.
   * @param {{chave:string, nome:string, cidade:string, valor?:number, txid?:string, descricao?:string}} o
   */
  const payload = (o) => {
    const txid = (o.txid ? String(o.txid).replace(/[^A-Za-z0-9]/g, '') : '').slice(0, 25) || '***';
    const conta =
      campo('00', 'br.gov.bcb.pix') +
      campo('01', String(o.chave).trim()) +
      (o.descricao ? campo('02', limpar(o.descricao, 40)) : '');

    let p =
      campo('00', '01') +
      campo('26', conta) +
      campo('52', '0000') +
      campo('53', '986') +
      (o.valor ? campo('54', Number(o.valor).toFixed(2)) : '') +
      campo('58', 'BR') +
      campo('59', limpar(o.nome, 25)) +
      campo('60', limpar(o.cidade, 15)) +
      campo('62', campo('05', txid)) +
      '6304';
    return p + crc16(p);
  };

  const configurado = () => typeof PIX !== 'undefined' && PIX && String(PIX.chave || '').trim() !== '';

  /* SVG do QR Code (biblioteca qrcode-generator, em assets/js/vendor) */
  const svgQr = (texto) => {
    if (typeof qrcode !== 'function') return '';
    const qr = qrcode(0, 'M');
    qr.addData(texto);
    qr.make();
    const n = qr.getModuleCount();
    let caminhos = '';
    for (let l = 0; l < n; l++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(l, c)) caminhos += `M${c} ${l}h1v1h-1z`;
      }
    }
    return `<svg class="pix__qr" viewBox="0 0 ${n} ${n}" role="img"
      aria-label="QR Code do Pix" shape-rendering="crispEdges">
      <rect width="${n}" height="${n}" fill="#fff"/>
      <path d="${caminhos}" fill="#000"/>
    </svg>`;
  };

  /**
   * Desenha o bloco de pagamento dentro de `container`.
   * @param {HTMLElement} container
   * @param {{valor:number, txid:string, descricao?:string}} pedido
   */
  const renderizar = (container, pedido) => {
    if (!container) return null;
    const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (!configurado()) {
      container.innerHTML = `
        <div class="pix pix--aviso">
          ${icone('alerta', { classe: 'i--lg' })}
          <div>
            <strong>Pix ainda não configurado</strong>
            <p class="apoio" style="margin:4px 0 0">
              A chave Pix da loja precisa ser informada em <code>assets/js/dados.js</code> (objeto PIX).
              Enquanto isso, combine o pagamento pelo WhatsApp da loja.
            </p>
          </div>
        </div>`;
      return null;
    }

    const codigo = payload({
      chave: PIX.chave,
      nome: PIX.nome,
      cidade: PIX.cidade,
      valor: pedido.valor,
      txid: pedido.txid,
      descricao: pedido.descricao
    });

    container.innerHTML = `
      <div class="pix">
        <div class="pix__topo">
          <span class="escolha__icone">${icone('pix')}</span>
          <div>
            <strong>Pague ${fmt(pedido.valor)} via Pix</strong>
            <p class="apoio" style="margin:2px 0 0">
              Abra o app do seu banco, escolha <strong>Pix &rsaquo; Ler QR Code</strong> ou
              <strong>Pix copia e cola</strong>. O pedido é separado assim que o pagamento cair.
            </p>
          </div>
        </div>

        <div class="pix__corpo">
          <div class="pix__quadro">${svgQr(codigo)}</div>
          <div class="pix__dados">
            <label class="campo__rotulo" for="pix-codigo">Pix copia e cola</label>
            <textarea class="pix__codigo" id="pix-codigo" readonly rows="4" spellcheck="false">${codigo}</textarea>
            <button class="btn btn--primario btn--bloco" type="button" data-copiar-pix>
              ${icone('check')} Copiar código Pix
            </button>
            <dl class="pix__meta">
              <div><dt>Favorecido</dt><dd>${PIX.nome}</dd></div>
              <div><dt>Identificador</dt><dd class="numero">${pedido.txid}</dd></div>
              <div><dt>Valor</dt><dd class="numero">${fmt(pedido.valor)}</dd></div>
            </dl>
          </div>
        </div>

        <p class="apoio pix__rodape">
          ${icone('relogio')}
          <span>Reservamos suas peças por 30 minutos. Pagou? Envie o comprovante
          pelo WhatsApp com o código do pedido <strong class="numero">${pedido.txid}</strong>.</span>
        </p>
      </div>`;

    const botao = container.querySelector('[data-copiar-pix]');
    const area = container.querySelector('.pix__codigo');
    botao.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codigo);
      } catch {
        area.focus();
        area.select();
        document.execCommand('copy');
      }
      botao.innerHTML = `${icone('check_circulo')} Código copiado`;
      if (typeof Loja !== 'undefined') Loja.toast('Código Pix copiado. Cole no app do seu banco.');
      setTimeout(() => (botao.innerHTML = `${icone('check')} Copiar código Pix`), 3000);
    });
    area.addEventListener('focus', () => area.select());

    return codigo;
  };

  return { payload, crc16, renderizar, configurado };
})();
