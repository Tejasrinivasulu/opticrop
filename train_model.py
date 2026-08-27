"""Train or verify the bundled Random Forest crop recommendation model."""

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATA_PATH = BASE_DIR / "data" / "Crop_recommendation.csv"
MODEL_PATH = BASE_DIR / "models" / "random_forest.pkl"
METRICS_PATH = BASE_DIR / "models" / "metrics.json"

FEATURE_COLUMNS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET_COLUMN = "label"


def load_existing_metrics() -> dict:
    if not METRICS_PATH.exists():
        raise FileNotFoundError(
            f"No metrics found at {METRICS_PATH}. Provide a training dataset with --data-path."
        )
    with open(METRICS_PATH, encoding="utf-8") as f:
        return json.load(f)


def train(data_path: Path) -> dict:
    df = pd.read_csv(data_path)
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=2,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    metrics = {
        "accuracy": round(accuracy * 100, 2),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "total_samples": len(df),
        "num_crops": int(y.nunique()),
        "model": "RandomForestClassifier",
        "n_estimators": 200,
        "features": FEATURE_COLUMNS,
        "classification_report": classification_report(y_test, y_pred, output_dict=True),
    }

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"Model saved to {MODEL_PATH}")
    print(f"Test accuracy: {metrics['accuracy']}%")
    print(f"Training samples: {metrics['training_samples']}")
    return metrics


def verify_pretrained() -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "Pre-trained model missing. Place random_forest.pkl in models/ "
            "or retrain with: python train_model.py --data-path <dataset.csv>"
        )

    metrics = load_existing_metrics()
    print(f"Using pre-trained model at {MODEL_PATH}")
    print(f"Reported accuracy: {metrics.get('accuracy')}%")
    print(f"Crops supported: {metrics.get('num_crops')}")
    return metrics


def main() -> dict:
    parser = argparse.ArgumentParser(description="Train or verify OptiCrop ML model")
    parser.add_argument(
        "--data-path",
        type=Path,
        default=DEFAULT_DATA_PATH,
        help="Optional CSV dataset for retraining (not bundled with the app)",
    )
    args = parser.parse_args()

    if args.data_path.exists():
        return train(args.data_path)

    return verify_pretrained()


if __name__ == "__main__":
    main()
