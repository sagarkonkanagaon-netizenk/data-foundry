from pathlib import Path

import pytest
import requests

from foundry import source


def test_parse_sse_joins_data_lines_and_skips_comments():
    lines = [":ok", "event: message", "id: [1]", 'data: {"a":', "data: 1}", "", 'data: {"b": 2}', ""]
    assert list(source.parse_sse(lines)) == ['{"a":\n1}', '{"b": 2}']


class FakeResponse:
    def __init__(self, lines, fail_after=None):
        self.lines, self.fail_after = lines, fail_after

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def raise_for_status(self):
        pass

    def iter_lines(self, decode_unicode=True):
        for n, ln in enumerate(self.lines):
            if self.fail_after is not None and n >= self.fail_after:
                raise requests.ConnectionError("stream dropped")
            yield ln


class FakeSession:
    def __init__(self, response):
        self.response = response
        self.headers = None

    def get(self, url, headers=None, stream=None, timeout=None):
        self.headers = headers
        return self.response


def test_sample_stops_at_max_events_and_identifies_itself(tmp_path: Path):
    lines = []
    for i in range(50):
        lines += [f'data: {{"n": {i}}}', ""]
    http = FakeSession(FakeResponse(lines))
    s = source.sample_stream(tmp_path / "out.jsonl", seconds=60, max_events=10, session=http)
    assert s.events == 10
    assert len((tmp_path / "out.jsonl").read_text().splitlines()) == 10
    assert "data-foundry-pipeline" in http.headers["User-Agent"]


def test_a_dropped_stream_keeps_what_arrived(tmp_path: Path):
    lines = ['data: {"n": 1}', "", 'data: {"n": 2}', "", 'data: {"n": 3}', ""]
    s = source.sample_stream(tmp_path / "o.jsonl", seconds=60, session=FakeSession(FakeResponse(lines, fail_after=4)))
    assert s.events == 2


def test_an_empty_stream_is_a_failure(tmp_path: Path, monkeypatch):
    monkeypatch.setattr(source.time, "sleep", lambda s: None)
    with pytest.raises(source.SourceUnavailable):
        source.sample_stream(
            tmp_path / "o.jsonl", seconds=1, attempts=2, session=FakeSession(FakeResponse([":keepalive", ""]))
        )
