import re
import unicodedata


def normalize_text(value: str | None) -> str:
    if not value:
        return ""

    text = unicodedata.normalize("NFC", value)
    text = text.lower().strip()
    return re.sub(r"\s+", " ", text)


def slugify_token(value: str | None) -> str:
    text = normalize_text(value)
    if not text:
        return ""

    text = unicodedata.normalize("NFD", text)
    text = "".join(char for char in text if unicodedata.category(char) != "Mn")
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_")

