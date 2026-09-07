# Fireflies Workspace Clone

A full-stack meeting notes platform inspired by Fireflies.ai’s post-meeting workflow.

## Features

- Meeting library with search, participant/date filters, and sorting
- Meeting Notepad with timestamped speaker transcript
- Simulated media player with transcript seek/highlighting
- Transcript search, edit, delete, and TXT download
- Mock AI summary, keywords, action items, and outline
- Meeting CRUD and participant editing
- Persistent SQLite data
- Toast notifications and placeholder settings/integrations

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Python, FastAPI
- Database: SQLite
- ORM: SQLAlchemy
- Validation: Pydantic
- Tests: Pytest

## Architecture

```text
Next.js frontend
      |
      | REST API
      v
FastAPI backend
      |
      | SQLAlchemy
      v
SQLite database
```

## Database Schema

```text
Meeting
├── Participant
├── TranscriptSegment
├── ActionItem
└── Topic
```

- `meetings`: title, date, duration, summary, notes, keywords
- `participants`: attendees belonging to a meeting
- `transcript_segments`: speaker, timestamp range, text, sequence
- `action_items`: task, assignee, due date, completion state
- `topics`: timestamped meeting chapters

Transcript segments are separate records so the app can search, edit, highlight, and seek individual lines.

## Setup

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: `http://127.0.0.1:8000/docs`

### Frontend

```powershell
cd frontend
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

Open `http://localhost:3000`.

## Testing

```powershell
cd backend
pytest -v
```

```powershell
cd frontend
npm run lint
npm run build
```

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/meetings` | List, search, filter, sort meetings |
| POST | `/api/meetings` | Create a meeting |
| GET/PATCH/DELETE | `/api/meetings/{id}` | Read, edit, delete a meeting |
| PUT | `/api/meetings/{id}/participants` | Replace participants |
| POST | `/api/meetings/{id}/paste-transcript` | Save pasted transcript |
| POST | `/api/meetings/{id}/generate-insights` | Generate local mock insights |
| PATCH/DELETE | `/api/meetings/{id}/transcript-segments/{segmentId}` | Manage transcript line |
| POST | `/api/meetings/{id}/action-items` | Add action item |
| PATCH/DELETE | `/api/meetings/action-items/{id}` | Manage action item |

## Assumptions

Real-time bots, actual speech-to-text, integrations, collaboration controls, and authentication are placeholders, as allowed by the assignment. The app assumes one default logged-in user.

AI insights are generated locally from the stored transcript using deterministic rules, so no paid LLM API key is required.