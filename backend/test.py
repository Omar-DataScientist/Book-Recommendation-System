from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import google.generativeai as genai
from typing import Optional, List
import os
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GEMINI_API_KEY = ""  
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

class BookRequest(BaseModel):
    query: str
    genre: Optional[str] = None
    min_rating: float = 4.0

class ChatRequest(BaseModel):
    message: str

class Book(BaseModel):
    title: str
    author: str
    year: str
    rating: float
    description: str
    match_reason: str

@app.post("/api/books/recommend")
async def get_recommendations(request: BookRequest):
    try:
        prompt = f"""Generate exactly 4 book recommendations based on these criteria:
        - Search query: {request.query}
        - Genre: {request.genre if request.genre else 'any'}
        - Minimum rating: {request.min_rating}

        Return ONLY a JSON array like this, with NO other text:
        [
            {{
                "title": "Example Book",
                "author": "Author Name",
                "year": "2020",
                "rating": 4.5,
                "description": "Brief description of the book",
                "match_reason": "Why this matches the search"
            }}
        ]"""

        response = model.generate_content(prompt)
        
        try:
            # Print the raw response for debugging
            print("Raw Gemini response:", response.text)
            
            # Clean the response text to ensure it's valid JSON
            cleaned_text = response.text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text.replace("```json", "").replace("```", "")
            
            recommendations = json.loads(cleaned_text)
            
            # Validate the structure
            if not isinstance(recommendations, list):
                raise ValueError("Response is not a list")
                
            for book in recommendations:
                if not all(key in book for key in ["title", "author", "year", "rating", "description", "match_reason"]):
                    raise ValueError("Book missing required fields")
            
            return {"recommendations": recommendations}
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Attempted to parse: {cleaned_text}")
            return {"error": "Failed to parse recommendations. Please try again."}
            
    except Exception as e:
        print(f"Error in get_recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/books/chat")
async def chat(request: ChatRequest):
    try:
        # Construct the prompt for Gemini
        prompt = f"""You are a knowledgeable and friendly book recommendation assistant. 
        The user's message is: {request.message}
        
        Provide a helpful response about books, reading, or recommendations."""

        response = model.generate_content(prompt)
        return {"response": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
