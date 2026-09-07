from datetime import date, datetime, time
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, status, UploadFile
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload
from app.services.transcript_parser import parse_transcript
from app.database import get_db
from app.models import ActionItem, Meeting, Participant, Topic, TranscriptSegment

from app.schemas import (
    ActionItemCreate,
    ActionItemResponse,
    ActionItemUpdate,
    MeetingCreate,
    MeetingDetail,
    MeetingListItem,
    MeetingUpdate,
    ParticipantCreate,
    ParticipantResponse,
    TranscriptSegmentCreate,
    TranscriptSegmentResponse,
    TranscriptPasteRequest,
    TranscriptSegmentUpdate,
)

router = APIRouter(prefix="/api/meetings", tags=["Meetings"])


def get_meeting_or_404(db: Session, meeting_id: int) -> Meeting:
    statement = (
        select(Meeting)
        .where(Meeting.id == meeting_id)
        .options(
            selectinload(Meeting.participants),
            selectinload(Meeting.transcript_segments),
            selectinload(Meeting.action_items),
            selectinload(Meeting.topics),
        )
    )

    meeting = db.scalar(statement)

    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return meeting

def generate_mock_insights(meeting: Meeting) -> dict:
    segments = meeting.transcript_segments

    if not segments:
        raise ValueError("A transcript is required to generate insights")

    first_discussion = " ".join(segment.text for segment in segments[:3])

    action_items = []
    action_phrases = ("i will", "we need to", "should", "must", "follow up")

    for segment in segments:
        normalized_text = segment.text.lower()

        if any(phrase in normalized_text for phrase in action_phrases):
            action_items.append(
                {
                    "text": segment.text,
                    "assignee": segment.speaker_name,
                }
            )

    if not action_items:
        action_items.append(
            {
                "text": "Review this meeting and confirm the next steps.",
                "assignee": segments[0].speaker_name,
            }
        )

    topics = []

    for index in range(0, len(segments), 3):
        segment = segments[index]
        title = segment.text[:55].rstrip()

        if len(segment.text) > 55:
            title += "…"

        topics.append(
            {
                "title": title,
                "description": segment.text,
                "start_time": segment.start_time,
            }
        )

    participant_names = ", ".join(
        participant.name for participant in meeting.participants
    )

    return {
        "summary": (
            f"{meeting.title} included {participant_names}. "
            f"The main discussion covered: {first_discussion}"
        ),
        "notes": (
            "These insights are generated from the saved transcript using a "
            "deterministic mock AI workflow for this assignment."
        ),
        "keywords": "meeting, discussion, priorities, decisions, next steps",
        "action_items": action_items,
        "topics": topics,
    }


@router.get("", response_model=list[MeetingListItem])
def list_meetings(
    search: str | None = Query(default=None, min_length=1),
    participant: str | None = Query(default=None, min_length=1),
    status_filter: str | None = Query(default=None, alias="status"),
    date_from: date | None = None,
    date_to: date | None = None,
    sort: Literal["recent", "oldest", "title"] = "recent",
    db: Session = Depends(get_db),
):
    statement = select(Meeting).options(selectinload(Meeting.participants))

    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Meeting.title.ilike(pattern),
                Meeting.participants.any(Participant.name.ilike(pattern)),
            )
        )

    if participant:
        participant_pattern = f"%{participant.strip()}%"
        statement = statement.where(
            Meeting.participants.any(Participant.name.ilike(participant_pattern))
        )

    if status_filter:
        statement = statement.where(Meeting.status == status_filter)

    if date_from:
        statement = statement.where(
            Meeting.meeting_date >= datetime.combine(date_from, time.min)
        )

    if date_to:
        statement = statement.where(
            Meeting.meeting_date <= datetime.combine(date_to, time.max)
        )

    if sort == "oldest":
        statement = statement.order_by(Meeting.meeting_date.asc())
    elif sort == "title":
        statement = statement.order_by(Meeting.title.asc())
    else:
        statement = statement.order_by(Meeting.meeting_date.desc())

    return db.scalars(statement).all()

@router.post("", response_model=MeetingDetail, status_code=status.HTTP_201_CREATED)
def create_meeting(meeting_data: MeetingCreate, db: Session = Depends(get_db)):
    meeting_fields = meeting_data.model_dump(
        exclude={
            "participants",
            "transcript_segments",
            "action_items",
            "topics",
        }
    )
    meeting = Meeting(**meeting_fields)

    for participant in meeting_data.participants:
        meeting.participants.append(Participant(**participant.model_dump()))

    for segment in meeting_data.transcript_segments:
        meeting.transcript_segments.append(TranscriptSegment(**segment.model_dump()))

    for action_item in meeting_data.action_items:
        meeting.action_items.append(ActionItem(**action_item.model_dump()))

    for topic in meeting_data.topics:
        

        meeting.topics.append(Topic(**topic.model_dump()))

    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    return get_meeting_or_404(db, meeting.id)


