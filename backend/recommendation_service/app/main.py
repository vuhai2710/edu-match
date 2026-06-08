from datetime import datetime, timezone

from fastapi import FastAPI

from app.recommender import rank_tutors
from app.schemas import RecommendationRequest, RecommendationResponse


app = FastAPI(
    title="EduMatch Recommendation API",
    version="1.0.0",
    description="Content-based tutor recommendation service using TF-IDF and cosine similarity.",
)


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/recommendations/tutors", response_model=RecommendationResponse)
def recommend_tutors(payload: RecommendationRequest) -> RecommendationResponse:
    return RecommendationResponse(
        generatedAtUtc=datetime.now(timezone.utc),
        recommendations=rank_tutors(payload),
    )

