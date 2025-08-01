from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import joblib
import pandas as pd
from datetime import datetime

# Load the trained model and movie features
model = joblib.load('movie_recommender_model.pkl')
movie_features = pd.read_csv("movie_features.csv")

app = FastAPI(title="Movie Similarity API")


# Add CORS middleware to allow requests from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,  # Allow credentials (cookies, etc.)
    allow_methods=['*'],  # Allow all HTTP methods
    allow_headers=['*']  # Allow all headers
)

class MovieIdsRequest(BaseModel):
    movie_ids: List[int]


def find_similar_movies(movie_id, num_neighbors=10):
    # Get the movie row based on tmdbId from movie_features
    movie_row = movie_features[movie_features['tmdbId'] == movie_id]
    if movie_row.empty:
        return None

    # Prepare query features by dropping 'title' and 'tmdbId'
    query_features = movie_row.drop(columns=['title', 'tmdbId'])

    # Transform the query features using the pipeline's preprocessing step
    query_transformed = model.named_steps['columntransformer'].transform(query_features)

    # Retrieve neighbors using the NearestNeighbors model inside the pipeline
    distances, indices = model.named_steps['nearestneighbors'].kneighbors(query_transformed)

    # Remove the queried movie from the neighbors if it's present
    query_index = movie_row.index[0]
    neighbor_info = [
        (idx, dist)
        for idx, dist in zip(indices[0], distances[0])
        if idx != query_index
    ]
    # Sort by distance (ascending)
    neighbor_info = sorted(neighbor_info, key=lambda x: x[1])[:num_neighbors]

    # Build result: list of dicts with tmdbId, title, and distance
    result = []
    for idx, dist in neighbor_info:
        row = movie_features.iloc[idx]
        result.append({
            "tmdbId": int(row['tmdbId']),
            "title": row['title'],
            "distance": float(dist)
        })
    return result


@app.post("/similar")
async def similar_movies_endpoint(request: MovieIdsRequest):
    if not request.movie_ids:
        raise HTTPException(status_code=400, detail="movie_ids list cannot be empty.")
    
    result = {}
    for movie_id in request.movie_ids:
        similar = find_similar_movies(movie_id)
        if similar is None:
            result[movie_id] = {"error": "Movie ID not found."}
        else:
            result[movie_id] = [
                {
                    "id": movie["tmdbId"],
                    "name": movie["title"],
                    "distance": movie["distance"]
                }
                for movie in similar
            ]
    
    return JSONResponse(content=result)

@app.get("/")
async def get_status():
    # Hardcoded created date and time
    created_date = "2023-10-01 10:00:00 📅"
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return JSONResponse(content={
        "status": "working ✅",
        "created_by": "raj neelam gaurav 😎",
        "created_date": created_date,
        "current_date": current_date
    })

@app.get("/list")
async def list_movie_ids():
    # Replace NaN or infinite values in the DataFrame with None
    sanitized_movie_features = movie_features[['tmdbId', 'title', 'average_rating', 'year']].fillna(value={"tmdbId": 0, "title": "Unknown", "rating": 0, "release_year": 0}).replace([float('inf'), float('-inf')], None)
    # Convert the sanitized DataFrame to a list of dictionaries
    movie_list = sanitized_movie_features.to_dict(orient='records')
    return JSONResponse(content=movie_list)
# To run the application:
# uvicorn main:app --reload