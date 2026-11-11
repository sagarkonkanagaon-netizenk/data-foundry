---
id: source-outage
order: 5
label: Source outage
stage: intake
severity: error
detect: "the stream can't be reached, or sends nothing"
diagnose: "3 attempts with backoff, then SourceUnavailable"
heal: "run marked failed · report still published · next hour retries"
code:
  - { label: "source.py · sample_stream()", path: "pipeline/foundry/source.py" }
  - { label: "run.py · failed runs", path: "pipeline/foundry/run.py" }
---

The source is outside the pipeline's control. The sampler retries three times with
backoff, keeps whatever arrived if the stream drops mid-sample, and gives up cleanly
if nothing came at all.

A failed run is still a run: its report is published with the stage and the error, and
it shows up red in the run history. The next hourly run tries again.