@router.get("/{meeting_id}", response_model=MeetingDetail)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    return get_meeting_or_404(db, meeting_id)


@router.patch("/{meeting_id}", response_model=MeetingDetail)
def update_meeting(
    meeting_id: int,
    meeting_data: MeetingUpdate,
    db: Session = Depends(get_db),
):
    meeting = get_meeting_or_404(db, meeting_id)

    for field, value in meeting_data.model_dump(exclude_unset=True).items():
        setattr(meeting, field, value)

    db.commit()
    db.refresh(meeting)

    return get_meeting_or_404(db, meeting.id)


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = get_meeting_or_404(db, meeting_id)

    db.delete(meeting)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{meeting_id}/participants", response_model=list[ParticipantResponse])
def replace_participants(
    meeting_id: int,
    participants: list[ParticipantCreate],
    db: Session = Depends(get_db),
):
    meeting = get_meeting_or_404(db, meeting_id)

    meeting.participants.clear()

    for participant in participants:
        meeting.participants.append(Participant(**participant.model_dump()))

    db.commit()
    db.refresh(meeting)

    return meeting.participants



def save_parsed_transcript(
    meeting: Meeting,
    parsed_segments: list[dict],
    replace: bool,
    db: Session,
) -> list[TranscriptSegment]:
    if replace:
        meeting.transcript_segments.clear()
        sequence_offset = 0
    else:
        sequence_offset = max(
            (segment.sequence for segment in meeting.transcript_segments),
            default=0,
        )

    for sequence, segment in enumerate(parsed_segments, start=1):
        meeting.transcript_segments.append(
            TranscriptSegment(
                speaker_name=segment["speaker_name"],
                start_time=segment["start_time"],
                end_time=segment["end_time"],
                text=segment["text"],
                sequence=sequence_offset + sequence,
            )
        )

    meeting.duration_seconds = max(
        meeting.duration_seconds,
        max(segment["end_time"] for segment in parsed_segments),
    )

    db.commit()
    db.refresh(meeting)

    return sorted(
        meeting.transcript_segments,
        key=lambda segment: segment.sequence,
    )

@router.post(
    "/{meeting_id}/transcript-segments",
    response_model=TranscriptSegmentResponse,
    status_code=status.HTTP_201_CREATED,
)


def add_transcript_segment(
    meeting_id: int,
    segment_data: TranscriptSegmentCreate,
    db: Session = Depends(get_db),
):
    get_meeting_or_404(db, meeting_id)

    if segment_data.end_time < segment_data.start_time:
        raise HTTPException(
            status_code=422,
            detail="end_time must be greater than or equal to start_time",
        )

    segment = TranscriptSegment(
        meeting_id=meeting_id,
        **segment_data.model_dump(),
    )
    db.add(segment)
    db.commit()
    db.refresh(segment)

    return segment

@router.post(
    "/{meeting_id}/import-transcript",
    response_model=list[TranscriptSegmentResponse],
)
@router.post(
    "/{meeting_id}/paste-transcript",
    response_model=list[TranscriptSegmentResponse],
)
def paste_transcript(
    meeting_id: int,
    transcript_data: TranscriptPasteRequest,
    db: Session = Depends(get_db),
):
    meeting = get_meeting_or_404(db, meeting_id)

    parsed_segments = parse_transcript(transcript_data.content)

    if not parsed_segments:
        raise HTTPException(
            status_code=422,
            detail="The pasted transcript did not contain readable content",
        )

    return save_parsed_transcript(
        meeting=meeting,
        parsed_segments=parsed_segments,
        replace=transcript_data.replace,
        db=db,
    )


