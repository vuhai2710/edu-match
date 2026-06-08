from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.document_builder import build_student_document, build_tutor_document
from app.schemas import RecommendationRequest, TutorRecommendation


def rank_tutors(payload: RecommendationRequest) -> list[TutorRecommendation]:
    candidates = payload.candidates[: payload.ranking_limit]
    if not candidates:
        return []

    student_document = build_student_document(payload.student)
    tutor_documents = [build_tutor_document(candidate) for candidate in candidates]

    if not student_document.strip() or not any(document.strip() for document in tutor_documents):
        return [
            TutorRecommendation(tutorId=candidate.tutor_id, similarity=0.0)
            for candidate in candidates
        ]

    corpus = [student_document, *tutor_documents]
    vectorizer = TfidfVectorizer(
        lowercase=True,
        strip_accents=None,
        ngram_range=(1, 2),
        min_df=1,
        sublinear_tf=True,
    )
    matrix = vectorizer.fit_transform(corpus)
    scores = cosine_similarity(matrix[0:1], matrix[1:])[0]

    ranked = [
        TutorRecommendation(tutorId=candidate.tutor_id, similarity=round(float(score), 6))
        for candidate, score in zip(candidates, scores, strict=True)
    ]
    return sorted(ranked, key=lambda item: (-item.similarity, item.tutor_id))

