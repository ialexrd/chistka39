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

  // Обработка форм заявки — локально формируем сообщение для WhatsApp
  // (на сайте нет бэкенда; после подключения хостинга форму можно
  // переключить на отправку в CRM/почту/Telegram-бота).
  var WHATSAPP_NUMBER = '79000000000'; // TODO: заменить на реальный номер в формате 7XXXXXXXXXX

  document.querySelectorAll('[data-order-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.querySelector('[name="name"]');
      var phone = form.querySelector('[name="phone"]');
      var service = form.querySelector('[name="service"]');
      var comment = form.querySelector('[name="comment"]');

      if (phone && phone.value.replace(/\D/g, '').length < 10) {
        phone.focus();
        phone.setCustomValidity('Укажите корректный номер телефона');
        phone.reportValidity();
        return;
      }
      if (phone) phone.setCustomValidity('');

      var lines = ['Заявка с сайта himchistka-mebel-kaliningrad'];
      if (service && service.value) lines.push('Услуга: ' + service.value);
      if (name && name.value) lines.push('Имя: ' + name.value);
      if (phone && phone.value) lines.push('Телефон: ' + phone.value);
      if (comment && comment.value) lines.push('Комментарий: ' + comment.value);

      var message = encodeURIComponent(lines.join('\n'));
      var successBox = form.parentElement.querySelector('.form-success');

      // Пытаемся открыть WhatsApp с готовым сообщением
      var waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + message;
      window.open(waUrl, '_blank', 'noopener');

      if (successBox) {
        successBox.classList.add('show');
        successBox.textContent = 'Заявка сформирована — подтвердите отправку в открывшемся окне WhatsApp. Также можно позвонить нам напрямую.';
      }
      form.reset();
    });
  });

  // Форматирование телефона по мере ввода: +7 (___) ___-__-__
  document.querySelectorAll('input[type="tel"]').forEach(function (input) {
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
