import unittest

from scripts.event_geography import bay_area_rejection_reason, extract_geo


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


if __name__ == "__main__":
    unittest.main()
