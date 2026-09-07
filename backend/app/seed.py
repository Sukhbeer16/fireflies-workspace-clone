from datetime import datetime

from app.database import SessionLocal
from app.models import ActionItem, Meeting, Participant, Topic, TranscriptSegment


def seed_database() -> None:
    db = SessionLocal()

    try:
        if db.query(Meeting).count() > 0:
            return

        roadmap = Meeting(
            title="Product Roadmap Planning",
            meeting_date=datetime(2026, 9, 4, 10, 0),
            duration_seconds=1860,
            summary=(
                "The team aligned on the Q4 roadmap. The main priority is the "
                "collaboration launch, followed by analytics improvements. "
                "The group agreed to validate the onboarding flow with users "
                "before committing to the final release scope."
            ),
            notes=(
                "Decisions: prioritize collaboration for Q4; run five user "
                "tests before the design freeze; use the existing analytics "
                "pipeline rather than rebuilding it."
            ),
            keywords="roadmap, collaboration, analytics, onboarding, Q4",
            participants=[
                Participant(name="Sarah Chen", email="sarah@example.com"),
                Participant(name="Alex Morgan", email="alex@example.com"),
                Participant(name="Priya Shah", email="priya@example.com"),
            ],
            transcript_segments=[
                TranscriptSegment(
                    speaker_name="Sarah Chen",
                    start_time=0,
                    end_time=18,
                    text="Thanks for joining. Today we need to align on the Q4 product roadmap.",
                    sequence=1,
                ),
                TranscriptSegment(
                    speaker_name="Alex Morgan",
                    start_time=18,
                    end_time=43,
                    text="The collaboration workspace is ready for design review and should be our top priority.",
                    sequence=2,
                ),
                TranscriptSegment(
                    speaker_name="Priya Shah",
                    start_time=43,
                    end_time=67,
                    text="I agree, but we should validate the onboarding steps with customers before we lock scope.",
                    sequence=3,
                ),
                TranscriptSegment(
                    speaker_name="Sarah Chen",
                    start_time=67,
                    end_time=93,
                    text="Let us schedule five usability sessions next week and use the feedback in the design freeze.",
                    sequence=4,
                ),
                TranscriptSegment(
                    speaker_name="Alex Morgan",
                    start_time=93,
                    end_time=121,
                    text="For analytics, I recommend extending our current event pipeline instead of rebuilding it.",
                    sequence=5,
                ),
                TranscriptSegment(
                    speaker_name="Priya Shah",
                    start_time=121,
                    end_time=149,
                    text="That keeps engineering effort lower and gives us more time for the collaboration launch.",
                    sequence=6,
                ),
                TranscriptSegment(
                    speaker_name="Sarah Chen",
                    start_time=149,
                    end_time=180,
                    text="Great. Alex owns the technical plan, and Priya will coordinate the customer sessions.",
                    sequence=7,
                ),
            ],
            action_items=[
                ActionItem(
                    text="Prepare the collaboration workspace technical plan.",
                    assignee="Alex Morgan",
                ),
                ActionItem(
                    text="Schedule five onboarding usability sessions.",
                    assignee="Priya Shah",
                ),
                ActionItem(
                    text="Share the final Q4 roadmap after design review.",
                    assignee="Sarah Chen",
                ),
            ],
            topics=[
                Topic(
                    title="Q4 roadmap priorities",
                    description="Agreement on collaboration as the primary launch.",
                    start_time=0,
                ),
                Topic(
                    title="Onboarding validation",
                    description="Customer testing before the design freeze.",
                    start_time=43,
                ),
                Topic(
                    title="Analytics implementation",
                    description="Extend the current event pipeline.",
                    start_time=93,
                ),
            ],
        )

        sprint_review = Meeting(
            title="Engineering Sprint Review",
            meeting_date=datetime(2026, 9, 2, 15, 30),
            duration_seconds=1440,
            summary=(
                "Engineering completed the authentication refresh and reduced "
                "page-load time on the meeting library. The remaining blocker "
                "is a flaky integration test in the notification service."
            ),
            notes=(
                "Decision: release the authentication refresh after the "
                "notification integration test is stable."
            ),
            keywords="sprint, authentication, performance, notifications",
            participants=[
                Participant(name="Alex Morgan", email="alex@example.com"),
                Participant(name="Jordan Lee", email="jordan@example.com"),
            ],
            transcript_segments=[
                TranscriptSegment(
                    speaker_name="Alex Morgan",
                    start_time=0,
                    end_time=22,
                    text="The authentication refresh is complete and passed the staging smoke tests.",
                    sequence=1,
                ),
                TranscriptSegment(
                    speaker_name="Jordan Lee",
                    start_time=22,
                    end_time=46,
                    text="The meeting library load time improved by thirty percent after query optimization.",
                    sequence=2,
                ),
                TranscriptSegment(
                    speaker_name="Alex Morgan",
                    start_time=46,
                    end_time=70,
                    text="The only blocker is a flaky integration test in the notification service.",
                    sequence=3,
                ),
                TranscriptSegment(
                    speaker_name="Jordan Lee",
                    start_time=70,
                    end_time=96,
                    text="I will investigate the test fixture and report back before tomorrow morning.",
                    sequence=4,
                ),
                TranscriptSegment(
                    speaker_name="Alex Morgan",
                    start_time=96,
                    end_time=122,
                    text="Once that is stable, we can release the authentication refresh.",
                    sequence=5,
                ),
            ],
            action_items=[
                ActionItem(
                    text="Investigate the flaky notification integration test.",
                    assignee="Jordan Lee",
                ),
                ActionItem(
                    text="Release authentication refresh after test stabilization.",
                    assignee="Alex Morgan",
                ),
            ],
            topics=[
                Topic(title="Authentication refresh", start_time=0),
                Topic(title="Meeting library performance", start_time=22),
                Topic(title="Notification test blocker", start_time=46),
            ],
        )

        discovery_call = Meeting(
            title="Customer Discovery Call — Acme",
            meeting_date=datetime(2026, 8, 29, 11, 0),
            duration_seconds=2100,
            summary=(
                "Acme's operations team spends too much time manually finding "
                "decisions and follow-ups after internal calls. They value "
                "searchable transcripts, assigned action items, and a concise "
                "weekly recap."
            ),
            notes=(
                "Opportunity: validate a weekly recap workflow. Acme requested "
                "a follow-up demo focused on transcript search and task ownership."
            ),
            keywords="customer discovery, transcripts, action items, recap",
            participants=[
                Participant(name="Sarah Chen", email="sarah@example.com"),
                Participant(name="Maya Patel", email="maya@acme.com"),
            ],
            transcript_segments=[
                TranscriptSegment(
                    speaker_name="Sarah Chen",
                    start_time=0,
                    end_time=25,
                    text="Could you describe what happens after one of your internal meetings ends?",
                    sequence=1,
                ),
                TranscriptSegment(
                    speaker_name="Maya Patel",
                    start_time=25,
                    end_time=55,
                    text="We have notes in different places, and decisions are difficult to find a week later.",
                    sequence=2,
                ),
                TranscriptSegment(
                    speaker_name="Sarah Chen",
                    start_time=55,
                    end_time=83,
                    text="Would searchable transcripts and timestamped summaries solve part of that problem?",
                    sequence=3,
                ),
                TranscriptSegment(
                    speaker_name="Maya Patel",
                    start_time=83,
                    end_time=114,
                    text="Yes, especially if action items have owners and our managers can see a weekly recap.",
                    sequence=4,
                ),
                TranscriptSegment(
                    speaker_name="Sarah Chen",
                    start_time=114,
                    end_time=144,
                    text="I will prepare a follow-up demo focused on transcript search and task ownership.",
                    sequence=5,
                ),
            ],
            action_items=[
                ActionItem(
                    text="Prepare Acme demo for transcript search and task ownership.",
                    assignee="Sarah Chen",
                ),
                ActionItem(
                    text="Share sample weekly recap requirements.",
                    assignee="Maya Patel",
                ),
            ],
            topics=[
                Topic(title="Current note-taking workflow", start_time=0),
                Topic(title="Searchable transcript needs", start_time=55),
                Topic(title="Weekly recap opportunity", start_time=83),
            ],
        )

        db.add_all([roadmap, sprint_review, discovery_call])
        db.commit()

    finally:
        db.close()