import os
import json
import base64
from google import genai
from google.genai import types
from schemas import StoryAnalysis

# Initialize the unified client
client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

def analyze_chapter_text(raw_text: str, art_style: str) -> StoryAnalysis:
    prompt = f"""
    You are an expert storyboard artist for {art_style} comics.
    Analyze the text provided and break it down into scenes and panels.
    
    CRITICAL INSTRUCTION:
    - Identify all main characters and their consistent visual traits.
    - For 'visual_prompt', create a HIGHLY DETAILED prompt suitable for an AI image generator.
    - Start every 'visual_prompt' with the phrase: "{art_style} style, masterpiece, best quality..."
    
    Input Text:
    {raw_text}
    """

    # Model: gemini-2.5-flash
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=StoryAnalysis, 
            temperature=0.7
        )
    )
    
    if response.parsed:
        return response.parsed
    else:
        return StoryAnalysis(**json.loads(response.text))

def generate_panel_image(prompt: str, aspect_ratio: str = "16:9") -> str:
    # FIX: 'generate_images' requires 'GenerateImagesConfig' (Both Plural)
    response = client.models.generate_images(
        model="imagen-4.0-generate-001",
        prompt=prompt,
        config=types.GenerateImagesConfig(
            aspect_ratio=aspect_ratio,
            number_of_images=1,
            include_rai_reason=True
        )
    )

    if response.generated_images:
        image = response.generated_images[0]
        # The SDK returns the image bytes directly
        b64_data = base64.b64encode(image.image.image_bytes).decode('utf-8')
        return f"data:image/jpeg;base64,{b64_data}"
            
    raise Exception("No image generated.")