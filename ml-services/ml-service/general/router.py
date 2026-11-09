"""
Femora - General symptom prediction (router)

One job: turn symptom names into a score per condition group.
Safety rules (red flags, confidence bands, serious conditions, history) live in Spring Boot.
"""
import json
from pathlib import Path

import joblib
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, Field

BASE = Path(__file__).parent
model = joblib.load(BASE / "general_model.pkl")
SYMPTOMS = joblib.load(BASE / "general_symptoms.pkl")  # model columns, ORDER matters
META = json.loads((BASE / "general_meta.json").read_text(encoding="utf-8"))
ALIASES = META["aliases"]  # alias symptom -> model column
GROUPS = META["groups"]    # disease -> group shown to the user

INDEX = {s: i for i, s in enumerate(SYMPTOMS)}
ALL_NAMES = set(SYMPTOMS) | set(ALIASES)

# Typos in the dataset, fixed for display only (the model keeps the original names).
DISPLAY = {
    "Peptic ulcer diseae": "Peptic ulcer disease",
    "Dimorphic hemmorhoids(piles)": "Piles (haemorrhoids)",
    "(vertigo) Paroymsal  Positional Vertigo": "Positional vertigo",
}
LABEL_FIX = {
    "swollen_extremeties": "Swollen extremities",
    "dischromic_patches": "Discoloured patches",
}

GROUP_NAMES = sorted(set(GROUPS.values()))
G_INDEX = {g: i for i, g in enumerate(GROUP_NAMES)}
IND = np.zeros((len(model.classes_), len(GROUP_NAMES)))  # disease -> group
for i, disease in enumerate(model.classes_):
    IND[i, G_INDEX[GROUPS[str(disease)]]] = 1

router = APIRouter()


class GeneralInput(BaseModel):
    symptoms: list[str] = Field(min_length=1, max_length=40)


def label(name: str) -> str:
    return LABEL_FIX.get(name) or name.replace("_", " ").capitalize()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/symptoms")
def symptoms():
    """Everything the user can pick, including the alias symptoms."""
    return [{"name": s, "label": label(s)} for s in sorted(ALL_NAMES)]


@router.post("/predict")
def predict(body: GeneralInput):
    names = [s.strip().lower() for s in body.symptoms]
    unknown = [s for s in names if s not in ALL_NAMES]
    # Aliases (e.g. runny_nose and congestion) are the SAME model column,
    # so they count as one symptom.
    columns = {ALIASES.get(s, s) for s in names if s in ALL_NAMES}

    top = []
    if columns:
        row = np.zeros((1, len(SYMPTOMS)), dtype=np.int8)
        for c in columns:
            row[0, INDEX[c]] = 1
        g = (model.predict_proba(row) @ IND)[0]
        for i in np.argsort(g)[::-1][:3]:
            name = GROUP_NAMES[i]
            top.append({"condition": DISPLAY.get(name, name), "probability": round(float(g[i]), 2)})

    return {
        "distinct_symptoms": len(columns),
        "unknown": unknown,
        "top": top,
        "model_version": "general-rf-v2",
    }