# Fireflies Workspace Clone

A full-stack meeting notes and transcript workspace inspired by the post-meeting Fireflies.ai experience.

The application lets a default user browse a meeting library, open a meeting Notepad, read a timestamped transcript, review mock AI insights, manage action items, and persist all data in SQLite.

## Features

### Meeting library

- Browse seeded and user-created meetings
- View meeting title, date, duration, and participants
- Search meetings by title or participant
- Filter by participant and date range
- Sort by newest, oldest, or title
- Create a meeting by pasting a timestamped transcript

### Meeting Notepad

- Two-panel Fireflies-style workspace
- Mock media-player area with seek bar
- Click transcript timestamps/lines to seek playback
- Active transcript segment highlighting during simulated playback
- Search within transcript with highlighted matches
- AI-style summary, notes, keywords, action items, and outline
- Download transcript as a `.txt` file
- Copy meeting link with the Share button

### CRUD and persistence

- Create meetings
- Rename and delete meetings
- Edit meeting participants
- Add, edit, complete, reopen, and delete action items
- Edit and delete transcript segments
- Persist meetings, participants, transcript segments, topics, and action items in SQLite

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | SQLite |
| ORM | SQLAlchemy |
| Validation | Pydantic |
| Testing | Pytest, FastAPI TestClient |

## Architecture

```text
Next.js frontend
      |
      | REST API requests
      v
FastAPI backend
      |
      | SQLAlchemy ORM
      v
SQLite database
```

The frontend is responsible for UI state and interactions such as transcript seeking, active-line highlighting, search, modals, toasts, and downloads.

FastAPI provides validated REST endpoints. SQLAlchemy maps Python models to SQLite tables and keeps data access separate from the API layer.

## Database Design

```text
Meeting
├── Participant
├── TranscriptSegment
├── ActionItem
└── Topic
```

### `meetings`

Stores meeting metadata and generated insights.

- `id`
- `title`
- `meeting_date`
- `duration_seconds`
- `summary`
- `notes`
- `keywords`
- `status`
- `source`
- `created_at`
- `updated_at`

### `participants`

Stores attendees associated with a meeting.

- `id`
- `meeting_id`
- `name`
- `email`

### `transcript_segments`

Stores independent timestamped transcript lines.

- `id`
- `meeting_id`
- `speaker_name`
- `start_time`
- `end_time`
- `text`
- `sequence`

### `action_items`

Stores meeting tasks independently so completion state can persist.

- `id`
- `meeting_id`
- `text`
- `assignee`
- `due_date`
- `is_completed`
- `created_at`

### `topics`

Stores timestamped outline/chapter entries.

- `id`
- `meeting_id`
- `title`
- `description`
- `start_time`

## Why Transcript Segments Are Separate Records

The application does not store a meeting transcript as one large text blob.

Each segment has its own speaker, timestamps, text, and sequence. This supports:

- Click-to-seek transcript playback
- Active-line highlighting
- Search within a transcript
- Individual transcript edits and deletion
- Future extensions such as comments, highlights, and soundbites

## Local Setup

### Prerequisites

- Python 3.10 or newer
- Node.js 20 or newer
- npm

### Backend

Open a terminal:

```powershell
cd C:\Users\6EIN\Desktop\fireflies.ai\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend URLs:

```text
API:  http://127.0.0.1:8000
Docs: http://127.0.0.1:8000/docs
```

The SQLite database file is created automatically. Seed meetings are inserted only when the database is empty.

### Frontend

Open a second terminal:

```powershell
cd C:\Users\6EIN\Desktop\fireflies.ai\frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

## Running Tests

### Backend tests

```powershell
cd C:\Users\6EIN\Desktop\fireflies.ai\backend
.\.venv\Scripts\Activate.ps1
pytest -v
```

### Frontend checks

```powershell
cd C:\Users\6EIN\Desktop\fireflies.ai\frontend
npm run lint
npm run build
```

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/meetings` | List/search/filter/sort meetings |
| `POST` | `/api/meetings` | Create a meeting |
| `GET` | `/api/meetings/{id}` | Get a complete meeting Notepad payload |
| `PATCH` | `/api/meetings/{id}` | Edit meeting metadata |
| `DELETE` | `/api/meetings/{id}` | Delete meeting and related records |
| `PUT` | `/api/meetings/{id}/participants` | Replace participants |
| `POST` | `/api/meetings/{id}/paste-transcript` | Parse and save pasted transcript text |
| `POST` | `/api/meetings/{id}/generate-insights` | Generate local mock summary/tasks/topics |
| `PATCH` | `/api/meetings/{id}/transcript-segments/{segmentId}` | Edit transcript line |
| `DELETE` | `/api/meetings/{id}/transcript-segments/{segmentId}` | Delete transcript line |
| `POST` | `/api/meetings/{id}/action-items` | Create action item |
| `PATCH` | `/api/meetings/action-items/{id}` | Edit/complete action item |
| `DELETE` | `/api/meetings/action-items/{id}` | Delete action item |

## Mock AI Insight Workflow

Real speech-to-text and paid LLM calls are intentionally out of scope.

Instead, the application uses a deterministic local mock-insight workflow:

```text
Pasted transcript
      |
      v
FastAPI transcript parser
      |
      v
Timestamped SQLite transcript segments
      |
      v
Rule-based insight generator
      |
      v
Summary + keywords + action items + timestamped outline
```

The rule-based generator detects action-oriented phrases such as “I will” and “we need to”, creates action items, and produces outline entries based on transcript timing.

In production, this local step could be replaced by an asynchronous queue worker that calls a transcription provider and an LLM after a meeting finishes.

## Assumptions and Placeholders

The assignment permits these features as placeholders:

- Real-time meeting bot
- Real speech-to-text transcription
- Zoom, Google Meet, calendar, and CRM integrations
- Team collaboration and permission controls
- Real authentication

The project assumes a default logged-in user: `Jordan Davis`.

The app includes “Coming soon” placeholders for non-core navigation/settings features.

## Future Improvements

- Upload `.txt`, `.vtt`, or `.json` transcript files
- Global transcript search across every meeting
- Dark mode
- Comments and highlights on transcript segments
- Real recording/audio synchronization
- Background AI processing with an LLM
- Authentication and team workspaces
- PostgreSQL and object storage for production scale

