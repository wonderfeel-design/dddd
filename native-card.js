/* ══ Режим ?native=1: родная карточка Тильды + наши правки ══
   Сниппет T-Store показывает данные товара как есть, поэтому:
   «Цена за кв метр» (вариант-число) → текст рядом с ценой; «Тип покрытия»
   (опция) дублирует «Покрытие» (вариант) → прячем и синхронизируем;
   «BUY NOW» → «Купить»; для досок — погонные метры рядом с количеством;
   строка доверия. Сниппет Тильда строит скриптом — ждём его появления. */
(function () {
  if (!window.nxNative || location.pathname.indexOf('/tproduct/') === -1) return;
  function q(s, r) { return (r || document).querySelector(s); }
  function byName(info, nameSel, title) {
    var names = info.querySelectorAll(nameSel);
    for (var i = 0; i < names.length; i++) {
      if (names[i].textContent.trim() === title) return names[i].closest('.t-product__option');
    }
    return null;
  }
  function fire(el) {
    ['input', 'change'].forEach(function (t) { el.dispatchEvent(new Event(t, { bubbles: true })); });
  }

  function init(info) {
    var sqmOpt = byName(info, '.js-product-edition-option-name', 'Цена за кв метр');
    var sqmSel = sqmOpt && q('select', sqmOpt);
    if (sqmOpt) sqmOpt.style.display = 'none';
    var priceWrap = q('.js-catalog-price-wrapper', info);
    var sqmEl = document.createElement('div');
    sqmEl.style.cssText = 'width:100%;font-size:15px;color:#555;margin-top:4px';
    if (priceWrap) priceWrap.appendChild(sqmEl);
    function showSqm() {
      var v = sqmSel ? parseFloat(sqmSel.value) : 0;
      var t = v > 0 ? 'Цена за кв.м.: ' + v.toLocaleString('ru-RU') + ' ₽' : '';
      if (sqmEl.textContent !== t) sqmEl.textContent = t;
    }

    var coatOpt = byName(info, '.js-product-edition-option-name', 'Покрытие');
    var coatSel = coatOpt && q('select', coatOpt);
    var typeOpt = byName(info, '.js-product-option-name', 'Тип покрытия');
    var typeSel = typeOpt && q('select', typeOpt);
    if (typeOpt && coatSel) typeOpt.style.display = 'none';
    function syncType() {
      if (!typeSel || !coatSel || typeSel.value === coatSel.value) return;
      if ([].some.call(typeSel.options, function (o) { return o.value === coatSel.value; })) {
        typeSel.value = coatSel.value;
        fire(typeSel);
      }
    }

    var btnTxt = q('.js-catalog-prod-popup-buy-btn-txt', info);
    if (btnTxt && /buy now/i.test(btnTxt.textContent)) btnTxt.textContent = 'Купить';

    /* Погонные метры: длина доски из «ДxШxВ: 6000x96x13 мм» или из названия */
    var dims = (q('.js-catalog-prod-dimensions', info) || {}).textContent || '';
    var name = (q('.js-product-name', info) || {}).textContent || '';
    var m = dims.match(/(\d+)\s*x/) || name.match(/\d+[хx×]\d+[хx×](\d+)/i);
    var len = m ? parseFloat(m[1]) / 1000 : 0;
    var qtyInp = q('.t-catalog__prod__quantity-input', info);
    if (len >= 1 && qtyInp) {
      var box = document.createElement('div');
      box.style.cssText = 'display:flex;align-items:center;gap:8px;margin:8px 0;font-size:14px;color:#555';
      box.innerHTML = 'Погонные метры: <input type="number" min="' + len + '" step="' + len +
        '" style="width:90px;font-size:16px;padding:6px 8px;border:1px solid #ccc;border-radius:6px">';
      var mInp = q('input', box);
      var qtyBox = qtyInp.closest('.t-catalog__prod__quantity') || qtyInp;
      qtyBox.parentNode.parentNode.insertBefore(box, qtyBox.parentNode);
      var fromQty = function () { mInp.value = Math.round((parseInt(qtyInp.value, 10) || 1) * len * 100) / 100; };
      mInp.addEventListener('change', function () {
        var n = Math.max(1, Math.round((parseFloat(mInp.value) || len) / len));
        qtyInp.value = n; fire(qtyInp); fromQty();
      });
      qtyInp.addEventListener('input', fromQty);
      qtyInp.addEventListener('change', fromQty);
      qtyBox.addEventListener('click', function () { setTimeout(fromQty, 50); });
      fromQty();
    }

    var trust = document.createElement('div');
    trust.className = 'nx-p-trust-row';
    trust.textContent = 'Самара и Тольятти, доставка от 1 дня';
    var btnWrap = q('.t-catalog__prod-popup__btn-wrapper', info);
    if (btnWrap) btnWrap.parentNode.insertBefore(trust, btnWrap.nextSibling);

    info.addEventListener('change', function () { setTimeout(function () { syncType(); showSqm(); }, 0); });
    info.addEventListener('click', function (e) {
      if (e.target.closest('.t-product__option-item')) setTimeout(function () { syncType(); showSqm(); }, 50);
      if (e.target.closest('a[href="#order"]')) {
        try { nxTrack('click_order', { item_name: name, button_position: 'native', page_type: 'product' }); } catch (x) {}
      }
    });
    syncType(); showSqm();
    try {
      var price = (q('.js-product-price', info) || {}).textContent || '';
      var lid = (info.closest('.js-product') || { getAttribute: function () { return ''; } }).getAttribute('data-product-lid');
      nxTrack('view_item', { items: [{ item_id: lid || '', item_name: name, price: parseFloat(price.replace(/\s/g, '')) || 0 }] });
    } catch (x) {}
  }

  var tries = 0;
  var iv = setInterval(function () {
    var info = q('.t-catalog__prod-popup__info');
    if (info && q('.js-product-name', info)) { clearInterval(iv); init(info); }
    else if (++tries > 60) clearInterval(iv);
  }, 200);
})();
