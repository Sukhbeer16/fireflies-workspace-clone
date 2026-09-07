from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_meetings_returns_seeded_data():
    response = client.get("/api/meetings")

    assert response.status_code == 200

    meetings = response.json()
    assert len(meetings) >= 3
    assert meetings[0]["title"]
    assert "participants" in meetings[0]


def test_meeting_detail_contains_notepad_content():
    response = client.get("/api/meetings/1")

    assert response.status_code == 200

    meeting = response.json()
    assert meeting["summary"]
    assert len(meeting["transcript_segments"]) > 0
    assert len(meeting["action_items"]) > 0
    assert len(meeting["topics"]) > 0


def test_meeting_search():
    response = client.get("/api/meetings?search=roadmap")

    assert response.status_code == 200

    meetings = response.json()
    assert len(meetings) == 1
    assert meetings[0]["title"] == "Q4 Product Roadmap Planning"


def test_participant_filter():
    response = client.get("/api/meetings?participant=Sarah")

    assert response.status_code == 200

    meetings = response.json()
    assert len(meetings) >= 1

    for meeting in meetings:
        participant_names = [
            participant["name"]
            for participant in meeting["participants"]
        ]
        assert any("sarah" in name.lower() for name in participant_names)


def test_unknown_meeting_returns_404():
    response = client.get("/api/meetings/99999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Meeting not found"}


def test_paste_transcript_replaces_segments():
    response = client.post(
        "/api/meetings/2/paste-transcript",
        json={
            "content": (
                "[00:00] Jordan Lee: We need to review the deployment plan.\n"
                "[00:15] Alex Morgan: I will verify the notification tests."
            ),
            "replace": True,
        },
    )

    assert response.status_code == 200

    segments = response.json()
    assert len(segments) == 2
    assert segments[0]["speaker_name"] == "Jordan Lee"
    assert segments[1]["start_time"] == 15


def test_update_transcript_segment():
    pasted_response = client.post(
        "/api/meetings/2/paste-transcript",
        json={
            "content": "[00:00] Jordan Lee: Original transcript text.",
            "replace": True,
        },
    )
    segment_id = pasted_response.json()[0]["id"]

    response = client.patch(
        f"/api/meetings/2/transcript-segments/{segment_id}",
        json={
            "text": "Corrected transcript text.",
        },
    )

    assert response.status_code == 200
    assert response.json()["text"] == "Corrected transcript text."


def test_delete_transcript_segment():
    pasted_response = client.post(
        "/api/meetings/2/paste-transcript",
        json={
            "content": "[00:00] Jordan Lee: This segment will be deleted.",
            "replace": True,
        },
    )
    segment_id = pasted_response.json()[0]["id"]

    response = client.delete(
        f"/api/meetings/2/transcript-segments/{segment_id}"
    )

    assert response.status_code == 204

    meeting_response = client.get("/api/meetings/2")
    remaining_ids = [
        segment["id"]
        for segment in meeting_response.json()["transcript_segments"]
    ]

    assert segment_id not in remaining_ids