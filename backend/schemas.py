from pydantic import BaseModel, Field
from typing import List

class Character(BaseModel):
    name: str
    visual_description: str = Field(..., description="Physical appearance")
    personality: str

class Panel(BaseModel):
    panel_index: int
    narrative_description: str = Field(..., description="Story action")
    visual_prompt: str = Field(..., description="Image generation prompt")
    negative_prompt: str = Field(..., description="What to avoid") # No default here
    camera_angle: str = Field(..., description="Camera angle")

class Scene(BaseModel):
    scene_index: int
    location: str
    mood: str
    panels: List[Panel]

class StoryAnalysis(BaseModel):
    title: str
    characters: List[Character]
    scenes: List[Scene]

class AnalysisRequest(BaseModel):
    text: str
    art_style: str = "manhwa"

class ImageGenRequest(BaseModel):
    prompt: str
    aspect_ratio: str = "16:9"