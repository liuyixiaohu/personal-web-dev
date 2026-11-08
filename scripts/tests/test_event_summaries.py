"""Focused checks for the detail-to-summary boundary."""

import unittest
from datetime import datetime, timedelta, timezone

from scripts.enrich_event_summaries import detail_description, is_due


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


if __name__ == "__main__":
    unittest.main()
