from datetime import datetime, timezone
import logging
import time

from fastapi import FastAPI

from app.recommender import rank_tutors
from app.schemas import RecommendationRequest, RecommendationResponse


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("edumatch.recommendation")


def format_recommendation_table(
    payload: RecommendationRequest,
    student_id: int,
    candidate_count: int,
    ranking_limit: int,
    elapsed_ms: float,
    recommendations: list,
) -> str:
    candidate_lookup = {candidate.tutor_id: candidate for candidate in payload.candidates}
    lines = [
        "",
        "================ RECOMMENDATION EVALUATION ================",
        f"StudentId      : {student_id}",
        f"GradeLevel     : {payload.student.grade_level or '-'}",
        f"SubjectIds     : {payload.student.subject_ids or '-'}",
        f"SubjectNames   : {', '.join(payload.student.subject_names) or '-'}",
        f"SearchTerm     : {payload.student.search_term or '-'}",
        f"HistoryTexts   : {len(payload.student.learning_request_texts)}",
        f"Candidates     : {candidate_count}",
        f"RankingLimit   : {ranking_limit}",
        f"ElapsedMs      : {elapsed_ms}",
        "+------+---------+------------+------------------------------+----------------------+----------------------+",
        "| Rank | TutorId | Similarity | Subjects                     | Levels               | Major                |",
        "+------+---------+------------+------------------------------+----------------------+----------------------+",
    ]

    if not recommendations:
        lines.append("|  -   |   -     |    -       | -                            | -                    | -                    |")
    else:
        for rank, item in enumerate(recommendations[:3], start=1):
            candidate = candidate_lookup.get(item.tutor_id)
            subjects = truncate(", ".join(candidate.subject_names) if candidate else "-", 28)
            levels = truncate(", ".join(candidate.teaching_levels) if candidate else "-", 20)
            major = truncate(candidate.major if candidate else "-", 20)
            lines.append(
                f"| {rank:<4} | {item.tutor_id:<7} | {item.similarity:<10.6f} "
                f"| {subjects:<28} | {levels:<20} | {major:<20} |"
            )

    lines.extend(
        [
            "+------+---------+------------+------------------------------+----------------------+----------------------+",
            "===========================================================",
        ]
    )
    return "\n".join(lines)


def truncate(value: str | None, max_length: int) -> str:
    text = value or "-"
    if len(text) <= max_length:
        return text
    return text[: max_length - 3] + "..."


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
    started = time.perf_counter()
    candidate_count = len(payload.candidates)
    logger.info(
        "recommendation_started studentId=%s candidates=%s rankingLimit=%s gradeLevel=%s subjectIds=%s searchTerm=%r",
        payload.student.student_id,
        candidate_count,
        payload.ranking_limit,
        payload.student.grade_level,
        payload.student.subject_ids,
        payload.student.search_term,
    )

    recommendations = rank_tutors(payload)
    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
    top_results = [
        {"tutorId": item.tutor_id, "similarity": item.similarity}
        for item in recommendations[:3]
    ]
    logger.info(
        "recommendation_completed studentId=%s candidates=%s results=%s elapsedMs=%s",
        payload.student.student_id,
        candidate_count,
        top_results,
        elapsed_ms,
    )
    logger.info(
        format_recommendation_table(
            payload,
            payload.student.student_id,
            candidate_count,
            payload.ranking_limit,
            elapsed_ms,
            recommendations,
        )
    )

    return RecommendationResponse(
        generatedAtUtc=datetime.now(timezone.utc),
        recommendations=recommendations,
    )
