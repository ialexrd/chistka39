# Чистка 39 — сайт выездной химчистки мебели (Калининград и область)

Карта проекта. Перед любой работой прочитай этот файл и файлы из docs/.

## Что за сайт
- Домен: https://chistka-39.ru (GitHub Pages переадресует туда же).
- Статический сайт, собирается одним скриптом `generate.py` в папку `site/`.
- Адреса без `.html` (301 со старых адресов в `site/.htaccess`), canonical без `.html`.

## Где что лежит
- `generate.py` — все данные и шаблоны: `SITE` (контакты), `SERVICES` (услуги, цены, FAQ),
  `GEO_PAGES` (города области), `ARTICLES` (статьи), `REVIEWS`, рендеры страниц, sitemap, robots.
- `site/assets/css/styles.css` — стили (правится руками, не генерируется).
- `site/assets/js/script.js` — формы, квиз, окно cookie.
- `content/politika.txt` — текст политики конфиденциальности.
- `seo/semantic-map.json` — очередь тем и закрепление запросов за страницами (единый источник правды).
- `lastmod.json` — даты реальных изменений страниц для sitemap; генерируется, коммитить вместе с site/.
- `tools/indexnow.py` — пинг Яндекса и Bing об изменённых страницах (запускает GitHub Actions).
- `docs/` — правила: эталон статьи, стоп-лист, стиль текста, журнал решений.
- `direct/` — Яндекс.Директ: `build_direct.py` собирает `yandex-direct-chistka39.xlsx` (кампании, ключи, минус-слова, объявления, цели, бюджет) и картинки для РСЯ. SEO закончено, текущий фокус — Директ.

## Как собрать и выложить
1. `python3 generate.py` — пересобирает все страницы, sitemap.xml, robots.txt.
2. Коммит `generate.py`, `site/`, `lastmod.json` в main.
3. GitHub Actions: `deploy-ftp.yml` выкладывает `site/` на хостинг SpaceWeb по FTP и шлёт IndexNow;
   `pages.yml` обновляет GitHub Pages (там только переадресация на домен).

## Правила работы
- Перед правкой текстов и статей: `docs/stop-list.md`, `docs/stil-teksta.md`, `docs/etalon-stati.md`.
- Новая статья: сначала тема в `seo/semantic-map.json` (status planned → published), потом текст.
  Ключи чужих страниц не таргетировать, только упомянуть и поставить ссылку.
- Каждое заметное решение — строка в `docs/changelog.md`.
- Частотность брать из Wordstat API (ключ в переменной окружения `YANDEX_WORDSTAT_API_KEY`,
  регион 10857 — Калининградская область), а не придумывать.
