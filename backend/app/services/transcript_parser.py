import re

TIMESTAMPED_LINE = re.compile(
    r"^\[(?P<timestamp>\d{1,2}:\d{2}(?::\d{2})?)\]\s*"
    r"(?P<speaker>[^:]+):\s*(?P<text>.+)$"
)


def timestamp_to_seconds(timestamp: str) -> int:
    values = [int(value) for value in timestamp.split(":")]

    if len(values) == 2:
        minutes, seconds = values
        return (minutes * 60) + seconds

    hours, minutes, seconds = values
    return (hours * 3600) + (minutes * 60) + seconds


def parse_transcript(content: str) -> list[dict]:
    parsed_segments = []

    for line in content.splitlines():
        cleaned_line = line.strip()

        if not cleaned_line:
            continue

        match = TIMESTAMPED_LINE.match(cleaned_line)

        if match is None:
            parsed_segments.append(
                {
                    "speaker_name": "Unknown Speaker",
                    "start_time": None,
                    "text": cleaned_line,
                }
            )
            continue

        parsed_segments.append(
            {
                "speaker_name": match.group("speaker").strip(),
                "start_time": timestamp_to_seconds(match.group("timestamp")),
                "text": match.group("text").strip(),
            }
        )

    timestamp_cursor = 0

    for index, segment in enumerate(parsed_segments):
        if segment["start_time"] is None:
            segment["start_time"] = timestamp_cursor

        if index < len(parsed_segments) - 1:
            next_start_time = parsed_segments[index + 1]["start_time"]
            segment["end_time"] = (
                next_start_time
                if next_start_time is not None
                else segment["start_time"] + 20
            )
        else:
            segment["end_time"] = segment["start_time"] + 20

        timestamp_cursor = segment["end_time"]

    return parsed_segments