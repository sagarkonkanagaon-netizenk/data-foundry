import json

from foundry import evolution
from tests.conftest import make_event


def test_new_field_is_recorded_once(contract, tmp_path):
    reg = evolution.load_registry(tmp_path / "r.json", contract.known_fields)
    lines = [json.dumps(make_event(1)), json.dumps(make_event(2, experiment_flag=True))]
    changes, reg = evolution.detect(lines, reg, "run-1")
    assert [(c.kind, c.field, c.count) for c in changes] == [("added", "experiment_flag", 1)]
    again, _ = evolution.detect(lines, reg, "run-2")
    assert again == []


def test_new_type_for_known_field_is_widened(contract):
    reg = evolution.load_registry(evolution.Path("/nonexistent"), contract.known_fields)
    changes, reg = evolution.detect([json.dumps(make_event(1, namespace="zero"))], reg, "r")
    assert [(c.kind, c.field, c.types) for c in changes] == [("type_widened", "namespace", ["integer", "string"])]
    assert reg["namespace"] == ["integer", "string"]


def test_free_form_and_optional_fields_are_not_noise(contract):
    reg = evolution.load_registry(evolution.Path("/nonexistent"), contract.known_fields)
    log = make_event(1, type="log", log_params={"anything": [1, 2]}, length=None, revision=None)
    changes, _ = evolution.detect([json.dumps(log), "not json"], reg, "r")
    assert changes == []


def test_registry_round_trip(contract, tmp_path):
    p = tmp_path / "reg.json"
    evolution.save_registry(p, {"a": ["string"]}, "r1")
    assert evolution.load_registry(p, contract.known_fields) == {"a": ["string"]}
