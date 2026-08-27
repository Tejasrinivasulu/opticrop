"""Supplementary crop metadata for recommendation display."""

CROP_INFO = {
    "rice": {
        "season": "Kharif / Rabi",
        "water": "High",
        "soil": "Clay loam, pH 5.5–7.0",
        "yield": "25–35 quintals/acre",
        "description": "Staple cereal suited to warm, humid climates with standing water or heavy irrigation.",
    },
    "maize": {
        "season": "Kharif / Rabi",
        "water": "Moderate",
        "soil": "Well-drained loam",
        "yield": "20–30 quintals/acre",
        "description": "Versatile cereal that thrives in warm seasons with adequate rainfall.",
    },
    "chickpea": {
        "season": "Rabi",
        "water": "Low",
        "soil": "Sandy loam, neutral pH",
        "yield": "8–12 quintals/acre",
        "description": "Cool-season pulse with low water demand and nitrogen-fixing roots.",
    },
    "kidneybeans": {
        "season": "Kharif",
        "water": "Moderate",
        "soil": "Loamy, well-drained",
        "yield": "6–10 quintals/acre",
        "description": "Warm-season legume requiring moderate moisture and fertile soil.",
    },
    "pigeonpeas": {
        "season": "Kharif",
        "water": "Low–Moderate",
        "soil": "Sandy loam to clay",
        "yield": "5–8 quintals/acre",
        "description": "Drought-tolerant pulse ideal for semi-arid regions.",
    },
    "mothbeans": {
        "season": "Kharif",
        "water": "Low",
        "soil": "Sandy, arid soils",
        "yield": "4–7 quintals/acre",
        "description": "Hardy legume adapted to hot, dry conditions.",
    },
    "mungbean": {
        "season": "Kharif / Summer",
        "water": "Moderate",
        "soil": "Loamy, neutral pH",
        "yield": "5–8 quintals/acre",
        "description": "Short-duration pulse with quick maturity and moderate water needs.",
    },
    "blackgram": {
        "season": "Kharif",
        "water": "Moderate",
        "soil": "Loamy to clay loam",
        "yield": "5–7 quintals/acre",
        "description": "Traditional pulse crop suited to warm, humid monsoon seasons.",
    },
    "lentil": {
        "season": "Rabi",
        "water": "Low",
        "soil": "Sandy loam, cool climate",
        "yield": "6–9 quintals/acre",
        "description": "Cool-season pulse with minimal irrigation requirements.",
    },
    "pomegranate": {
        "season": "Perennial",
        "water": "Low–Moderate",
        "soil": "Well-drained, alkaline tolerant",
        "yield": "8–12 tonnes/acre",
        "description": "Drought-hardy fruit tree thriving in semi-arid climates.",
    },
    "banana": {
        "season": "Year-round",
        "water": "High",
        "soil": "Rich loam, high organic matter",
        "yield": "300–400 quintals/acre",
        "description": "Tropical fruit requiring consistent warmth and heavy irrigation.",
    },
    "mango": {
        "season": "Perennial",
        "water": "Moderate",
        "soil": "Deep loam, well-drained",
        "yield": "80–120 quintals/acre",
        "description": "King of fruits — needs warm winters and distinct dry season.",
    },
    "grapes": {
        "season": "Perennial",
        "water": "Moderate",
        "soil": "Sandy loam, good drainage",
        "yield": "15–25 tonnes/acre",
        "description": "Temperate fruit vine suited to dry climates with irrigation.",
    },
    "watermelon": {
        "season": "Summer",
        "water": "Moderate",
        "soil": "Sandy loam, warm soil",
        "yield": "200–300 quintals/acre",
        "description": "Heat-loving melon with spreading vines and moderate water use.",
    },
    "muskmelon": {
        "season": "Summer",
        "water": "Moderate",
        "soil": "Sandy loam, well-drained",
        "yield": "150–250 quintals/acre",
        "description": "Sweet melon crop for hot, dry summers with drip irrigation.",
    },
    "apple": {
        "season": "Perennial",
        "water": "Moderate",
        "soil": "Loamy, cool highland",
        "yield": "100–150 quintals/acre",
        "description": "Temperate fruit requiring cool winters and moderate rainfall.",
    },
    "orange": {
        "season": "Perennial",
        "water": "Moderate",
        "soil": "Well-drained loam, pH 6–7",
        "yield": "80–120 quintals/acre",
        "description": "Citrus tree suited to subtropical climates with mild winters.",
    },
    "papaya": {
        "season": "Year-round",
        "water": "Moderate",
        "soil": "Sandy loam, frost-free",
        "yield": "200–300 quintals/acre",
        "description": "Fast-growing tropical fruit tolerant of varied soils.",
    },
    "coconut": {
        "season": "Perennial",
        "water": "High",
        "soil": "Coastal sandy loam",
        "yield": "8,000–10,000 nuts/acre",
        "description": "Coastal palm requiring high humidity and warm temperatures year-round.",
    },
    "cotton": {
        "season": "Kharif",
        "water": "Moderate–High",
        "soil": "Black cotton soil, deep loam",
        "yield": "10–15 quintals/acre",
        "description": "Major fibre crop needing long warm growing season.",
    },
    "jute": {
        "season": "Kharif",
        "water": "High",
        "soil": "Alluvial loam, humid",
        "yield": "20–25 quintals/acre",
        "description": "Fibre crop for warm, humid river-basin regions.",
    },
    "coffee": {
        "season": "Perennial",
        "water": "Moderate",
        "soil": "Volcanic loam, shade",
        "yield": "800–1,200 kg/acre",
        "description": "Highland plantation crop needing mild temperatures and rainfall.",
    },
}


def get_crop_info(crop_name: str) -> dict:
    key = crop_name.lower().strip()
    info = CROP_INFO.get(key, {})
    return {
        "name": crop_name.title(),
        "season": info.get("season", "Varies by region"),
        "water": info.get("water", "Moderate"),
        "soil": info.get("soil", "Well-drained loam"),
        "yield": info.get("yield", "Contact local extension office"),
        "description": info.get(
            "description",
            f"{crop_name.title()} is recommended based on your soil and climate readings.",
        ),
        "growing_tips": info.get(
            "growing_tips",
            "Maintain soil moisture, use balanced fertilizers, and monitor pests regularly.",
        ),
    }
