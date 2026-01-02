from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parent
CONTENT_DIR = ROOT_DIR / "scraped_content"
STRUCTURE_SCRAPED_FILE = CONTENT_DIR / "course_structure_scraped.json"
SCRAPE_REPORT_FILE = CONTENT_DIR / "scrape_report.json"
COURSE_STRUCTURE_FILE = ROOT_DIR / "course_structure.json"
DB_DIR = CONTENT_DIR / "db"


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _strip_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def _normalize_title(text: str) -> str:
    text = (text or "").replace("\r\n", "\n")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _module_number(module_id: str) -> int:
    match = re.search(r"(\d+)", module_id or "")
    return int(match.group(1)) if match else 10**12


def _to_content_relative_path(local_path: str | None) -> str | None:
    if not local_path:
        return None

    path_str = local_path.replace("\\", "/")

    # Common case from scrape_report.json: "scraped_content/pages/xyz.html"
    marker = "scraped_content/"
    if marker in path_str:
        path_str = path_str.split(marker, 1)[1]

    return path_str.lstrip("/")


def _contains_trac_nghiem(title: str) -> bool:
    simplified = _strip_accents(title).casefold()
    return "trac nghiem" in simplified or "trắc nghiệm" in title.casefold()


class _ParagraphExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._in_p = False
        self._in_u = False
        self._current_text: list[str] = []
        self._current_underlined: list[str] = []
        self.paragraphs: list[dict[str, Any]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "p":
            self._in_p = True
            self._current_text = []
            self._current_underlined = []
        elif tag.lower() == "u" and self._in_p:
            self._in_u = True

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "u":
            self._in_u = False
        elif tag.lower() == "p":
            if self._in_p:
                raw_text = "".join(self._current_text)
                raw_underlined = "".join(self._current_underlined)

                text = _normalize_title(raw_text)
                underlined = _normalize_title(raw_underlined)

                self.paragraphs.append({"text": text, "underlined": underlined})

            self._in_p = False
            self._in_u = False

    def handle_data(self, data: str) -> None:
        if not self._in_p:
            return
        self._current_text.append(data)
        if self._in_u:
            self._current_underlined.append(data)


def _extract_paragraphs(html_text: str) -> list[dict[str, Any]]:
    parser = _ParagraphExtractor()
    parser.feed(html_text)
    parser.close()
    return parser.paragraphs


def _parse_trac_nghiem_questions(html_text: str) -> list[dict[str, Any]]:
    """Parse Moodle 'page' HTML export into structured multiple-choice questions.

    Assumptions based on scraped pages in this repo:
    - Questions start with 'Câu N:'
    - Options start with 'A.'/'B.'/'C.'/'D.'
    - Correct option label is underlined (e.g. <u>C.</u>)
    """

    paragraphs = _extract_paragraphs(html_text)

    def is_question_start(text: str) -> re.Match[str] | None:
        # Handle both 'Câu' and 'Cau'
        simplified = _strip_accents(text)
        return re.match(r"^Cau\s*(\d+)\s*:\s*(.*)$", simplified, flags=re.IGNORECASE)

    def option_match(text: str) -> re.Match[str] | None:
        return re.match(r"^([A-D])\.\s*(.*)$", text.strip(), flags=re.IGNORECASE)

    questions: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    current_option: str | None = None

    for p in paragraphs:
        text = (p.get("text") or "").strip()
        underlined = (p.get("underlined") or "").strip()

        # Skip empty / noise paragraphs
        if not text:
            continue
        if text.isdigit():
            # Some pages contain stray page numbers like '21'
            continue

        qmatch = is_question_start(text)
        if qmatch:
            if current:
                questions.append(current)

            number = int(qmatch.group(1))
            # We need the original (possibly accented) prompt, so derive prompt from original text
            # by removing the leading 'Câu N:' segment (accent-safe-ish)
            prompt = re.sub(r"^C\s*\u00e2u\s*\d+\s*:\s*", "", text, flags=re.IGNORECASE)
            if prompt == text:
                # fallback if the above doesn't match due to encoding differences
                prompt = text.split(":", 1)[1].strip() if ":" in text else ""

            current = {
                "number": number,
                "prompt": _normalize_title(prompt),
                "options": {},
                "correct": None,
            }
            current_option = None
            continue

        if current is None:
            continue

        omatch = option_match(text)
        if omatch:
            letter = omatch.group(1).upper()
            rest = _normalize_title(omatch.group(2))
            current["options"][letter] = rest
            current_option = letter

            simplified_underlined = _strip_accents(underlined).upper().replace(" ", "")
            if letter + "." in simplified_underlined or simplified_underlined == (letter + "."):
                current["correct"] = letter
            continue

        # Continuation line: append to prompt or current option
        if current_option and current_option in current["options"]:
            current["options"][current_option] = _normalize_title(
                f"{current['options'][current_option]} {text}".strip()
            )
        else:
            current["prompt"] = _normalize_title(f"{current['prompt']} {text}".strip())

    if current:
        questions.append(current)

    # If a question lacks a 'correct' but has exactly one option label underlined elsewhere,
    # we could attempt to infer, but keep it conservative.
    return questions


@dataclass(frozen=True)
class Activity:
    id: str
    name: str
    type: str
    url: str | None
    section_id: str
    section_name: str
    local_path: str | None
    status: str
    available_local: bool
    tags: list[str]


def generate_db() -> dict[str, Any]:
    if not STRUCTURE_SCRAPED_FILE.exists():
        raise FileNotFoundError(f"Missing {STRUCTURE_SCRAPED_FILE}")

    structure = _read_json(STRUCTURE_SCRAPED_FILE)

    report_by_id: dict[str, dict[str, Any]] = {}
    if SCRAPE_REPORT_FILE.exists():
        report_items = _read_json(SCRAPE_REPORT_FILE)
        if isinstance(report_items, list):
            report_by_id = {str(item.get("id")): item for item in report_items if isinstance(item, dict)}

    course_info: dict[str, Any] = {}
    if COURSE_STRUCTURE_FILE.exists():
        try:
            raw = _read_json(COURSE_STRUCTURE_FILE)
            course_info = {
                "name": raw.get("courseName"),
                "url": raw.get("courseUrl"),
            }
        except Exception:
            course_info = {}

    activities: dict[str, Activity] = {}
    sections_out: list[dict[str, Any]] = []

    for section in structure:
        section_id = str(section.get("id") or "")
        section_name = _normalize_title(str(section.get("name") or ""))

        activity_ids: list[str] = []
        for act in section.get("activities", []) or []:
            activity_id = str(act.get("id") or "")
            activity_name = _normalize_title(str(act.get("name") or ""))
            activity_type = str(act.get("type") or "unknown")
            activity_url = act.get("url")

            report_item = report_by_id.get(activity_id, {})
            status = str(report_item.get("status") or "unknown")
            local_path = _to_content_relative_path(report_item.get("local_path"))

            available_local = False
            if local_path:
                available_local = (CONTENT_DIR / local_path).exists()

            tags: list[str] = []
            if activity_type == "quiz":
                tags.append("quiz")
            if _contains_trac_nghiem(activity_name):
                tags.append("trac_nghiem")

            activity = Activity(
                id=activity_id,
                name=activity_name,
                type=activity_type,
                url=str(activity_url) if activity_url else None,
                section_id=section_id,
                section_name=section_name,
                local_path=local_path,
                status=status,
                available_local=available_local,
                tags=tags,
            )

            activities[activity_id] = activity
            activity_ids.append(activity_id)

        sections_out.append(
            {
                "id": section_id,
                "name": section_name,
                "activityIds": activity_ids,
            }
        )

    # Stable ordering for indexes
    all_ids_sorted = sorted(activities.keys(), key=_module_number)

    by_type: dict[str, list[str]] = {}
    trac_nghiem_ids: list[str] = []
    available_local_ids: list[str] = []

    for activity_id in all_ids_sorted:
        activity = activities[activity_id]
        by_type.setdefault(activity.type, []).append(activity_id)
        if "trac_nghiem" in activity.tags:
            trac_nghiem_ids.append(activity_id)
        if activity.available_local:
            available_local_ids.append(activity_id)

    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    return {
        "schemaVersion": 1,
        "generatedAt": generated_at,
        "course": course_info,
        "sections": sections_out,
        "activities": {
            activity_id: {
                "id": a.id,
                "name": a.name,
                "type": a.type,
                "url": a.url,
                "sectionId": a.section_id,
                "sectionName": a.section_name,
                "localPath": a.local_path,
                "status": a.status,
                "availableLocal": a.available_local,
                "tags": a.tags,
            }
            for activity_id, a in activities.items()
        },
        "indexes": {
            "allActivityIds": all_ids_sorted,
            "byType": by_type,
            "tracNghiemActivityIds": trac_nghiem_ids,
            "availableLocalActivityIds": available_local_ids,
        },
    }


def main() -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)

    site_db = generate_db()

    site_db_path = DB_DIR / "site_db.json"
    site_db_path.write_text(
        json.dumps(site_db, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # Convenience subset for “trắc nghiệm” pages
    trac_nghiem_ids = site_db.get("indexes", {}).get("tracNghiemActivityIds", [])
    activities = site_db.get("activities", {})
    trac_nghiem_db = {
        "schemaVersion": 1,
        "generatedAt": site_db.get("generatedAt"),
        "activityIds": trac_nghiem_ids,
        "activities": [activities.get(activity_id) for activity_id in trac_nghiem_ids],
    }

    trac_nghiem_path = DB_DIR / "trac_nghiem.json"
    trac_nghiem_path.write_text(
        json.dumps(trac_nghiem_db, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # Extract full question database for 'trắc nghiệm' pages (no HTML loading in frontend)
    questions_out: list[dict[str, Any]] = []
    sources_out: list[dict[str, Any]] = []
    by_activity_id: dict[str, list[str]] = {}

    for activity_id in trac_nghiem_ids:
        activity = activities.get(activity_id)
        if not activity:
            continue

        local_path = activity.get("localPath")
        if not local_path:
            continue
        html_path = CONTENT_DIR / local_path
        if not html_path.exists():
            continue

        html_text = html_path.read_text(encoding="utf-8", errors="replace")
        parsed_questions = _parse_trac_nghiem_questions(html_text)

        source = {
            "activityId": activity_id,
            "name": activity.get("name"),
            "sectionName": activity.get("sectionName"),
            "localPath": local_path,
            "questionCount": len(parsed_questions),
        }
        sources_out.append(source)

        for q in parsed_questions:
            qid = f"{activity_id}-q{q.get('number')}"
            by_activity_id.setdefault(activity_id, []).append(qid)
            questions_out.append(
                {
                    "id": qid,
                    "activityId": activity_id,
                    "number": q.get("number"),
                    "prompt": q.get("prompt"),
                    "options": q.get("options"),
                    "correct": q.get("correct"),
                }
            )

    trac_nghiem_questions_db = {
        "schemaVersion": 1,
        "generatedAt": site_db.get("generatedAt"),
        "sources": sources_out,
        "questions": questions_out,
        "indexes": {
            "questionIds": [q["id"] for q in questions_out],
            "byActivityId": by_activity_id,
        },
    }

    trac_nghiem_questions_path = DB_DIR / "trac_nghiem_questions.json"
    trac_nghiem_questions_path.write_text(
        json.dumps(trac_nghiem_questions_db, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"✓ Wrote {site_db_path}")
    print(f"✓ Wrote {trac_nghiem_path}")
    print(f"✓ Wrote {trac_nghiem_questions_path}")


if __name__ == "__main__":
    main()
