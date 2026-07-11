from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
model = joblib.load("models/xgboost_tool_wear.pkl")


class ToolWearInput(BaseModel):
    case: int
    run: int
    time: float
    DOC: float
    feed: float
    material: int
    smcAC_mean: float
    smcDC_mean: float
    vib_table_mean: float
    vib_spindle_mean: float
    AE_table_mean: float
    AE_spindle_mean: float


@app.get("/")
def home():
    return {"message": "Tool Wear Prediction API is running"}


@app.post("/predict")
def predict(data: ToolWearInput):

    features = np.array([[
        data.case,
        data.run,
        data.time,
        data.DOC,
        data.feed,
        data.material,
        data.smcAC_mean,
        data.smcDC_mean,
        data.vib_table_mean,
        data.vib_spindle_mean,
        data.AE_table_mean,
        data.AE_spindle_mean
    ]])

    prediction = model.predict(features)

    return {
        "Predicted Tool Wear (VB)": float(prediction[0])
    }