@router.post(
    "/{meeting_id}/generate-insights",
    response_model=MeetingDetail,
)
def generate_insights(
    meeting_id: int,
    db: Session = Depends(get_db),
):
    meeting = get_meeting_or_404(db, meeting_id)

    try:
        insights = generate_mock_insights(meeting)

        meeting.summary = insights["summary"]
        meeting.notes = insights["notes"]
        meeting.keywords = insights["keywords"]
        meeting.action_items.clear()
        meeting.topics.clear()

        for action_item in insights["action_items"]:
            meeting.action_items.append(
                ActionItem(
                    text=action_item["text"],
                    assignee=action_item["assignee"],
                )
            )

        for topic in insights["topics"]:
            meeting.topics.append(
                Topic(
                    title=topic["title"],
                    description=topic["description"],
                    start_time=topic["start_time"],
                )
            )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


    db.commit()
    db.refresh(meeting)

    return get_meeting_or_404(db, meeting.id)


@router.patch(
    "/{meeting_id}/transcript-segments/{segment_id}",
    response_model=TranscriptSegmentResponse,
)
def update_transcript_segment(
    meeting_id: int,
    segment_id: int,
    segment_data: TranscriptSegmentUpdate,
    db: Session = Depends(get_db),
):
    get_meeting_or_404(db, meeting_id)

    segment = db.get(TranscriptSegment, segment_id)

    if segment is None or segment.meeting_id != meeting_id:
        raise HTTPException(status_code=404, detail="Transcript segment not found")

    updates = segment_data.model_dump(exclude_unset=True)

    proposed_start_time = updates.get("start_time", segment.start_time)
    proposed_end_time = updates.get("end_time", segment.end_time)

    if proposed_end_time < proposed_start_time:
        raise HTTPException(
            status_code=422,
            detail="end_time must be greater than or equal to start_time",
        )

    for field, value in updates.items():
        setattr(segment, field, value)

    db.commit()
    db.refresh(segment)

    return segment


@router.delete(
    "/{meeting_id}/transcript-segments/{segment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_transcript_segment(
    meeting_id: int,
    segment_id: int,
    db: Session = Depends(get_db),
):
    get_meeting_or_404(db, meeting_id)

    segment = db.get(TranscriptSegment, segment_id)

    if segment is None or segment.meeting_id != meeting_id:
        raise HTTPException(status_code=404, detail="Transcript segment not found")

    db.delete(segment)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)

async def import_transcript(
    meeting_id: int,
    transcript_file: UploadFile = File(...),
    replace: bool = Query(default=True),
    db: Session = Depends(get_db),
):
    meeting = get_meeting_or_404(db, meeting_id)

    if not transcript_file.filename or not transcript_file.filename.endswith(".txt"):
        raise HTTPException(
            status_code=400,
            detail="Only .txt transcript files are supported",
        )

    content = (await transcript_file.read()).decode("utf-8")
    parsed_segments = parse_transcript(content)

    if not parsed_segments:
        raise HTTPException(
            status_code=422,
            detail="The transcript file did not contain readable content",
        )

        return save_parsed_transcript(
        meeting=meeting,
        parsed_segments=parsed_segments,
        replace=replace,
        db=db,
    )

    for sequence, segment in enumerate(parsed_segments, start=1):
        meeting.transcript_segments.append(
            TranscriptSegment(
                speaker_name=segment["speaker_name"],
                start_time=segment["start_time"],
                end_time=segment["end_time"],
                text=segment["text"],
                sequence=sequence,
            )
        )

    meeting.duration_seconds = max(
        segment["end_time"]
        for segment in parsed_segments
    )

    db.commit()
    db.refresh(meeting)

    return meeting.transcript_segments


@router.post(
    "/{meeting_id}/action-items",
    response_model=ActionItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_action_item(
    meeting_id: int,
    action_item_data: ActionItemCreate,
    db: Session = Depends(get_db),
):
    get_meeting_or_404(db, meeting_id)

    action_item = ActionItem(
        meeting_id=meeting_id,
        **action_item_data.model_dump(),
    )
    db.add(action_item)
    db.commit()
    db.refresh(action_item)

    return action_item


@router.patch("/action-items/{action_item_id}", response_model=ActionItemResponse)
def update_action_item(
    action_item_id: int,
    action_item_data: ActionItemUpdate,
    db: Session = Depends(get_db),
):
    action_item = db.get(ActionItem, action_item_id)

    if action_item is None:
        raise HTTPException(status_code=404, detail="Action item not found")

    for field, value in action_item_data.model_dump(exclude_unset=True).items():
        setattr(action_item, field, value)

    db.commit()
    db.refresh(action_item)

    return action_item


@router.delete(
    "/action-items/{action_item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_action_item(action_item_id: int, db: Session = Depends(get_db)):
    action_item = db.get(ActionItem, action_item_id)

    if action_item is None:
        raise HTTPException(status_code=404, detail="Action item not found")

    db.delete(action_item)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)