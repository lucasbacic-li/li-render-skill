/**
 * material-icons.js — swap global de ícones de UI para Material Symbols Sharp.
 *
 * O litheme chama ícones via sprite fontawesome: <svg><use href=".../fontawesome-solid.svg#nome"></use></svg>.
 * Este script troca cada um por <span class="material-symbols-sharp">nome_material</span>,
 * herdando o tamanho do svg (clientWidth / classe size-N / atributo width) e a cor
 * (currentColor). MANTÉM os logos de marca (fontawesome-brands: social/cartões) e o
 * spinner (sem mapeamento). Roda no load e em todo swap HTMX (minicart, sheets…).
 */
(function () {
  if (window.__oraMaterialIcons) return;
  window.__oraMaterialIcons = true;

  // fontawesome-solid → Material Symbols (nomes por ligatura)
  var MAP = {
    xmark: 'close',
    plus: 'add',
    minus: 'remove',
    'magnifying-glass': 'search',
    'chevron-right': 'chevron_right',
    'chevron-left': 'chevron_left',
    'arrow-right': 'arrow_forward',
    'arrow-left': 'arrow_back',
    'caret-down': 'arrow_drop_down',
    user: 'person',
    heart: 'favorite',
    comments: 'chat_bubble',
    'circle-question': 'help',
    'circle-check': 'check_circle',
    'circle-info': 'info',
    check: 'check',
    envelope: 'mail',
    'location-dot': 'location_on',
    truck: 'local_shipping',
    'credit-card': 'credit_card',
    wallet: 'account_balance_wallet'
    // 'spinner' propositalmente fora → mantém o sprite animado
  };

  function sizeOf(svg) {
    var w = svg.clientWidth;
    if (w) return w;
    var cls = svg.getAttribute('class') || '';
    var m = cls.match(/size-(\d+(?:\.\d+)?)/);
    if (m) return parseFloat(m[1]) * 4;
    var attr = parseFloat(svg.getAttribute('width'));
    if (attr) return attr;
    return 24;
  }

  function swap(root) {
    if (!root || !root.querySelectorAll) return;
    var uses = root.querySelectorAll('use');
    for (var i = 0; i < uses.length; i++) {
      var use = uses[i];
      var href = use.getAttribute('href') || use.getAttribute('xlink:href') || '';
      if (href.indexOf('fontawesome-solid') === -1) continue; // brands + outros: mantém
      var name = href.split('#')[1];
      var mat = MAP[name];
      if (!mat) continue; // sem mapeamento (ex.: spinner): mantém
      var svg = use.closest('svg');
      if (!svg || svg.getAttribute('data-mat')) continue;
      var span = document.createElement('span');
      span.className = 'material-symbols-sharp';
      span.textContent = mat;
      // tamanho vem do default da classe (.material-symbols-sharp: 40px, escala
      // da marca/ref. Paper). Contextos que precisam de outro tamanho setam
      // font-size próprio (ex.: qty +/- no minicart-item).
      span.setAttribute('aria-hidden', 'true');
      span.setAttribute('data-mat', '1');
      svg.replaceWith(span);
    }
  }

  function run() { swap(document.body); }

  if (document.readyState !== 'loading') run();
  else document.addEventListener('DOMContentLoaded', run);

  // conteúdo carregado via HTMX (minicart, sheets, autocomplete…)
  document.addEventListener('htmx:load', function (e) { swap(e.target); });
  document.addEventListener('htmx:afterSettle', function (e) { swap(e.target || document.body); });
})();
