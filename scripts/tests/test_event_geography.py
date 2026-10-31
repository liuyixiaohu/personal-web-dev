import unittest
from unittest.mock import Mock, patch

from scripts.event_geography import bay_area_rejection_reason, extract_geo
from scripts.luma import fetch_events


class EventGeographyTests(unittest.TestCase):
    def test_extracts_luma_structured_location(self):
        event = {
            "geo_address_info": {
                "city": "Oakland",
                "region": "California",
                "region_short": "CA",
                "country_code": "US",
            },
            "coordinate": {"latitude": 37.8044, "longitude": -122.2712},
        }

        self.assertIsNone(bay_area_rejection_reason(extract_geo(event)))

    def test_missing_coordinates_fail_closed(self):
        reason = bay_area_rejection_reason(
            {
                "city": "San Francisco",
                "region": "California",
                "region_short": "CA",
                "country_code": "US",
            }
        )

        self.assertEqual(reason, "missing coordinates")

    def test_city_and_coordinates_must_both_match(self):
        reason = bay_area_rejection_reason(
            {
                "city": "San Francisco",
                "region": "California",
                "region_short": "CA",
                "country_code": "US",
                "latitude": 38.9072,
                "longitude": -77.0369,
            }
        )

        self.assertIn("coordinates are outside", reason)


class EventFetchTests(unittest.TestCase):
    def setUp(self):
        self.source = {
            "slug": "tech",
            "label": "Tech Events (Bay Area)",
            "pagination_limit": 50,
            "geo_latitude": 37.7749,
            "geo_longitude": -122.4194,
        }

    @staticmethod
    def response(entries):
        response = Mock()
        response.json.return_value = {"entries": entries, "has_more": False}
        return response

    @patch.object(fetch_events.time, "sleep")
    @patch.object(fetch_events, "request_with_retry")
    def test_empty_first_page_is_retried(self, request, sleep):
        event = {"event": {"api_id": "evt-123"}}
        request.side_effect = [self.response([]), self.response([event])]

        self.assertEqual(fetch_events.fetch_category_events(self.source), [event])
        self.assertEqual(request.call_count, 2)
        sleep.assert_called_once_with(fetch_events.EMPTY_RESPONSE_RETRY_DELAY)

    @patch.object(fetch_events.time, "sleep")
    @patch.object(fetch_events, "request_with_retry")
    def test_repeated_empty_first_page_fails_closed(self, request, sleep):
        request.return_value = self.response([])

        with self.assertRaisesRegex(RuntimeError, "returned no events"):
            fetch_events.fetch_category_events(self.source)

        self.assertEqual(request.call_count, fetch_events.EMPTY_RESPONSE_RETRIES + 1)
        self.assertEqual(sleep.call_count, fetch_events.EMPTY_RESPONSE_RETRIES)

    @patch.object(fetch_events, "request_with_retry")
    def test_malformed_entries_payload_fails_closed(self, request):
        response = Mock()
        response.json.return_value = {"entries": None, "has_more": False}
        request.return_value = response

        with self.assertRaisesRegex(RuntimeError, "malformed entries payload"):
            fetch_events.fetch_category_events(self.source)


if __name__ == "__main__":
    unittest.main()
