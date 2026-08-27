"""Load trained model and run crop predictions."""

import json
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from ml.crop_info import get_crop_info

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "random_forest.pkl"
METRICS_PATH = BASE_DIR / "models" / "metrics.json"

FEATURE_COLUMNS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

_model = None
_metrics = None


def _load_model():
    global _model, _metrics
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. Run: python train_model.py"
            )
        _model = joblib.load(MODEL_PATH)
    if _metrics is None and METRICS_PATH.exists():
        with open(METRICS_PATH, encoding="utf-8") as f:
            _metrics = json.load(f)
    return _model


def get_metrics() -> dict:
    _load_model()
    return _metrics or {}


def validate_inputs(data: dict) -> tuple[dict | None, str | None]:
    """Validate and coerce prediction inputs."""
    cleaned = {}
    ranges = {
        "N": (0, 140),
        "P": (0, 145),
        "K": (0, 205),
        "temperature": (-10, 55),
        "humidity": (0, 100),
        "ph": (0, 14),
        "rainfall": (0, 500),
    }
    labels = {
        "N": "Nitrogen (N)",
        "P": "Phosphorous (P)",
        "K": "Potassium (K)",
        "temperature": "Temperature",
        "humidity": "Humidity",
        "ph": "Soil pH",
        "rainfall": "Rainfall",
    }

    for key in FEATURE_COLUMNS:
        raw = data.get(key)
        if raw is None or str(raw).strip() == "":
            return None, f"{labels[key]} is required."
        try:
            value = float(raw)
        except (TypeError, ValueError):
            return None, f"{labels[key]} must be a number."

        lo, hi = ranges[key]
        if not lo <= value <= hi:
            return None, f"{labels[key]} must be between {lo} and {hi}."

        cleaned[key] = value

    return cleaned, None


def _param_analysis(value: float, ideal_lo: float, ideal_high: float, label: str, unit: str = "") -> dict:
    mid = (ideal_lo + ideal_high) / 2
    span = max(ideal_high - ideal_lo, 1)

    if ideal_lo <= value <= ideal_high:
        deviation = abs(value - mid) / (span / 2)
        pct = round(92 - deviation * 12, 1)
        status = "Optimal"
    elif value < ideal_lo:
        pct = round(max(28, 75 - ((ideal_lo - value) / max(ideal_lo, 1)) * 45), 1)
        status = "Low"
    else:
        pct = round(max(28, 75 - ((value - ideal_high) / max(ideal_high, 1)) * 45), 1)
        status = "High"

    display = f"{round(value, 1)}{unit}" if unit else str(round(value, 1))
    return {
        "label": label,
        "status": status,
        "pct": pct,
        "value": round(value, 1),
        "display": display,
    }


def analyze_soil(data: dict) -> list[dict]:
    """Return soil/climate indicators derived from actual input values."""
    return [
        _param_analysis(data["N"], 40, 90, "Nitrogen (N)", " ppm"),
        _param_analysis(data["P"], 25, 55, "Phosphorous (P)", " ppm"),
        _param_analysis(data["K"], 25, 55, "Potassium (K)", " ppm"),
        _param_analysis(data["ph"], 5.5, 7.5, "Soil pH", ""),
        _param_analysis(data["temperature"], 18, 32, "Temperature", "°C"),
        _param_analysis(data["humidity"], 50, 85, "Humidity", "%"),
        _param_analysis(data["rainfall"], 100, 300, "Rainfall", " mm"),
    ]


def infer_climate_season(temperature: float, rainfall: float) -> str:
    if rainfall >= 180 and temperature >= 24:
        return "Kharif (Monsoon)"
    if temperature <= 22 and rainfall < 130:
        return "Rabi (Winter)"
    if temperature >= 28 and rainfall < 150:
        return "Summer / Zaid"
    return "Transitional / Multi-season"


def _season_fit_score(crop_season: str, climate_season: str) -> int:
    crop = crop_season.lower()
    climate = climate_season.lower()

    if "year" in crop or "perennial" in crop:
        return 95
    if "kharif" in climate and "kharif" in crop:
        return 92
    if "rabi" in climate and "rabi" in crop:
        return 92
    if ("summer" in climate or "zaid" in climate) and "summer" in crop:
        return 88
    if "/" in crop or "multi" in climate:
        return 78
    return 58


def predict(data: dict) -> dict:
    model = _load_model()
    metrics = get_metrics()
    start = time.perf_counter()

    features_df = pd.DataFrame([[data[col] for col in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)
    crop = model.predict(features_df)[0]
    probabilities = model.predict_proba(features_df)[0]
    classes = model.classes_
    confidence = float(max(probabilities) * 100)

    elapsed_ms = round((time.perf_counter() - start) * 1000, 1)
    crop_details = get_crop_info(crop)
    analysis = analyze_soil(data)
    climate_season = infer_climate_season(data["temperature"], data["rainfall"])

    ranked = sorted(zip(classes, probabilities), key=lambda x: x[1], reverse=True)

    min_prob = 2.0
    suitable = [(c, p) for c, p in ranked if float(p) * 100 >= min_prob]
    if len(suitable) < 6:
        suitable = ranked[:6]

    suitable_crops = []
    for crop_key, prob in suitable[:8]:
        info = get_crop_info(crop_key)
        ml_conf = round(float(prob) * 100, 1)
        season_fit = _season_fit_score(info["season"], climate_season)
        combined = round(ml_conf * 0.75 + season_fit * 0.25, 1)

        suitable_crops.append(
            {
                "crop": info["name"],
                "crop_key": crop_key,
                "confidence": ml_conf,
                "combined_score": combined,
                "season_fit": season_fit,
                "season": info["season"],
                "suitable_season": info["season"],
                "climate_season": climate_season,
                "water": info["water"],
                "soil": info["soil"],
                "expected_yield": info["yield"],
                "description": info["description"],
                "growing_tips": info.get("growing_tips", ""),
                "rank": len(suitable_crops) + 1,
                "is_primary": crop_key == crop,
            }
        )

    suitable_crops.sort(key=lambda x: x["combined_score"], reverse=True)
    primary_entry = next((x for x in suitable_crops if x["is_primary"]), suitable_crops[0])
    others = [x for x in suitable_crops if x is not primary_entry]
    others.sort(key=lambda x: x["combined_score"], reverse=True)
    suitable_crops = [primary_entry] + others
    for i, item in enumerate(suitable_crops, start=1):
        item["rank"] = i
        item["is_primary"] = item is primary_entry

    return {
        "crop": crop_details["name"],
        "crop_key": crop,
        "confidence": round(confidence, 1),
        "prediction_time_ms": elapsed_ms,
        "season": crop_details["season"],
        "climate_season": climate_season,
        "recommended_season": f"{crop_details['season']} · Current climate: {climate_season}",
        "water": crop_details["water"],
        "soil": crop_details["soil"],
        "expected_yield": crop_details["yield"],
        "description": crop_details["description"],
        "analysis": analysis,
        "suitable_crops": suitable_crops,
        "growing_tips": crop_details.get("growing_tips", ""),
        "suitability_score": round(sum(a["pct"] for a in analysis) / len(analysis), 1),
        "model_name": metrics.get("model", "RandomForestClassifier"),
        "model_accuracy": metrics.get("accuracy", 0),
        "model_estimators": metrics.get("n_estimators", 200),
        "location": data.get("location", {}),
        "inputs": {k: data[k] for k in FEATURE_COLUMNS},
    }
