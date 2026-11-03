"""Writes assets/quantprofile.json from the public QuantProfile profile,
aligned to the same dates as assets/github.json so both maps line up."""
import datetime as dt, json, urllib.request

PID = 'Xjje1VoQ'
req = urllib.request.Request('https://quantprofile.com/api/profile/' + PID,
                             headers={'User-Agent': 'bamasa.github.io activity refresh'})
prof = json.load(urllib.request.urlopen(req, timeout=30))
days = prof.get('d') or {}

gh = json.load(open('assets/github.json'))
start = dt.date.fromisoformat(gh['start'])
counts = [days.get((start + dt.timedelta(i)).isoformat(), 0) for i in range(len(gh['counts']))]

best = cur = 0
for c in counts:
    cur = cur + 1 if c else 0
    best = max(best, cur)

json.dump({'start': gh['start'], 'counts': counts, 'total': sum(counts),
           'streak': best, 'since': min(days)[:4] if days else None},
          open('assets/quantprofile.json', 'w'))
print('days', sum(1 for c in counts if c), 'total', sum(counts), 'streak', best, 'current', cur)
