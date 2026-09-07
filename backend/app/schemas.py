from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ParticipantCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    email: str | None = None


class ParticipantResponse(ParticipantCreate):
    id: int
    meeting_id: int

    model_config = ConfigDict(from_attributes=True)


class TranscriptSegmentCreate(BaseModel):
    speaker_name: str = Field(min_length=1, max_length=150)
    start_time: int = Field(ge=0)
    end_time: int = Field(ge=0)
    text: str = Field(min_length=1)
    sequence: int = Field(ge=0)


class TranscriptSegmentResponse(TranscriptSegmentCreate):
    id: int
    meeting_id: int

    model_config = ConfigDict(from_attributes=True)


class ActionItemCreate(BaseModel):
    text: str = Field(min_length=1)
    assignee: str | None = None
    due_date: datetime | None = None


class ActionItemUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=1)
    assignee: str | None = None
    due_date: datetime | None = None
    is_completed: bool | None = None


class ActionItemResponse(ActionItemCreate):
    id: int
    meeting_id: int
    is_completed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TopicCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    start_time: int = Field(default=0, ge=0)


class TopicResponse(TopicCreate):
    id: int
    meeting_id: int

    model_config = ConfigDict(from_attributes=True)


class MeetingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    meeting_date: datetime
    duration_seconds: int = Field(default=0, ge=0)
    summary: str | None = None
    notes: str | None = None
    keywords: str | None = None
    status: str = "completed"
    source: str = "manual"
    participants: list[ParticipantCreate] = []
    transcript_segments: list[TranscriptSegmentCreate] = []
    action_items: list[ActionItemCreate] = []
    topics: list[TopicCreate] = []


class MeetingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    meeting_date: datetime | None = None
    duration_seconds: int | None = Field(default=None, ge=0)
    summary: str | None = None
    notes: str | None = None
    keywords: str | None = None
    status: str | None = None


class MeetingListItem(BaseModel):
    id: int
    title: str
    meeting_date: datetime
    duration_seconds: int
    status: str
    source: str
    participants: list[ParticipantResponse]

    model_config = ConfigDict(from_attributes=True)


class MeetingDetail(MeetingListItem):
    summary: str | None
    notes: str | None
    keywords: str | None
    created_at: datetime
    updated_at: datetime
    transcript_segments: list[TranscriptSegmentResponse]
    action_items: list[ActionItemResponse]
    topics: list[TopicResponse]


class TranscriptSegmentUpdate(BaseModel):
    speaker_name: str | None = Field(default=None, min_length=1, max_length=150)
    start_time: int | None = Field(default=None, ge=0)
    end_time: int | None = Field(default=None, ge=0)
    text: str | None = Field(default=None, min_length=1)
    sequence: int | None = Field(default=None, ge=0)


class TranscriptPasteRequest(BaseModel):
    content: str = Field(min_length=1)
    replace: bool = True
