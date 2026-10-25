/* =========================================================
   Icones vetoriais - familia unica (traco 1.6, grade 24)
   Nada de emoji na interface: tudo SVG, herda currentColor.
   ========================================================= */

const ICONES = {
  busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  sacola: '<path d="M6 2 3 6.5V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.5L18 2Z"/><path d="M3 6.5h18"/><path d="M16 10.5a4 4 0 0 1-8 0"/>',
  coracao: '<path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4l1.1 1.1L12 21.8l7.7-7.7 1.1-1.1a5.2 5.2 0 0 0 0-7.4Z"/>',
  usuario: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
  fechar: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  seta_direita: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  seta_esquerda: '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
  chevron_direita: '<path d="m9 6 6 6-6 6"/>',
  chevron_baixo: '<path d="m6 9 6 6 6-6"/>',
  mais: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  menos: '<path d="M5 12h14"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  check_circulo: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  alerta: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4.5"/><path d="M12 16h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
  caminhao: '<path d="M3 16V6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10"/><path d="M15 9h3.6a1 1 0 0 1 .8.4l2.4 3.2a1 1 0 0 1 .2.6V16"/><path d="M3 16h1.5"/><path d="M10.5 16h4"/><path d="M20.5 16H22"/><circle cx="7" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/>',
  troca: '<path d="M3 11a9 9 0 0 1 15-6.7L21 7"/><path d="M21 4v3.5h-3.5"/><path d="M21 13a9 9 0 0 1-15 6.7L3 17"/><path d="M3 20v-3.5h3.5"/>',
  escudo: '<path d="M12 2.8 4.5 6v6c0 4.4 3.1 8.4 7.5 9.4 4.4-1 7.5-5 7.5-9.4V6Z"/><path d="m9 12 2 2 4-4"/>',
  cartao: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/><path d="M6.5 15h3"/>',
  pix: '<path d="m12 2.8 3.4 3.4a3 3 0 0 0 2.1.9h1.2l1.6 1.6a3 3 0 0 1 0 4.2l-1.6 1.6h-1.2a3 3 0 0 0-2.1.9L12 18.8"/><path d="m12 2.8-3.4 3.4a3 3 0 0 1-2.1.9H5.3L3.7 8.7a3 3 0 0 0 0 4.2l1.6 1.6h1.2a3 3 0 0 1 2.1.9L12 18.8"/>',
  codigo_barras: '<path d="M4 6v12"/><path d="M7.5 6v12"/><path d="M11 6v12"/><path d="M14.5 6v12"/><path d="M17 6v12"/><path d="M20 6v12"/>',
  regua: '<path d="m3.5 14.5 7-7a1.5 1.5 0 0 1 2.1 0l3.9 3.9a1.5 1.5 0 0 1 0 2.1l-7 7a1.5 1.5 0 0 1-2.1 0l-3.9-3.9a1.5 1.5 0 0 1 0-2.1Z"/><path d="m8 10 1.5 1.5"/><path d="m10.5 7.5 1.5 1.5"/><path d="M5.5 12.5 7 14"/><path d="m13 5 6 6"/>',
  filtro: '<path d="M4 6h16"/><path d="M7 12h10"/><path d="M10 18h4"/>',
  etiqueta: '<path d="M20.6 12.4 12.4 20.6a2 2 0 0 1-2.8 0l-6.2-6.2a2 2 0 0 1-.6-1.6l.4-5.2a2 2 0 0 1 1.8-1.8l5.2-.4a2 2 0 0 1 1.6.6l6.2 6.2a2 2 0 0 1 .6 1.6Z"/><path d="M8.5 8.5h.01"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5V4"/><path d="M12 20v1.5"/><path d="M4.2 4.2 5.3 5.3"/><path d="m18.7 18.7 1.1 1.1"/><path d="M2.5 12H4"/><path d="M20 12h1.5"/><path d="m4.2 19.8 1.1-1.1"/><path d="m18.7 5.3 1.1-1.1"/>',
  lua: '<path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.2 8.2 0 1 0 20 14.2Z"/>',
  pacote: '<path d="M20.5 8.5v7a1.5 1.5 0 0 1-.8 1.3l-6.9 3.8a1.5 1.5 0 0 1-1.6 0l-6.9-3.8a1.5 1.5 0 0 1-.8-1.3v-7"/><path d="m3.9 7.6 7.3-4a1.5 1.5 0 0 1 1.6 0l7.3 4a1 1 0 0 1 0 1.8l-7.3 4a1.5 1.5 0 0 1-1.6 0l-7.3-4a1 1 0 0 1 0-1.8Z"/>',
  cabide: '<path d="M12 8.5a2.6 2.6 0 1 1 2.6-2.6"/><path d="M12 8.5v2.2L3.9 16a1.6 1.6 0 0 0 .9 3h14.4a1.6 1.6 0 0 0 .9-3L12 10.7"/>',
  tesoura: '<circle cx="6" cy="6.5" r="2.5"/><circle cx="6" cy="17.5" r="2.5"/><path d="M8.1 8.1 20 19"/><path d="M20 5 8.1 15.9"/>',
  folha: '<path d="M4.5 19.5c-1.5-6 2-13 15-14.5 1 8-3 15.5-11 15.5-1.7 0-3-.4-4-1Z"/><path d="M4.5 19.5C7 15 10.5 12 15 10"/>',
  local: '<path d="M12 21.5s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10.5" r="2.5"/>',
  telefone: '<path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z"/>',
  email: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3.5 7 7.6 5.3a1.5 1.5 0 0 0 1.8 0L20.5 7"/>',
  cadeado: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
  presente: '<path d="M4 11.5h16V20a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20Z"/><rect x="2.5" y="7.5" width="19" height="4" rx="1"/><path d="M12 7.5v14"/><path d="M12 7.5S10.5 3 8 3a2.2 2.2 0 0 0 0 4.5Z"/><path d="M12 7.5S13.5 3 16 3a2.2 2.2 0 0 1 0 4.5Z"/>',
  estrela: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 17l-5.3 2.7 1.1-5.9-4.3-4.1 5.9-.8Z"/>',
  carrinho_vazio: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2.5 3.5h2.2l2.4 11.3a1.5 1.5 0 0 0 1.5 1.2h9.1a1.5 1.5 0 0 0 1.5-1.2L21 7.5H6"/>'
};

/**
 * Retorna o markup de um icone.
 * @param {string} nome chave em ICONES
 * @param {{classe?: string, rotulo?: string}} opcoes rotulo => icone informativo (nao decorativo)
 */
function icone(nome, opcoes = {}) {
  const conteudo = ICONES[nome];
  if (!conteudo) return '';
  const classe = opcoes.classe ? `i ${opcoes.classe}` : 'i';
  const a11y = opcoes.rotulo
    ? `role="img" aria-label="${opcoes.rotulo}"`
    : 'aria-hidden="true" focusable="false"';
  return `<svg class="${classe}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-linecap="round" stroke-linejoin="round" ${a11y}>${conteudo}</svg>`;
}
