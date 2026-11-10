"""Сообщает Яндексу и Bing (протокол IndexNow) о страницах, изменённых
за последние двое суток. Берёт даты из site/sitemap.xml, ключ — из generate.py.
Запуск: python3 tools/indexnow.py  (вызывается из GitHub Actions после выкладки)."""
import json
import os
import re
import sys
import urllib.request
from datetime import date, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, "generate.py"), encoding="utf-8").read()
key = re.search(r'^INDEXNOW_KEY = "([0-9a-f]+)"', src, re.M).group(1)
domain = re.search(r'"domain": "(https://[^"]+)"', src).group(1)
host = domain.split("//", 1)[1]

sitemap = open(os.path.join(ROOT, "site", "sitemap.xml"), encoding="utf-8").read()
since = (date.today() - timedelta(days=int(os.environ.get("INDEXNOW_DAYS", "2")))).isoformat()
urls = [loc for loc, mod in re.findall(r"<loc>(.*?)</loc><lastmod>(.*?)</lastmod>", sitemap) if mod >= since]
if not urls:
    print("Изменённых страниц нет, пинг не нужен")
    sys.exit(0)

body = json.dumps({"host": host, "key": key, "keyLocation": f"{domain}/{key}.txt", "urlList": urls[:10000]}).encode()
for endpoint in ("https://yandex.com/indexnow", "https://api.indexnow.org/indexnow"):
    req = urllib.request.Request(endpoint, data=body, headers={"Content-Type": "application/json; charset=utf-8"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(endpoint, r.status, f"{len(urls)} адресов")
    except urllib.error.HTTPError as e:
        print(endpoint, "ошибка", e.code, e.read()[:300])
    except Exception as e:
        print(endpoint, "ошибка", e)
