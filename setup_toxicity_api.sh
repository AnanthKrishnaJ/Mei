#!/bin/bash

# 1. Create Directory Structure
echo "🚀 Initializing Project Structure..."
mkdir -p toxicity_api/app
cd toxicity_api

# 2. Create Requirements File
# We use 'optimum' and 'onnxruntime' for 3x faster CPU inference (critical for gaming)
echo "📦 Creating requirements.txt..."
cat << 'EOF' > requirements.txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
torch==2.1.2 --index-url https://download.pytorch.org/whl/cpu
transformers==4.36.2
optimum[onnxruntime]==1.16.1
python-dotenv==1.0.0
emoji==2.10.0
langdetect==1.0.9
numpy==1.26.3
EOF

# 3. Create Application Logic (The "Brain")
# This file handles the AI model loading and inference
echo "🧠 Creating app/engine.py..."
cat << 'EOF' > app/engine.py
import time
import numpy as np
from scipy.special import softmax
from langdetect import detect, LangDetectException
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

class ToxicityEngine:
    def __init__(self):
        # We use a multilingual model optimized for toxicity
        # Supports: English, French, Spanish, Italian, Portuguese, Turkish, Russian
        self.model_name = "unitary/multilingual-toxic-xlm-roberta"
        
        print(f"Loading Model: {self.model_name}...")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
        
        # Optimization: Quantize dynamic layers for faster CPU inference
        self.model = torch.quantization.quantize_dynamic(
            self.model, {torch.nn.Linear}, dtype=torch.qint8
        )
        self.model.eval()
        print("✅ Model Loaded & Optimized")

        # Mapping raw model output to required gaming categories
        self.mapping = {
            "toxic": "Toxic",
            "severe_toxic": "Severe Toxic",
            "identity_hate": "Hate Speech",
            "insult": "Harassment",
            "threat": "Threat",
            "obscene": "Toxic"
        }

    def analyze(self, text: str):
        start = time.time()
        
        # 1. Language Detection
        try:
            lang = detect(text)
        except:
            lang = "unknown"

        # 2. Inference
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
        with torch.no_grad():
            logits = self.model(**inputs).logits
            probs = softmax(logits.numpy()[0])

        # 3. Score Calculation
        # The model config gives us the label names (e.g., id2label)
        id2label = self.model.config.id2label
        max_idx = np.argmax(probs)
        confidence = float(probs[max_idx])
        raw_label = id2label[max_idx]
        
        # Threshold logic
        if confidence < 0.50:
            label = "Clean"
        else:
            label = self.mapping.get(raw_label, "Toxic")

        latency = (time.time() - start) * 1000

        return {
            "toxicity_score": round(confidence, 4),
            "label": label,
            "language": lang,
            "confidence": round(confidence, 4),
            "latency_ms": round(latency, 2)
        }

# Singleton instance
engine = ToxicityEngine()
EOF

# 4. Create Utilities (Slang/Emoji Cleaning)
echo "🧹 Creating app/utils.py..."
cat << 'EOF' > app/utils.py
import emoji
import re

def preprocess_text(text: str) -> str:
    if not text: return ""
    
    # Convert emojis to text so the model understands the sentiment
    # e.g., "🖕" -> ":middle_finger:"
    text = emoji.demojize(text, delimiters=(" ", " "))
    
    # Normalize gaming abbreviations (optional but helpful)
    # This prevents false positives on game terms like "kill" vs "kill yourself"
    # (The BERT model context usually handles this, but cleaning helps)
    text = re.sub(r'\s+', ' ', text).strip()
    return text
EOF

# 5. Create API Server (FastAPI)
echo "🌐 Creating app/main.py..."
cat << 'EOF' > app/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.engine import engine
from app.utils import preprocess_text
import os

app = FastAPI(title="Gaming Toxicity Detection API")

class ChatMessage(BaseModel):
    message: str

@app.get("/")
def health():
    return {"status": "online", "system": "ready"}

@app.post("/analyze")
async def analyze_chat(payload: ChatMessage):
    if not payload.message:
        return {"label": "Clean", "score": 0.0}
    
    # 1. Clean
    clean_text = preprocess_text(payload.message)
    
    # 2. Predict
    try:
        result = engine.analyze(clean_text)
        return result
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Inference failed")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
EOF

# 6. Create Dockerfile (For Cloud Run / Render)
echo "🐳 Creating Dockerfile..."
cat << 'EOF' > Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the model during build to speed up cold starts
# This prevents the server from hanging on the first request
RUN python -c "from transformers import AutoTokenizer, AutoModelForSequenceClassification; m='unitary/multilingual-toxic-xlm-roberta'; AutoTokenizer.from_pretrained(m); AutoModelForSequenceClassification.from_pretrained(m)"

# Copy Code
COPY app app/

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
EOF

echo "✅ Project 'toxicity_api' created successfully!"
echo "👉 To run locally: cd toxicity_api && pip install -r requirements.txt && python -m app.main"
