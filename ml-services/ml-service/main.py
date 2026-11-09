"""
Femora - ML service (general + PCOS in one app)

Run locally:  python -m uvicorn main:app --port 8000 --reload
Docs:         http://localhost:8000/docs

Routes:
  GET  /health
  GET  /general/symptoms
  POST /general/predict
  POST /pcos/predict
"""
from fastapi import FastAPI

from general.router import router as general_router
from pcos.router import router as pcos_router

app = FastAPI(title="Femora ML service")


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(general_router, prefix="/general", tags=["general"])
app.include_router(pcos_router, prefix="/pcos", tags=["pcos"])