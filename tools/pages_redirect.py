"""Сайт переехал на свой домен. Для GitHub Pages собираем папку-заглушку:
каждая старая страница сразу переадресует на ту же страницу на домене,
а canonical подсказывает поисковикам новый адрес (без дублей в выдаче)."""
import os, sys, glob, html

DOMAIN = "https://chistka-39.ru"
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
for f in glob.glob(os.path.join(src, "*.html")):
    name = os.path.basename(f)[:-5]
    path = "" if name == "index" else name
    target = f"{DOMAIN}/{path}"
    t = html.escape(target)
    page = f"""<!doctype html><html lang="ru"><head><meta charset="utf-8">
<title>Сайт переехал на chistka-39.ru</title>
<link rel="canonical" href="{t}">
<meta http-equiv="refresh" content="0; url={t}">
<script>location.replace({target!r} + location.hash);</script>
</head><body><p>Сайт переехал: <a href="{t}">{t}</a></p></body></html>"""
    with open(os.path.join(out, name + ".html"), "w", encoding="utf-8") as fh:
        fh.write(page)
with open(os.path.join(out, "robots.txt"), "w") as fh:
    fh.write(f"User-agent: *\nAllow: /\nSitemap: {DOMAIN}/sitemap.xml\n")
