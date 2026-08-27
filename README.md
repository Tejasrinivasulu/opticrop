<div align="center">

# 🌾 OptiCrop

### AI-Powered Crop Recommendation for Smarter Farming

<p>
Analyze Soil • Fetch Live Weather • Get Crop Insights • Download PDF Reports
</p>

![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![Random Forest](https://img.shields.io/badge/Random_Forest-99.55%25-success?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)

<br>

<img src="https://readme-typing-svg.demolab.com?font=Poppins&weight=700&size=24&pause=1000&color=22C55E&center=true&vCenter=true&width=900&lines=From+Soil+Signal+to+the+Right+Crop;Live+Weather+%2B+Soil+Analysis;AI+Powered+Crop+Recommendations;Download+Farmer-Ready+PDF+Reports;Built+for+Smarter+Agriculture">

</div>

---

# 📖 About OptiCrop

OptiCrop is an AI-powered crop recommendation platform that helps farmers and agronomists choose the right crop using soil nutrients (N, P, K, pH), live weather data, and a trained Random Forest model. With a guided prediction wizard, transparent insights, and PDF report export, OptiCrop turns field data into clear, actionable farming decisions.

---

# ✨ Key Features

## 🏠 Landing Experience

| Module | Description |
|----------|-------------|
| 🏠 Home | Hero introduction and quick get-started actions |
| 🔄 Workflow | Step-by-step crop prediction wizard |
| 📊 Prediction | Manual soil & climate input with live results |
| 📘 Documentation | Architecture, APIs, and usage guides |
| ℹ️ About | Mission, vision, and product purpose |

---

## 🌾 Prediction Workflow

| Module | Description |
|----------|-------------|
| 📍 Location Search | Search village / city and auto-fill location |
| ☁️ Live Weather | Fetch temperature, humidity, and rainfall |
| 📄 Soil Upload | Upload soil report and parse key nutrients |
| 🤖 AI Prediction | Random Forest crop recommendation |
| 📈 Insights | Confidence scores, season fit, soil analysis |
| 📥 PDF Reports | Download farmer-ready recommendation reports |

---

# 🛠 Technology Stack

| Category | Technology |
|------------|------------|
| Backend | Flask 3 |
| Language | Python 3.11 |
| ML Model | Scikit-learn Random Forest |
| Frontend | HTML, CSS, Bootstrap 5 |
| Charts / UI | Custom CSS + Bootstrap Icons |
| PDF | ReportLab |
| Model Storage | joblib (`.pkl`) |
| Data Handling | NumPy, Pandas |
| Deploy | Render / Railway / PythonAnywhere |

---

# 📂 Project Structure

```bash
opticrop-main/
│
├── ml/
│   ├── predictor.py          # Prediction & input validation
│   ├── crop_info.py          # Crop metadata & insights
│   ├── location_weather.py   # Location search & live weather
│   └── soil_upload.py        # Soil report parsing
│
├── models/
│   ├── random_forest.pkl     # Pre-trained Random Forest model
│   └── metrics.json          # Accuracy & training metrics
│
├── templates/
│   ├── index.html            # Landing / dashboard
│   ├── workflow.html         # Prediction wizard
│   ├── prediction.html       # Manual prediction form
│   ├── about.html
│   └── documentation.html
│
├── static/
│   ├── css/
│   ├── js/
│   └── images/
│
├── scripts/
│   └── dev.js
│
├── app.py                    # Flask routes & APIs
├── train_model.py            # Verify / retrain model
├── requirements.txt
├── railway.json
├── render.yaml
├── Procfile
└── README.md
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/your-username/opticrop.git
```

## Open Project

```bash
cd opticrop-main
```

## Create Virtual Environment

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### macOS / Linux

```bash
source venv/bin/activate
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

## (Optional) Verify Model

```bash
python train_model.py
```

## Run Development Server

```bash
python app.py
```

Application runs on:

```bash
http://localhost:5000
```

---

# 🔑 Sample Prediction Inputs

```text
N (Nitrogen):        90
P (Phosphorus):      42
K (Potassium):       43
Temperature (°C):    25
Humidity (%):        80
pH:                  6.5
Rainfall (mm):       200
```

---

# 🔄 User Workflow

<div align="center">

```text
Open OptiCrop Dashboard
 ↓
Start Crop Prediction Wizard
 ↓
Search Location → Fetch Live Weather
 ↓
Upload Soil Report (or enter NPK / pH manually)
 ↓
Run AI Crop Recommendation
 ↓
View Top Crops + Confidence + Season Fit
 ↓
Download PDF Report
```

</div>

---

# 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/predict` | Get crop recommendation |
| `POST` | `/api/predict/pdf` | Download PDF report |
| `POST` | `/api/weather/live` | Fetch live weather by coordinates |
| `GET` | `/api/locations/search` | Search locations |
| `POST` | `/api/upload-soil` | Parse uploaded soil report |
| `GET` | `/api/health` | Model status and accuracy |

### Example Predict Payload

```json
{
  "N": 90,
  "P": 42,
  "K": 43,
  "temperature": 25,
  "humidity": 80,
  "ph": 6.5,
  "rainfall": 200
}
```

---

# 🤖 Model Highlights

| Metric | Value |
|--------|--------|
| Algorithm | Random Forest Classifier |
| Accuracy | **99.55%** |
| Crops Supported | 22 |
| Training Samples | 2,200 |
| Estimators | 200 |
| Features | N, P, K, temperature, humidity, pH, rainfall |

---

# 🌐 Deployment

## Render

```bash
pip install -r requirements.txt
gunicorn app:app
```

### Render Deploy

https://dashboard.render.com

Build command: `pip install -r requirements.txt`  
Start command: `gunicorn app:app`

`render.yaml` is already included.

---

## Railway

```bash
gunicorn app:app --bind 0.0.0.0:$PORT
```

### Railway Deploy

https://railway.app

`railway.json` is already included.

Automatic deployment supported through GitHub.

---

## PythonAnywhere

1. Upload project files  
2. Install requirements  
3. Point WSGI to `app.py`

---

# 💬 Quote

> “The right crop in the right soil doesn’t just grow better — it changes livelihoods.”

---

<div align="center">

# 🌾 OptiCrop

### AI Crop Recommendation Platform for Smarter Agriculture

### Accurate • Transparent • Field-Ready • Farmer-Friendly

Made with ❤️ OptiCrop

⭐ Star this Repository if you like the project ⭐

</div>
