from fastapi import FastAPI
import joblib
import numpy as np

app = FastAPI()

# Load model
model = joblib.load("models/xgboost_tool_wear.pkl")


@app.get("/")
def home():
    return {"message": "Tool Wear Prediction API is running"}


@app.post("/predict")
def predict(
    case: int,
    run: int,
    time: float,
    DOC: float,
    feed: float,
    material: int,
    smcAC_mean: float,
    smcDC_mean: float,
    vib_table_mean: float,
    vib_spindle_mean: float,
    AE_table_mean: float,
    AE_spindle_mean: float,
):

    features = np.array([[
        case,
        run,
        time,
        DOC,
        feed,
        material,
        smcAC_mean,
        smcDC_mean,
        vib_table_mean,
        vib_spindle_mean,
        AE_table_mean,
        AE_spindle_mean
    ]])

    prediction = model.predict(features)

    return {
        "Predicted Tool Wear (VB)": float(prediction[0])
    }
