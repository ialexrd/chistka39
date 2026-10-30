// Химчистка Мебели Калининград — общий скрипт сайта
(function () {
  'use strict';

  // Мобильное меню
  var burger = document.querySelector('[data-burger]');
  var mobileNav = document.querySelector('[data-mobile-nav]');
  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('open');
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    // Закрывать меню при клике по ссылке
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Текущий год в футере
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Кнопка «Оставить заявку» на карточке вида — подставляем его в комментарий формы
  document.querySelectorAll('[data-order-item]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var comment = document.querySelector('#f-comment');
      if (comment) comment.value = btn.getAttribute('data-order-item') + '. ' + comment.value.replace(/^[^.]*\. /, '');
    });
  });

  // Обработка форм заявки — локально формируем сообщение для WhatsApp
  // (на сайте нет бэкенда; после подключения хостинга форму можно
  // переключить на отправку в CRM/почту/Telegram-бота).
  var WHATSAPP_NUMBER = '79000000000'; // TODO: заменить на реальный номер в формате 7XXXXXXXXXX

  function sendLead(lines, successBox) {
    var message = encodeURIComponent(lines.join('\n'));
    window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + message, '_blank', 'noopener');
    if (successBox) {
      successBox.classList.add('show');
      successBox.textContent = 'Спасибо! Заявка сформирована, мы свяжемся с вами в ближайшее время. Также можно позвонить нам напрямую.';
    }
  }

  function phoneOk(phone) {
    if (phone.value.replace(/\D/g, '').length < 10) {
      phone.focus();
      phone.setCustomValidity('Укажите корректный номер телефона');
      phone.reportValidity();
      return false;
    }
    phone.setCustomValidity('');
    return true;
  }

  document.querySelectorAll('[data-order-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.querySelector('[name="name"]');
      var phone = form.querySelector('[name="phone"]');
      var service = form.querySelector('[name="service"]');
      var comment = form.querySelector('[name="comment"]');

      if (phone && !phoneOk(phone)) return;

      var lines = ['Заявка с сайта himchistka-mebel-kaliningrad'];
      if (service && service.value) lines.push('Услуга: ' + service.value);
      if (name && name.value) lines.push('Имя: ' + name.value);
      if (phone && phone.value) lines.push('Телефон: ' + phone.value);
      if (comment && comment.value) lines.push('Комментарий: ' + comment.value);

      sendLead(lines, form.parentElement.querySelector('.form-success'));
      form.reset();
    });
  });


  // Калькулятор стоимости (квиз). Конфигурация с ценами приходит из data-quiz.
  document.querySelectorAll('[data-quiz]').forEach(function (root) {
    var cfg = JSON.parse(root.getAttribute('data-quiz'));
    var items = {};
    cfg.items.forEach(function (it) { items[it.id] = it; });
    var st = { item: null, option: null, qty: 4, area: 15, leather: false, stains: false, odor: false };
    var step = 0;

    function rub(n) { return n.toLocaleString('ru-RU') + ' ₽'; }
    function steps() {
      var it = items[st.item];
      var list = ['item'];
      if (!it) return list;
      if (it.kind !== 'fixed') list.push('detail');
      if (it.kind !== 'area') list.push('material');
      list.push('dirt', 'result');
      return list;
    }
    function price() {
      var it = items[st.item], p = 0;
      if (it.kind === 'options') p = it.options[st.option][1];
      if (it.kind === 'fixed') p = it.price;
      if (it.kind === 'qty') {
        p = (st.leather ? it.leather_unit : it.unit) * st.qty;
        if (st.qty >= 12) p *= 0.85; else if (st.qty >= 6) p *= 0.9;
      }
      if (it.kind === 'area') p = Math.max(it.unit * st.area, it.min);
      if (st.leather && it.kind !== 'qty') p *= 1.5;
      if (st.stains) p = it.kind === 'area' ? p * 1.2 : p + 300;
      if (st.odor) p += 500;
      return Math.round(p / 10) * 10;
    }
    function summary() {
      var it = items[st.item], parts = [it.kind === 'options' ? it.label + ': ' + it.options[st.option][0].toLowerCase() : it.label];
      if (it.kind === 'qty') parts.push(st.qty + ' шт');
      if (it.kind === 'area') parts.push(st.area + ' м²');
      if (it.kind !== 'area') parts.push(st.leather ? 'кожа / экокожа' : 'ткань');
      if (st.stains) parts.push('пятна');
      if (st.odor) parts.push('запах');
      return parts.join(', ');
    }
    function choice(label, sub, active, attrs, iconSvg) {
      return '<button type="button" class="quiz-opt' + (active ? ' active' : '') + '" ' + attrs + '>' +
        (iconSvg ? '<span class="quiz-opt-icon">' + iconSvg + '</span>' : '') +
        '<span class="quiz-opt-label">' + label + '</span>' + (sub ? '<span class="quiz-opt-sub">' + sub + '</span>' : '') + '</button>';
    }
    function render() {
      var list = steps(), name = list[step], it = items[st.item], html = '';
      var total = name === 'item' ? 4 : list.length - 1;
      var shown = Math.min(step + 1, total);
      html += '<div class="quiz-progress"><div class="quiz-progress-bar" style="width:' + (name === 'result' ? 100 : (step / total) * 100) + '%"></div></div>';
      html += '<div class="quiz-step-num">' + (name === 'result' ? 'Готово!' : 'Шаг ' + shown + ' из ' + total) + '</div>';
      if (name === 'item') {
        html += '<h3>Что нужно почистить?</h3><div class="quiz-opts">';
        cfg.items.forEach(function (x) { html += choice(x.label, '', st.item === x.id, 'data-item="' + x.id + '"', x.icon_svg); });
        html += '</div>';
      } else if (name === 'detail') {
        html += '<h3>' + it.question + '</h3>';
        if (it.kind === 'options') {
          html += '<div class="quiz-opts quiz-opts-list">';
          it.options.forEach(function (o, i) { html += choice(o[0], 'от ' + rub(o[1]), st.option === i, 'data-option="' + i + '"'); });
          html += '</div>';
        } else {
          var isQty = it.kind === 'qty';
          html += '<div class="quiz-number"><button type="button" class="quiz-step-btn" data-delta="-1">−</button>' +
            '<input type="number" min="1" max="' + (isQty ? 100 : 1000) + '" value="' + (isQty ? st.qty : st.area) + '" data-num>' +
            '<button type="button" class="quiz-step-btn" data-delta="1">+</button><span>' + (isQty ? 'шт' : 'м²') + '</span></div>';
          html += '<p class="quiz-hint">' + (isQty ? 'От 6 стульев скидка 10%, от 12 стульев 15%.' : 'Минимальный заказ ' + rub(it.min) + '.') + '</p>';
          html += '<div class="quiz-nav"><button type="button" class="btn btn-ghost" data-back>Назад</button><button type="button" class="btn btn-primary" data-next>Далее</button></div>';
        }
      } else if (name === 'material') {
        html += '<h3>Из чего обивка?</h3><div class="quiz-opts quiz-opts-list">' +
          choice('Ткань', 'велюр, рогожка, флок и другие', !st.leather && st._mat, 'data-leather="0"') +
          choice('Кожа или экокожа', it.kind === 'qty' ? 'от ' + rub(it.leather_unit) + ' за стул' : '+50% к стоимости', st.leather, 'data-leather="1"') + '</div>';
      } else if (name === 'dirt') {
        html += '<h3>Что нужно убрать?</h3><p class="quiz-hint">Можно выбрать несколько вариантов.</p><div class="quiz-opts quiz-opts-list">' +
          choice('Пятна', it.kind === 'area' ? '+20% к стоимости' : '+300 ₽', st.stains, 'data-toggle="stains"') +
          choice('Запах: моча, животные, пот', '+500 ₽', st.odor, 'data-toggle="odor"') + '</div>' +
          '<div class="quiz-nav"><button type="button" class="btn btn-ghost" data-back>Назад</button><button type="button" class="btn btn-primary" data-next>' + (st.stains || st.odor ? 'Рассчитать' : 'Только общая чистка') + '</button></div>';
      } else {
        var p = price(), d = Math.round(p * 0.9 / 10) * 10;
        html += '<h3>Предварительная стоимость</h3><div class="quiz-summary">' + summary() + '</div>' +
          '<div class="quiz-price"><span class="quiz-price-old">от ' + rub(p) + '</span><span class="quiz-price-new">от ' + rub(d) + '</span></div>' +
          '<p class="quiz-hint">Цена со скидкой 10% на первый заказ. Финальную стоимость мастер подтвердит на месте.</p>' +
          '<form class="quiz-form" data-quiz-form><div class="form-row">' +
          '<div class="field"><label>Имя</label><input name="name" type="text" placeholder="Как к вам обращаться" required></div>' +
          '<div class="field"><label>Телефон</label><input name="phone" type="tel" placeholder="+7 (___) ___-__-__" required></div></div>' +
          '<button type="submit" class="btn btn-primary btn-block">Получить скидку и записаться</button>' +
          '<p class="form-note">Нажимая кнопку, вы соглашаетесь с <a href="politika-konfidencialnosti.html">политикой обработки персональных данных</a>.</p>' +
          '<div class="form-success"></div></form>' +
          '<button type="button" class="quiz-restart" data-restart>Пересчитать</button>';
      }
      if (name !== 'item' && name !== 'result' && html.indexOf('data-back') < 0) {
        html += '<div class="quiz-nav"><button type="button" class="btn btn-ghost" data-back>Назад</button></div>';
      }
      root.innerHTML = html;
      bindTel(root);
    }
    function next() { step = Math.min(step + 1, steps().length - 1); render(); }

    root.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-item')) {
        if (st.item !== b.getAttribute('data-item')) { st.option = null; }
        st.item = b.getAttribute('data-item'); next();
      } else if (b.hasAttribute('data-option')) { st.option = +b.getAttribute('data-option'); next(); }
      else if (b.hasAttribute('data-leather')) { st.leather = b.getAttribute('data-leather') === '1'; st._mat = true; next(); }
      else if (b.hasAttribute('data-toggle')) { var k = b.getAttribute('data-toggle'); st[k] = !st[k]; render(); }
      else if (b.hasAttribute('data-delta')) {
        var inp = root.querySelector('[data-num]');
        inp.value = Math.max(1, (+inp.value || 0) + (+b.getAttribute('data-delta'))); readNum();
      }
      else if (b.hasAttribute('data-next')) { readNum(); next(); }
      else if (b.hasAttribute('data-back')) { step = Math.max(0, step - 1); render(); }
      else if (b.hasAttribute('data-restart')) { st = { item: null, option: null, qty: 4, area: 15, leather: false, stains: false, odor: false }; step = 0; render(); }
    });
    function readNum() {
      var inp = root.querySelector('[data-num]');
      if (!inp) return;
      var v = Math.max(1, Math.round(+inp.value || 1));
      if (items[st.item].kind === 'qty') st.qty = v; else st.area = v;
    }
    root.addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target, phone = form.querySelector('[name="phone"]');
      if (!phoneOk(phone)) return;
      var p = price();
      sendLead([
        'Заявка из калькулятора на сайте',
        'Что чистим: ' + summary(),
        'Предварительно: от ' + rub(p) + ', со скидкой 10%: от ' + rub(Math.round(p * 0.9 / 10) * 10),
        'Имя: ' + form.querySelector('[name="name"]').value,
        'Телефон: ' + phone.value
      ], form.querySelector('.form-success'));
    });

    if (cfg.preselect && items[cfg.preselect]) { st.item = cfg.preselect; step = 1; }
    render();
  });

  // Форматирование телефона по мере ввода: +7 (___) ___-__-__
  function bindTel(scope) {
  scope.querySelectorAll('input[type="tel"]:not([data-tel-bound])').forEach(function (input) {
    input.setAttribute('data-tel-bound', '');
    input.addEventListener('input', function () {
      var digits = input.value.replace(/\D/g, '').replace(/^7/, '').replace(/^8/, '');
      digits = digits.substring(0, 10);
      var out = '+7';
      if (digits.length > 0) out += ' (' + digits.substring(0, 3);
      if (digits.length >= 3) out += ') ' + digits.substring(3, 6);
      if (digits.length >= 6) out += '-' + digits.substring(6, 8);
      if (digits.length >= 8) out += '-' + digits.substring(8, 10);
      input.value = out;
    });
  });
  }
  bindTel(document);

  // Клики по кнопкам звонка/WhatsApp — место для вставки аналитики (метрика/GA)
  document.querySelectorAll('[data-track-call]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (window.ym) { /* window.ym(COUNTER_ID, 'reachGoal', 'CALL_CLICK'); */ }
    });
  });

  // Закрывать открытые FAQ-аккордеоны при открытии нового в той же группе (по желанию можно убрать)
  document.querySelectorAll('.faq-list').forEach(function (list) {
    var items = list.querySelectorAll('details.faq-item');
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (item.open) {
          items.forEach(function (other) {
            if (other !== item) other.open = false;
          });
        }
      });
    });
  });
})();
