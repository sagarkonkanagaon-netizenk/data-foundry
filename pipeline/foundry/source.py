"""Extract: sample the Wikimedia recent-changes stream for a few minutes.

The stream (https://stream.wikimedia.org/v2/stream/recentchange) is public
server-sent events: every edit, page creation and log action on every Wikimedia wiki,
typically tens of events a second. Each run reads it for a fixed window and writes the
lines untouched to a landing file, which bronze then loads. Keeping the landing file
means a run can be replayed exactly.
"""

from __future__ import annotations

import time
from collections.abc import Iterable, Iterator
from dataclasses import dataclass
from pathlib import Path

import requests

STREAM_URL = "https://stream.wikimedia.org/v2/stream/recentchange"
# Wikimedia asks API clients to identify themselves with a descriptive User-Agent.
USER_AGENT = "data-foundry-pipeline/0.1 (portfolio demo; github.com/sagarkonkanagaon-netizenk/data-foundry)"


class SourceUnavailable(Exception):
    """The stream could not be reached, or sent nothing."""


@dataclass
class Sample:
    path: Path
    source: str
    events: int
    bytes: int
    seconds: float


def parse_sse(lines: Iterable[str]) -> Iterator[str]:
    """Yield the data payload of each server-sent event.

    An event is one or more `data:` lines ended by a blank line; `:` lines are
    comments (keep-alives) and `id:`/`event:` lines carry no payload we need.
    """
    data: list[str] = []
    for line in lines:
        if line == "":
            if data:
                yield "\n".join(data)
                data = []
            continue
        if line.startswith(":"):
            continue
        name, _, value = line.partition(":")
        if value.startswith(" "):
            value = value[1:]
        if name == "data":
            data.append(value)
    if data:
        yield "\n".join(data)


def sample_stream(
    out: Path,
    seconds: float = 120,
    max_events: int = 10_000,
    url: str = STREAM_URL,
    attempts: int = 3,
    session: requests.Session | None = None,
) -> Sample:
    """Read the stream for `seconds` (or until `max_events`) and write each event as one line."""
    http = session or requests.Session()
    out.parent.mkdir(parents=True, exist_ok=True)
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            return _sample_once(http, out, seconds, max_events, url)
        except (requests.RequestException, SourceUnavailable) as e:
            last_error = e
            time.sleep(2 * 2**attempt)
    raise SourceUnavailable(f"could not sample {url} after {attempts} attempts: {last_error}")


def _sample_once(http: requests.Session, out: Path, seconds: float, max_events: int, url: str) -> Sample:
    started = time.monotonic()
    events = size = 0
    headers = {"Accept": "text/event-stream", "User-Agent": USER_AGENT}
    with http.get(url, headers=headers, stream=True, timeout=(10, 30)) as r:
        r.raise_for_status()
        with open(out, "w", encoding="utf-8") as f:
            lines = r.iter_lines(decode_unicode=True)
            try:
                for payload in parse_sse(line if line is not None else "" for line in lines):
                    payload = payload.replace("\n", " ")
                    f.write(payload + "\n")
                    events += 1
                    size += len(payload)
                    if events >= max_events or time.monotonic() - started >= seconds:
                        break
            except requests.RequestException:
                # the stream dropped mid-sample: keep what arrived, retry only if nothing did
                if events == 0:
                    raise
    if events == 0:
        raise SourceUnavailable("stream connected but sent no events")
    return Sample(out, url, events, size, round(time.monotonic() - started, 1))


def from_file(src: Path, out: Path) -> Sample:
    """Use a recorded file instead of the live stream (tests, local runs, replays)."""
    out.parent.mkdir(parents=True, exist_ok=True)
    text = Path(src).read_text(encoding="utf-8")
    lines = [ln for ln in text.splitlines() if ln.strip()]
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return Sample(out, f"file:{Path(src).name}", len(lines), sum(len(ln) for ln in lines), 0.0)
