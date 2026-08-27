"""Location search and live weather for the crop prediction wizard."""

import json
import urllib.error
import urllib.parse
import urllib.request

USER_AGENT = "OptiCrop/1.0 (crop-recommendation-app)"

# Curated Indian locations (village/locality, district, state)
LOCAL_LOCATIONS = [
    {"village": "Kosigi", "city": "", "district": "Kurnool", "state": "Andhra Pradesh", "lat": 15.684, "lon": 77.249},
    {"village": "Kurnool", "city": "Kurnool", "district": "Kurnool", "state": "Andhra Pradesh", "lat": 15.8281, "lon": 78.0373},
    {"village": "Mysuru", "city": "Mysuru", "district": "Mysuru", "state": "Karnataka", "lat": 12.2958, "lon": 76.6394},
    {"village": "Bengaluru", "city": "Bengaluru", "district": "Bengaluru Urban", "state": "Karnataka", "lat": 12.9716, "lon": 77.5946},
    {"village": "Pune", "city": "Pune", "district": "Pune", "state": "Maharashtra", "lat": 18.5204, "lon": 73.8567},
    {"village": "Nashik", "city": "Nashik", "district": "Nashik", "state": "Maharashtra", "lat": 19.9975, "lon": 73.7898},
    {"village": "Ludhiana", "city": "Ludhiana", "district": "Ludhiana", "state": "Punjab", "lat": 30.901, "lon": 75.8573},
    {"village": "Kochi", "city": "Kochi", "district": "Ernakulam", "state": "Kerala", "lat": 9.9312, "lon": 76.2673},
    {"village": "Chennai", "city": "Chennai", "district": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707},
    {"village": "Coimbatore", "city": "Coimbatore", "district": "Coimbatore", "state": "Tamil Nadu", "lat": 11.0168, "lon": 76.9558},
    {"village": "Hyderabad", "city": "Hyderabad", "district": "Hyderabad", "state": "Telangana", "lat": 17.385, "lon": 78.4867},
    {"village": "Warangal", "city": "Warangal", "district": "Warangal", "state": "Telangana", "lat": 17.9689, "lon": 79.5941},
    {"village": "Jaipur", "city": "Jaipur", "district": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lon": 75.7873},
    {"village": "Lucknow", "city": "Lucknow", "district": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lon": 80.9462},
    {"village": "Patna", "city": "Patna", "district": "Patna", "state": "Bihar", "lat": 25.5941, "lon": 85.1376},
]


def format_location_label(parts: dict) -> str:
    bits = []
    for key in ("village", "city", "district", "state"):
        val = (parts.get(key) or "").strip()
        if val and (not bits or val.lower() != bits[-1].lower()):
            bits.append(val)
    return ", ".join(bits)


def _local_search(query: str, limit: int = 8) -> list[dict]:
    q = query.lower().strip()
    if not q:
        return []

    results = []
    for loc in LOCAL_LOCATIONS:
        haystack = " ".join(
            filter(None, [loc["village"], loc["city"], loc["district"], loc["state"]])
        ).lower()
        if q in haystack or any(q in part.lower() for part in haystack.split()):
            results.append(
                {
                    "label": format_location_label(loc),
                    "village": loc["village"],
                    "city": loc.get("city", ""),
                    "district": loc["district"],
                    "state": loc["state"],
                    "lat": loc["lat"],
                    "lon": loc["lon"],
                    "source": "local",
                }
            )
        if len(results) >= limit:
            break
    return results


def _nominatim_search(query: str, limit: int = 6) -> list[dict]:
    params = urllib.parse.urlencode(
        {
            "q": query,
            "format": "json",
            "addressdetails": 1,
            "countrycodes": "in",
            "limit": limit,
        }
    )
    url = f"https://nominatim.openstreetmap.org/search?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return []

    results = []
    for item in data:
        addr = item.get("address", {})
        village = (
            addr.get("village")
            or addr.get("town")
            or addr.get("hamlet")
            or addr.get("suburb")
            or addr.get("neighbourhood")
            or item.get("name", "")
        )
        city = addr.get("city") or addr.get("town") or addr.get("county") or ""
        district = addr.get("state_district") or addr.get("district") or addr.get("county") or ""
        state = addr.get("state") or ""

        parts = {
            "village": village,
            "city": city,
            "district": district,
            "state": state,
            "lat": float(item["lat"]),
            "lon": float(item["lon"]),
        }
        label = format_location_label(parts)
        if not label:
            continue
        results.append({**parts, "label": label, "source": "nominatim"})

    return results


def search_locations(query: str, limit: int = 8) -> list[dict]:
    if len(query.strip()) < 2:
        return []

    seen = set()
    merged = []

    for loc in _local_search(query, limit):
        key = loc["label"].lower()
        if key not in seen:
            seen.add(key)
            merged.append(loc)

    # Return local matches immediately when available (faster UX)
    if merged:
        return merged[:limit]

    for loc in _nominatim_search(query, limit):
        key = loc["label"].lower()
        if key not in seen:
            seen.add(key)
            merged.append(loc)
        if len(merged) >= limit:
            break

    return merged[:limit]


def fetch_live_weather(lat: float, lon: float) -> dict:
    params = urllib.parse.urlencode(
        {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,precipitation",
            "timezone": "auto",
        }
    )
    url = f"https://api.open-meteo.com/v1/forecast?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    current = data.get("current", {})
    precip = float(current.get("precipitation", 0) or 0)

    return {
        "temperature": round(float(current.get("temperature_2m", 25)), 1),
        "humidity": round(float(current.get("relative_humidity_2m", 70)), 1),
        "rainfall": round(max(precip, 2.0), 1),
        "source": "Open-Meteo Live Weather",
        "updated": current.get("time", ""),
    }
