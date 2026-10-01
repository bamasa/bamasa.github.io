#!/bin/bash
# Обновляет assets/github.json — активность GitHub за последние 3 месяца.
# Запускается кроном; пушит только если данные изменились.
set -euo pipefail
cd "$(dirname "$0")/.."
FROM=$(date -u -v-90d +%Y-%m-%dT00:00:00Z 2>/dev/null || date -u -d '90 days ago' +%Y-%m-%dT00:00:00Z)
TO=$(date -u +%Y-%m-%dT23:59:59Z)
gh api graphql -f query="
query {
  viewer {
    createdAt
    contributionsCollection(from: \"$FROM\", to: \"$TO\") {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
  }
}" | python3 -c '
import json, sys, datetime
d = json.load(sys.stdin)["data"]["viewer"]
cal = d["contributionsCollection"]["contributionCalendar"]
days = [x for w in cal["weeks"] for x in w["contributionDays"]]
days.sort(key=lambda x: x["date"])
start = days[0]["date"]
wd = datetime.date.fromisoformat(start).isoweekday() % 7  # 0 = воскресенье, как сетка GitHub
out = {
    "start": start,
    "startWeekday": wd,
    "counts": [x["contributionCount"] for x in days],
    "totalContributions": cal["totalContributions"],
    "memberSince": d["createdAt"][:4],
}
open("assets/github.json", "w").write(json.dumps(out))
print("дней:", len(days), "всего:", out["totalContributions"])
'
if ! git diff --quiet -- assets/github.json || ! git ls-files --error-unmatch assets/github.json >/dev/null 2>&1; then
  git add assets/github.json
  git commit -q -m "Refresh GitHub activity"
  git -c credential.helper='!gh auth git-credential' push -q origin HEAD
  echo "запушено"
else
  echo "без изменений"
fi
