# -*- coding: utf-8 -*-
"""Проверка токена Яндекс.Директа: только чтение (campaigns.get), в кабинете ничего не меняет.

Токен берётся из переменной окружения YANDEX_DIRECT_TOKEN (секрет репозитория).
Пробует боевой API, затем песочницу: у приложения с тестовым доступом работает только песочница.
Запуск: GitHub Actions → «Проверка API Директа» → Run workflow.
"""
import json
import os
import sys
import urllib.error
import urllib.request

TOKEN = os.environ.get("YANDEX_DIRECT_TOKEN", "").strip()
ENDPOINTS = {
    "Боевой API": "https://api.direct.yandex.com/json/v5/campaigns",
    "Песочница": "https://api-sandbox.direct.yandex.com/json/v5/campaigns",
}
BODY = json.dumps({
    "method": "get",
    "params": {"SelectionCriteria": {}, "FieldNames": ["Id", "Name", "Type", "State", "Status"]},
}).encode()

lines = []


def out(s=""):
    print(s)
    lines.append(s)


def call(url):
    req = urllib.request.Request(url, data=BODY, headers={
        "Authorization": f"Bearer {TOKEN}",
        "Accept-Language": "ru",
        "Content-Type": "application/json; charset=utf-8",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.load(r), r.headers.get("Units")
    except urllib.error.HTTPError as e:
        try:
            data = json.load(e)
        except Exception:
            data = {"error": {"error_code": e.code, "error_string": str(e), "error_detail": ""}}
        return e.code, data, e.headers.get("Units")


def main():
    if not TOKEN:
        out("❌ Секрет YANDEX_DIRECT_TOKEN не найден или пустой.")
        return 1
    ok_any = False
    for name, url in ENDPOINTS.items():
        status, data, units = call(url)
        out(f"### {name}")
        if "error" in data:
            e = data["error"]
            out(f"❌ Ошибка {e.get('error_code')}: {e.get('error_string')}. {e.get('error_detail', '')}")
        else:
            ok_any = True
            camps = data.get("result", {}).get("Campaigns", [])
            out(f"✅ Токен работает. Кампаний: {len(camps)}. Баллы API (потрачено/осталось/лимит): {units}")
            for c in camps:
                out(f"- {c['Id']} · {c['Name']} · {c['Type']} · {c['State']} / {c['Status']}")
        out()
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
    return 0 if ok_any else 1


if __name__ == "__main__":
    sys.exit(main())
