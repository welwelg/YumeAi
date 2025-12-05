from dotenv import load_dotenv
import os

# 1. Load Env Vars
load_dotenv()

# 2. Import FastAPI and CORS
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from schemas import AnalysisRequest, ImageGenRequest, StoryAnalysis
from llm_service import analyze_chapter_text, generate_panel_image

app = FastAPI(title="YUMEAI Backend")

# 3. CONFIGURE CORS (The Fix for 405 Error)
# This tells the backend: "It is okay to accept requests from localhost:3000"
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
)

@app.get("/")
def health_check():
    return {"status": "YumeAI Backend is running", "stack": "Google GenAI v1.0"}

@app.post("/api/analyze", response_model=StoryAnalysis)
async def api_analyze_text(request: AnalysisRequest):
    """
    Step 1: Convert Text -> Structured Storyboard
    """
    try:
        # Pass the request to the LLM service
        result = analyze_chapter_text(request.text, request.art_style)
        return result
    except Exception as e:
        print(f"Error during analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-image")
async def api_generate_image(request: ImageGenRequest):
    """
    Step 2: Convert Prompt -> Image (Base64)
    """
    try:
        image_b64 = generate_panel_image(request.prompt, request.aspect_ratio)
        return {"image_url": image_b64}
    except Exception as e:
        print(f"Error during image gen: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)