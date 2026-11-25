"""Focused checks for the detail-to-summary boundary."""

import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone

from pathlib import Path
from unittest.mock import patch

import requests

from scripts.enrich_event_summaries import detail_description, is_due, main


class EventSummaryTests(unittest.TestCase):
    def test_prosemirror_detail_is_flattened(self):
        detail = {
            "event": {
                "description_mirror": {
                    "type": "doc",
                    "content": [
                        {"type": "heading", "content": [{"type": "text", "text": "AI workshop"}]},
                        {"type": "paragraph", "content": [{"type": "text", "text": "Build an agent."}]},
                    ],
                }
            }
        }
        self.assertEqual(detail_description(detail), "AI workshop Build an agent.")

    def test_missing_detail_does_not_create_summary_source(self):
        self.assertEqual(detail_description({"event": {"description_mirror": None}}), "")

    def test_cached_summary_refreshes_after_seven_days(self):
        now = datetime(2026, 11, 8, tzinfo=timezone.utc)
        self.assertFalse(
            is_due({"summary_checked_at": (now - timedelta(days=6)).isoformat()}, now)
        )
        self.assertTrue(
            is_due({"summary_checked_at": (now - timedelta(days=8)).isoformat()}, now)
        )


    def test_gemini_outage_keeps_cached_summary_and_event_due(self):
        event = {
            "api_id": "evt-test",
            "summary": "Cached summary.",
            "summary_source_hash": "old",
            "summary_checked_at": "2020-01-01T00:00:00+00:00",
        }
        catalog = {"events": [event]}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "events.json"
            path.write_text(json.dumps(catalog), encoding="utf-8")
            with (
                patch.dict("os.environ", {"GEMINI_API_KEY": "test"}),
                patch("scripts.enrich_event_summaries.EVENTS_FILE", path),
                patch("scripts.enrich_event_summaries.fetch_detail", return_value=("new text", "new")),
                patch("scripts.enrich_event_summaries.generate_batch", side_effect=requests.HTTPError("503")),
            ):
                main()
            self.assertEqual(json.loads(path.read_text(encoding="utf-8")), catalog)


if __name__ == "__main__":
    unittest.main()
