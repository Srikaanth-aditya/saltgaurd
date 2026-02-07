from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib
from fastapi.middleware.cors import CORSMiddleware

# -------------------------------
# Load model
# -------------------------------
model = joblib.load("xgb_mortality_model.pkl")
FEATURES = model.feature_names_in_

print("Model loaded. Features:")
print(FEATURES)

# -------------------------------
# Create FastAPI app
# -------------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Input schema
# -------------------------------
class PatientInput(BaseModel):
    age: float
    sodium: float
    creatinine: float
    hemoglobin: float
    wbc: float
    bun: float

# -------------------------------
# Root endpoint
# -------------------------------
@app.get("/")
def home():
    return {"status": "SALTGUARD ML API Running"}

# -------------------------------
# Prediction endpoint
# -------------------------------
@app.post("/predict")
def predict(data: PatientInput):

    age = data.age
    creatinine = data.creatinine
    hb = data.hemoglobin
    na = data.sodium
    wbc = data.wbc
    bun = data.bun

    gender = 1

    # Feature engineering
    bun_creatinine_ratio = bun / creatinine if creatinine > 0 else 0

    renal_dysfunction_flag = 1 if creatinine >= 1.5 else 0
    severe_anemia = 1 if hb < 9 else 0
    hyponatremia = 1 if na < 135 else 0
    severe_hyponatremia = 1 if na < 125 else 0
    leukocytosis = 1 if wbc > 11000 else 0
    elderly_risk = 1 if age >= 65 else 0

    # Build ML input
    model_input = {
        "anchor_age": age,
        "gender": gender,
        "Creatinine": creatinine,
        "Hemoglobin": hb,
        "Sodium": na,
        "Urea Nitrogen": bun,
        "WBC": wbc,
        "bun_creatinine_ratio": bun_creatinine_ratio,
        "renal_dysfunction_flag": renal_dysfunction_flag,
        "severe_anemia": severe_anemia,
        "hyponatremia": hyponatremia,
        "severe_hyponatremia": severe_hyponatremia,
        "leukocytosis": leukocytosis,
        "elderly_risk": elderly_risk
    }

    df = pd.DataFrame([model_input])
    df = df[FEATURES]

    # Predict mortality
    prob = model.predict_proba(df)[0][1]
    mortality_percent = round(float(prob) * 100, 2)

    if mortality_percent > 75:
        mortality_risk = "Very High Risk"
    elif mortality_percent > 50:
        mortality_risk = "High Risk"
    elif mortality_percent > 25:
        mortality_risk = "Moderate Risk"
    else:
        mortality_risk = "Low Risk"

    # Heart risk engine
    heart_score = 0
    reasons = []

    if elderly_risk:
        heart_score += 1
        reasons.append("Advanced age")

    if renal_dysfunction_flag and creatinine >= 2:
        heart_score += 1
        reasons.append("Kidney failure")

    if severe_anemia:
        heart_score += 1
        reasons.append("Low hemoglobin")

    if hyponatremia:
        heart_score += 1
        reasons.append("Low sodium")

    if leukocytosis:
        heart_score += 1
        reasons.append("High WBC (infection)")

    if heart_score >= 4:
        heart_risk = "High"
    elif heart_score >= 2:
        heart_risk = "Moderate"
    else:
        heart_risk = "Low"

    return {
        "mortality_risk": mortality_risk,
        "mortality_probability": mortality_percent,
        "heart_risk": heart_risk,
        "heart_risk_score": heart_score,
        "heart_risk_reasons": reasons,
        "clinical_flags": {
            "renal_dysfunction": bool(renal_dysfunction_flag),
            "severe_anemia": bool(severe_anemia),
            "hyponatremia": bool(hyponatremia),
            "severe_hyponatremia": bool(severe_hyponatremia),
            "leukocytosis": bool(leukocytosis),
            "elderly_risk": bool(elderly_risk)
        }
    }
