# pipeline-data

Run reports published by the hourly pipeline in `/pipeline` on `main`.
This branch is written by GitHub Actions only.

- `reports/latest.json`: the newest run, in full
- `reports/index.json`: one line per run, newest first, last 30 days
- `reports/runs/YYYY-MM-DD/<run_id>.json`: every run, last 30 days
