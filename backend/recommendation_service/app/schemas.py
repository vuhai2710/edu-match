from datetime import datetime

from pydantic import BaseModel, Field


class RecommendationStudent(BaseModel):
    student_id: int = Field(alias="studentId")
    grade_level: str | None = Field(default=None, alias="gradeLevel")
    subject_ids: list[int] = Field(default_factory=list, alias="subjectIds")
    subject_names: list[str] = Field(default_factory=list, alias="subjectNames")
    learning_request_texts: list[str] = Field(default_factory=list, alias="learningRequestTexts")
    search_term: str | None = Field(default=None, alias="searchTerm")


class RecommendationCandidate(BaseModel):
    tutor_id: int = Field(alias="tutorId")
    subject_ids: list[int] = Field(default_factory=list, alias="subjectIds")
    subject_names: list[str] = Field(default_factory=list, alias="subjectNames")
    teaching_levels: list[str] = Field(default_factory=list, alias="teachingLevels")
    major: str | None = None
    profile: str | None = None
    school: str | None = None


class RecommendationRequest(BaseModel):
    student: RecommendationStudent
    candidates: list[RecommendationCandidate] = Field(default_factory=list)
    ranking_limit: int = Field(default=50, ge=1, le=500, alias="rankingLimit")


class TutorRecommendation(BaseModel):
    tutor_id: int = Field(alias="tutorId")
    similarity: float


class RecommendationResponse(BaseModel):
    generated_at_utc: datetime = Field(alias="generatedAtUtc")
    recommendations: list[TutorRecommendation]

