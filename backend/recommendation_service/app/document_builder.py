from app.schemas import RecommendationCandidate, RecommendationStudent
from app.text_normalization import normalize_text, slugify_token


def map_grade_to_level_token(grade: str | None) -> str | None:
    if not grade:
        return None

    mapping = {
        "Grade0": "level_preschool",
        "Grade1": "level_primary",
        "Grade2": "level_primary",
        "Grade3": "level_primary",
        "Grade4": "level_primary",
        "Grade5": "level_primary",
        "Grade6": "level_secondary",
        "Grade7": "level_secondary",
        "Grade8": "level_secondary",
        "Grade9": "level_secondary",
        "Grade10": "level_highschool",
        "Grade11": "level_highschool",
        "Grade12": "level_highschool",
        "University": "level_university",
    }
    return mapping.get(grade)


def map_teaching_level_token(level: str | None) -> str | None:
    mapping = {
        "Preschool": "level_preschool",
        "PrimarySchool": "level_primary",
        "SecondarySchool": "level_secondary",
        "HighSchool": "level_highschool",
        "College": "level_college",
        "University": "level_university",
    }
    return mapping.get(level or "")


def build_student_document(student: RecommendationStudent) -> str:
    parts: list[str] = []

    level_token = map_grade_to_level_token(student.grade_level)
    if level_token:
        parts.append(level_token)

    for subject_name in student.subject_names:
        subject_slug = slugify_token(subject_name)
        if subject_slug:
            parts.append(f"subject_{subject_slug}")
            parts.append(subject_slug)

    for text in student.learning_request_texts:
        normalized = normalize_text(text)
        if normalized:
            parts.append(normalized)

    search_term = normalize_text(student.search_term)
    if search_term:
        parts.append(search_term)

    return "\n".join(parts)


def build_tutor_document(candidate: RecommendationCandidate) -> str:
    parts: list[str] = []

    for subject_name in candidate.subject_names:
        subject_slug = slugify_token(subject_name)
        if subject_slug:
            parts.append(f"subject_{subject_slug}")
            parts.append(subject_slug)

    for level in candidate.teaching_levels:
        level_token = map_teaching_level_token(level)
        if level_token:
            parts.append(level_token)

    major_slug = slugify_token(candidate.major)
    if major_slug:
        parts.append(f"major_{major_slug}")

    for text in (candidate.major, candidate.profile, candidate.school):
        normalized = normalize_text(text)
        if normalized:
            parts.append(normalized)

    return "\n".join(parts)

