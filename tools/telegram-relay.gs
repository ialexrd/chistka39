// Пересылка заявок с сайта в Telegram через Google Apps Script.
// Нужна потому, что с хостинга SpaceWeb (РФ) api.telegram.org недоступен.
// Как поставить: script.google.com → «Новый проект» → вставить этот код →
// «Начать развёртывание» → «Новое развёртывание» → тип «Веб-приложение»,
// «Запуск от имени: я», «У кого есть доступ: все» → «Развернуть», разрешить доступ.
// Скопировать адрес веб-приложения (…/exec) в секрет GitHub TG_RELAY_URL.
function doPost(e) {
  var p = e.parameter || {};
  if (!/^\d+:[\w-]{30,}$/.test(p.token || '') || !p.chat_id || !p.text) {
    return out({ ok: false, description: 'bad request' });
  }
  var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + p.token + '/sendMessage', {
    method: 'post',
    payload: { chat_id: p.chat_id, text: String(p.text).slice(0, 4000), disable_web_page_preview: 'true' },
    muteHttpExceptions: true
  });
  return ContentService.createTextOutput(r.getContentText()).setMimeType(ContentService.MimeType.JSON);
}
function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
