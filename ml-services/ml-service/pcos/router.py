"""
Femora - PCOS prediction (router, v2)

This router only does ONE job: turn answers into a model score.
Safety rules (red flags, "unclear" band, saving history) live in Spring Boot.
"""
from pathlib import Path

import joblib
import pandas as pd
from fastapi import APIRouter
from pydantic import BaseModel, Field

BASE = Path(__file__).parent
model = joblib.load(BASE / "pcos_model.pkl")
FEATURES = joblib.load(BASE / "pcos_features.pkl")  # column order used in training
PCOS_INDEX = list(model.classes_).index(1)  # which probability column means "PCOS"

# The training data only covers these ages, so we tell the caller when a
# user is outside the range instead of silently guessing.
TRAIN_AGE_MIN, TRAIN_AGE_MAX = 20, 48

router = APIRouter()


class PcosInput(BaseModel):
    age: int = Field(ge=10, le=80)
    height_cm: float = Field(ge=100, le=220)
    weight_kg: float = Field(ge=25, le=200)
    irregular_cycle: bool
    weight_gain: bool  # unexplained / recent weight gain
    hair_growth: bool  # excess hair on face / chest / back
    skin_darkening: bool  # dark patches on neck, underarms, groin
    hair_loss: bool  # scalp hair thinning
    pimples: bool  # acne / pimples


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/predict")
def predict(body: PcosInput):
    bmi = body.weight_kg / (body.height_cm / 100) ** 2

    row = {
        "age": body.age,
        "bmi": bmi,
        "irregular_cycle": int(body.irregular_cycle),
        "weight_gain": int(body.weight_gain),
        "hair_growth": int(body.hair_growth),
        "skin_darkening": int(body.skin_darkening),
        "hair_loss": int(body.hair_loss),
        "pimples": int(body.pimples),
    }
    X = pd.DataFrame([row])[FEATURES]  # same column order as training

    prob = float(model.predict_proba(X)[0][PCOS_INDEX])

    return {
        "pcos_probability": round(prob, 2),
        "bmi": round(bmi, 1),
        "age_in_training_range": TRAIN_AGE_MIN <= body.age <= TRAIN_AGE_MAX,
        "model_version": "pcos-lr-v2",
    }