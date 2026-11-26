"""Read campaign and ad-group inventory before rebuilding campaigns."""
import json
import os
import urllib.request

def read(service, params):
    request = urllib.request.Request(
        f"https://api.direct.yandex.com/json/v501/{service}",
        data=json.dumps({"method": "get", "params": params}).encode(),
        headers={
            "Authorization": "Bearer " + os.environ["YANDEX_DIRECT_TOKEN"],
            "Content-Type": "application/json",
            "Accept-Language": "ru",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        result = json.load(response)
    if "error" in result:
        error = result["error"]
        raise RuntimeError(f"{service}: API error {error.get('error_code')}: {error.get('error_string')}")
    return result["result"]

def pages(service, key, criteria, fields):
    offset = 0
    while True:
        result = read(service, {
            "SelectionCriteria": criteria,
            "FieldNames": fields,
            "Page": {"Limit": 1000, "Offset": offset},
        })
        yield from result[key]
        offset = result.get("LimitedBy")
        if offset is None:
            break

campaigns = list(pages("campaigns", "Campaigns", {}, ["Id", "Type", "State", "Status"]))
lines = ["## Инвентаризация для копирования", ""]
for campaign in campaigns:
    groups = list(pages("adgroups", "AdGroups", {"CampaignIds": [campaign["Id"]]},
                        ["Id", "Type", "RegionIds"]))
    regions = sorted({tuple(sorted(group["RegionIds"])) for group in groups})
    types = sorted({group["Type"] for group in groups})
    lines.append(f"- {campaign['Id']} · {campaign['Type']} · {campaign['State']} / {campaign['Status']} · групп: {len(groups)} · типы: {types} · регионы: {regions}")
with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as summary:
    summary.write("\n".join(lines) + "\n")
