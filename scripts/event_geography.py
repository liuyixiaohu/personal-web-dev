"""Strict San Francisco Bay Area event-location validation.

The Luma Discover endpoint treats latitude/longitude as a relevance hint, not
as a hard boundary.  Events are accepted only when structured city, region,
country, and coordinates all agree with the configured nine-county area.
"""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path


CONFIG_FILE = Path(__file__).resolve().parent / "lib" / "bay-area-locations.json"


def _normalize(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").casefold()).strip()


@lru_cache(maxsize=1)
def _config() -> dict:
    with open(CONFIG_FILE, encoding="utf-8") as file:
        return json.load(file)


def _number(value: object) -> float | None:
    if isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number == number else None


def extract_geo(event: dict) -> dict:
    """Extract the structured location fields used by both filtering stages."""
    address = event.get("geo_address_info") or {}
    coordinate = event.get("coordinate") or address.get("place_coordinate") or {}
    return {
        "city": address.get("city") or "",
        "region": address.get("region") or "",
        "region_short": address.get("region_short") or "",
        "country_code": address.get("country_code") or "",
        "latitude": _number(coordinate.get("latitude")),
        "longitude": _number(coordinate.get("longitude")),
    }


def bay_area_rejection_reason(geo: dict) -> str | None:
    """Return ``None`` for a verified nine-county location, otherwise a reason."""
    config = _config()
    city = _normalize(geo.get("city"))
    region_values = {_normalize(geo.get("region")), _normalize(geo.get("region_short"))}
    country_code = _normalize(geo.get("country_code"))
    latitude = _number(geo.get("latitude"))
    longitude = _number(geo.get("longitude"))

    if not city or not region_values - {""} or not country_code:
        return "missing structured city, region, or country"
    if country_code not in {_normalize(value) for value in config["country_codes"]}:
        return f"country is not US ({geo.get('country_code')!r})"
    if not region_values.intersection({_normalize(value) for value in config["regions"]}):
        return f"region is not California ({geo.get('region') or geo.get('region_short')!r})"
    if city not in {_normalize(value) for value in config["cities"]}:
        return f"city is not in the configured nine-county Bay Area ({geo.get('city')!r})"
    if latitude is None or longitude is None:
        return "missing coordinates"

    bounds = config["coordinate_bounds"]
    if not (
        bounds["min_latitude"] <= latitude <= bounds["max_latitude"]
        and bounds["min_longitude"] <= longitude <= bounds["max_longitude"]
    ):
        return f"coordinates are outside the Bay Area ({latitude}, {longitude})"

    return None


def is_bay_area_geo(geo: dict) -> bool:
    return bay_area_rejection_reason(geo) is None
