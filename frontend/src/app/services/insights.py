import re
from collections import Counter

from app.models import ActionItem, Meeting, Topic

STOP_WORDS = {
    "the",
    "and",
    "that",
    "this",
    "with",
    "from",
    "will",
    "have",
    "need",
    "for",
    "are",
    "was",
    "but",
    "into",
    "they",
    "their",
    "our",
    "you",
}


def generate_mock_insights(meeting: Meeting) -> None:
    segments = meeting.transcript_segments

    if not segments:
        raise ValueError("A transcript is required to generate insights")

    discussion_points = " ".join(segment.text for segment in segments[:3])

    participant_names = ", ".join(
        participant.name for participant in meeting.participants
    )

    meeting.summary = (
        f"This {meeting.title.lower()} involved {participant_names}. "
        f"The main discussion covered: {discussion_points}"
    )

    meeting.notes = (
        "This summary was generated with a deterministic mock insight engine "
        "from the saved transcript. In production, this step would call an LLM "
        "after transcription has completed."
    )

    words = re.findall(
        r"[a-zA-Z]{4,}",
        " ".join(segment.text.lower() for segment in segments),
    )
    frequent_words = [
        word
        for word, _ in Counter(words).most_common(12)
        if word not in STOP_WORDS
    ]
    meeting.keywords = ", ".join(frequent_words[:5])

    meeting.action_items.clear()
    meeting.topics.clear()

    action_words = ("will ", "need to ", "should ", "must ", "follow up")

    for segment in segments:
        normalized_text = segment.text.lower()

        if any(action_word in normalized_text for action_word in action_words):
            meeting.action_items.append(
                ActionItem(
                    text=segment.text,
                    assignee=segment.speaker_name,
                )
            )

    if not meeting.action_items:
        meeting.action_items.append(
            ActionItem(
                text="Review the meeting summary and confirm next steps.",
                assignee=segments[0].speaker_name,
            )
        )

    for index in range(0, len(segments), 3):
        segment = segments[index]
        title = segment.text[:55].rstrip()

        if len(segment.text) > 55:
            title += "…"

        meeting.topics.append(
            Topic(
                title=title,
                description=segment.text,
                start_time=segment.start_time,
            )
        )