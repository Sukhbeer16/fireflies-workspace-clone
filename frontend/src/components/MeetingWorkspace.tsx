"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  createActionItem,
  deleteActionItem,
  deleteMeeting,
  deleteTranscriptSegment,
  getMeeting,
  replaceParticipants,
  updateActionItem,
  updateMeeting,
  updateTranscriptSegment,
} from "@/lib/api";
import type { MeetingDetail } from "@/lib/types";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

function highlightText(text: string, query: string) {
  if (!query.trim()) {
    return text;
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));

  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        className="rounded-sm bg-[#fff0ae] px-0.5 text-inherit"
        key={index}
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export default function MeetingWorkspace({
  meetingId,
}: {
  meetingId: number;
}) {
  const router = useRouter();

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [query, setQuery] = useState("");
  const [transcriptEditing, setTranscriptEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const [newActionText, setNewActionText] = useState("");
  const [editingActionId, setEditingActionId] = useState<number | null>(null);
  const [actionDraft, setActionDraft] = useState("");

  const [editingParticipants, setEditingParticipants] = useState(false);
  const [participantDraft, setParticipantDraft] = useState("");

  const [editingSegmentId, setEditingSegmentId] = useState<number | null>(null);
  const [segmentTextDraft, setSegmentTextDraft] = useState("");

  useEffect(() => {
    async function loadMeeting() {
      try {
        setLoading(true);
        setError("");
        setMeeting(await getMeeting(meetingId));
      } catch {
        setError("Could not load this meeting. Check that FastAPI is running.");
      } finally {
        setLoading(false);
      }
    }

    void loadMeeting();
  }, [meetingId]);

  useEffect(() => {
    if (!isPlaying || !meeting) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentTime((time) => {
        if (time >= meeting.duration_seconds) {
          setIsPlaying(false);
          return meeting.duration_seconds;
        }

        return time + 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isPlaying, meeting]);

  const visibleSegments = useMemo(() => {
    if (!meeting) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return meeting.transcript_segments;
    }

    return meeting.transcript_segments.filter(
      (segment) =>
        segment.text.toLowerCase().includes(normalizedQuery) ||
        segment.speaker_name.toLowerCase().includes(normalizedQuery),
    );
  }, [meeting, query]);

  function showToast(message: string) {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 2500);
  }

  async function toggleActionItem(actionItemId: number, completed: boolean) {
    if (!meeting) {
      return;
    }

    const previousMeeting = meeting;

    setMeeting({
      ...meeting,
      action_items: meeting.action_items.map((item) =>
        item.id === actionItemId ? { ...item, is_completed: completed } : item,
      ),
    });

    try {
      await updateActionItem(actionItemId, {
        is_completed: completed,
      });

      showToast(completed ? "Action item completed" : "Action item reopened");
    } catch {
      setMeeting(previousMeeting);
      setError("Could not update the action item.");
    }
  }

  async function saveTitle() {
    if (!meeting || !draftTitle.trim()) {
      setEditingTitle(false);
      return;
    }

    try {
      const updatedMeeting = await updateMeeting(meeting.id, {
        title: draftTitle.trim(),
      });

      setMeeting(updatedMeeting);
      setEditingTitle(false);
      showToast("Meeting renamed");
    } catch {
      setError("Could not rename this meeting.");
    }
  }

  async function handleDeleteMeeting() {
    if (!meeting) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${meeting.title}"? This also removes its transcript, summary, topics, and action items.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMeeting(meeting.id);
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not delete this meeting.");
    }
  }

  async function saveParticipants() {
    if (!meeting) {
      return;
    }

    const participants = participantDraft
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    if (participants.length === 0) {
      setError("Add at least one participant.");
      return;
    }

    try {
      const updatedParticipants = await replaceParticipants(
        meeting.id,
        participants,
      );

      setMeeting({
        ...meeting,
        participants: updatedParticipants,
      });

      setEditingParticipants(false);
      showToast("Participants updated");
    } catch {
      setError("Could not update participants.");
    }
  }

  async function addActionItem() {
    if (!meeting || !newActionText.trim()) {
      return;
    }

    try {
      const actionItem = await createActionItem(meeting.id, {
        text: newActionText.trim(),
      });

      setMeeting({
        ...meeting,
        action_items: [...meeting.action_items, actionItem],
      });

      setNewActionText("");
      showToast("Action item added");
    } catch {
      setError("Could not add the action item.");
    }
  }

  async function saveActionItem(actionItemId: number) {
    if (!meeting || !actionDraft.trim()) {
      return;
    }

    try {
      const updatedItem = await updateActionItem(actionItemId, {
        text: actionDraft.trim(),
      });

      setMeeting({
        ...meeting,
        action_items: meeting.action_items.map((item) =>
          item.id === actionItemId ? updatedItem : item,
        ),
      });

      setEditingActionId(null);
      showToast("Action item updated");
    } catch {
      setError("Could not update the action item.");
    }
  }

  async function removeActionItem(actionItemId: number) {
    if (!meeting) {
      return;
    }

    try {
      await deleteActionItem(actionItemId);

      setMeeting({
        ...meeting,
        action_items: meeting.action_items.filter(
          (item) => item.id !== actionItemId,
        ),
      });

      showToast("Action item deleted");
    } catch {
      setError("Could not delete the action item.");
    }
  }

  async function saveTranscriptSegment(segmentId: number) {
    if (!meeting || !segmentTextDraft.trim()) {
      return;
    }

    try {
      const updatedSegment = await updateTranscriptSegment(
        meeting.id,
        segmentId,
        {
          text: segmentTextDraft.trim(),
        },
      );

      setMeeting({
        ...meeting,
        transcript_segments: meeting.transcript_segments.map((segment) =>
          segment.id === segmentId ? updatedSegment : segment,
        ),
      });

      setEditingSegmentId(null);
      showToast("Transcript line updated");
    } catch {
      setError("Could not update the transcript line.");
    }
  }

  async function removeTranscriptSegment(segmentId: number) {
    if (!meeting) {
      return;
    }

    const confirmed = window.confirm("Delete this transcript line?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteTranscriptSegment(meeting.id, segmentId);

      setMeeting({
        ...meeting,
        transcript_segments: meeting.transcript_segments.filter(
          (segment) => segment.id !== segmentId,
        ),
      });

      showToast("Transcript line deleted");
    } catch {
      setError("Could not delete the transcript line.");
    }
  }

  function exportTranscript() {
  if (!meeting || meeting.transcript_segments.length === 0) {
    showToast("There is no transcript to export");
    return;
  }

  const content = [
    meeting.title,
    `Date: ${formatDate(meeting.meeting_date)}`,
    `Duration: ${formatTime(meeting.duration_seconds)}`,
    "",
    "TRANSCRIPT",
    "",
    ...meeting.transcript_segments.map(
      (segment) =>
        `[${formatTime(segment.start_time)}] ${segment.speaker_name}: ${segment.text}`,
    ),
  ].join("\n");

  const file = new Blob([content], { type: "text/plain;charset=utf-8" });
  const fileUrl = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = fileUrl;
  link.download = `${meeting.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-transcript.txt`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(fileUrl);

  showToast("Transcript downloaded");
}

async function shareMeeting() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast("Meeting link copied");
  } catch {
    showToast("Could not copy the meeting link");
  }
}

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f8] text-sm text-[#707078]">
        Loading meeting…
      </main>
    );
  }

  if (error || !meeting) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f7f8]">
        <div className="text-center">
          <p className="text-sm text-[#b42318]">
            {error || "Meeting not found."}
          </p>

          <Link className="mt-3 inline-block text-sm text-[#6641d6]" href="/">
            Back to meetings
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-white text-[#24252a]">
      <aside className="flex w-16 flex-col items-center border-r border-[#e7e7ea] bg-white py-5">
        <Link
          className="grid h-8 w-8 place-items-center rounded-md bg-[#7148e8] text-sm font-bold text-white"
          href="/"
        >
          F
        </Link>

        <div className="mt-9 space-y-3 text-center text-[#7e7f87]">
          <Link
            className="grid h-9 w-9 place-items-center rounded-md text-lg hover:bg-[#f4f3f7]"
            href="/"
            title="Meetings"
          >
            ▣
          </Link>

          <button
            className="grid h-9 w-9 place-items-center rounded-md text-lg hover:bg-[#f4f3f7]"
            title="Coming soon"
            type="button"
          >
            ▶
          </button>
        </div>

        <span className="mt-auto grid h-8 w-8 place-items-center rounded-full bg-[#ffe6cf] text-[10px] font-semibold text-[#994d08]">
          JD
        </span>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[65px] shrink-0 items-center justify-between border-b border-[#e7e7ea] px-6">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-xs text-[#81818a]">
              <Link className="hover:text-[#5f3bd0]" href="/">
                Meetings
              </Link>
              <span>/</span>
              <span>Notepad</span>
            </div>

            {editingTitle ? (
              <input
                autoFocus
                className="h-7 w-[360px] rounded border border-[#7048e8] px-2 text-[16px] font-semibold outline-none"
                onBlur={saveTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }

                  if (event.key === "Escape") {
                    setEditingTitle(false);
                  }
                }}
                value={draftTitle}
              />
            ) : (
              <button
                className="max-w-[420px] truncate text-left text-[16px] font-semibold hover:text-[#6741d2]"
                onClick={() => {
                  setDraftTitle(meeting.title);
                  setEditingTitle(true);
                }}
                title="Click to rename"
                type="button"
              >
                {meeting.title}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">


            <button
                className="rounded-md border border-[#dedee3] px-3 py-1.5 text-sm text-[#505159] hover:bg-[#fafafa]"
                onClick={exportTranscript}
                type="button"
            >
                Download
            </button>
            <button
              className="rounded-md border border-[#dedee3] px-3 py-1.5 text-sm text-[#505159] hover:bg-[#fafafa]"
              onClick={shareMeeting}
              type="button"
            >
              Share
            </button>

            <div className="relative">
              <button
                className="rounded-md border border-[#dedee3] px-2.5 py-1.5 text-sm text-[#505159] hover:bg-[#fafafa]"
                onClick={() => setShowMenu((visible) => !visible)}
                type="button"
              >
                •••
              </button>

              {showMenu && (
                <div className="absolute right-0 top-10 z-20 w-36 rounded-md border border-[#dedee3] bg-white py-1 shadow-lg">
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-[#f7f7f8]"
                    onClick={() => {
                      setDraftTitle(meeting.title);
                      setEditingTitle(true);
                      setShowMenu(false);
                    }}
                    type="button"
                  >
                    Rename
                  </button>

                  <button
                    className="w-full px-3 py-2 text-left text-sm text-[#b42318] hover:bg-[#fff5f4]"
                    onClick={handleDeleteMeeting}
                    type="button"
                  >
                    Delete meeting
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[420px_minmax(0,1fr)]">
          <section className="overflow-y-auto border-r border-[#e7e7ea] bg-white">
            <div className="border-b border-[#ededee] p-6">
              <p className="text-sm font-medium">{meeting.title}</p>

              <p className="mt-1 text-xs text-[#808189]">
                {formatDate(meeting.meeting_date)} ·{" "}
                {Math.round(meeting.duration_seconds / 60)} min
              </p>

              <div className="mt-4">
                {editingParticipants ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      className="h-8 min-w-0 flex-1 rounded border border-[#7048e8] px-2 text-xs outline-none"
                      onChange={(event) =>
                        setParticipantDraft(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          void saveParticipants();
                        }

                        if (event.key === "Escape") {
                          setEditingParticipants(false);
                        }
                      }}
                      value={participantDraft}
                    />

                    <button
                      className="text-xs font-medium text-[#6741d2]"
                      onClick={() => void saveParticipants()}
                      type="button"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1.5">
                      {meeting.participants.map((participant) => (
                        <span
                          className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#e9e3ff] text-[9px] font-semibold text-[#6842d3]"
                          key={participant.id}
                          title={participant.name}
                        >
                          {participant.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                      ))}
                    </div>

                    <button
                      className="text-xs font-medium text-[#777780] hover:text-[#6741d2]"
                      onClick={() => {
                        setParticipantDraft(
                          meeting.participants
                            .map((person) => person.name)
                            .join(", "),
                        );
                        setEditingParticipants(true);
                      }}
                      type="button"
                    >
                      Edit participants
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-b border-[#ededee] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">AI summary</h2>
                <span className="text-xs font-medium text-[#7048e8]">
                  ✦ AI
                </span>
              </div>

              <p className="text-sm leading-6 text-[#55565d]">
                {meeting.summary || "No summary has been generated yet."}
              </p>

              {meeting.notes && (
                <>
                  <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.07em] text-[#8a8a92]">
                    Notes
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#55565d]">
                    {meeting.notes}
                  </p>
                </>
              )}

              {meeting.keywords && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {meeting.keywords.split(",").map((keyword) => (
                    <span
                      className="rounded bg-[#f2f0fb] px-2 py-1 text-xs text-[#6741d2]"
                      key={keyword}
                    >
                      {keyword.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="border-b border-[#ededee] p-6">
              <h2 className="mb-4 text-sm font-semibold">Action items</h2>

              <div className="space-y-3">
                {meeting.action_items.length === 0 && (
                  <p className="text-sm text-[#81818a]">
                    No action items found.
                  </p>
                )}

                {meeting.action_items.map((item) => (
                  <div className="flex gap-3" key={item.id}>
                    <input
                      checked={item.is_completed}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#6d45dc]"
                      onChange={(event) =>
                        void toggleActionItem(item.id, event.target.checked)
                      }
                      type="checkbox"
                    />

                    <div className="min-w-0 flex-1">
                      {editingActionId === item.id ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            className="h-8 min-w-0 flex-1 rounded border border-[#7048e8] px-2 text-sm outline-none"
                            onChange={(event) =>
                              setActionDraft(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                void saveActionItem(item.id);
                              }
                            }}
                            value={actionDraft}
                          />

                          <button
                            className="text-xs font-medium text-[#6741d2]"
                            onClick={() => void saveActionItem(item.id)}
                            type="button"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <>
                          <p
                            className={`text-sm leading-5 ${
                              item.is_completed
                                ? "text-[#97979e] line-through"
                                : "text-[#474850]"
                            }`}
                          >
                            {item.text}
                          </p>

                          {item.assignee && (
                            <p className="mt-0.5 text-xs text-[#94949b]">
                              {item.assignee}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        className="text-xs text-[#777780] hover:text-[#6741d2]"
                        onClick={() => {
                          setActionDraft(item.text);
                          setEditingActionId(item.id);
                        }}
                        type="button"
                      >
                        Edit
                      </button>

                      <button
                        className="text-xs text-[#8d8d94] hover:text-[#b42318]"
                        onClick={() => void removeActionItem(item.id)}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}

                <form
                  className="flex gap-2 border-t border-[#eeeeef] pt-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void addActionItem();
                  }}
                >
                  <input
                    className="h-8 min-w-0 flex-1 rounded border border-[#d9d9de] px-2 text-sm outline-none focus:border-[#7048e8]"
                    onChange={(event) => setNewActionText(event.target.value)}
                    placeholder="Add an action item"
                    value={newActionText}
                  />

                  <button
                    className="rounded bg-[#f2f0fb] px-3 text-xs font-medium text-[#6741d2] hover:bg-[#e9e4ff]"
                    type="submit"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>

            <div className="p-6">
              <h2 className="mb-3 text-sm font-semibold">Outline</h2>

              <div className="space-y-2">
                {meeting.topics.map((topic) => (
                  <button
                    className="flex w-full items-start gap-3 text-left text-sm hover:text-[#6741d2]"
                    key={topic.id}
                    onClick={() => setCurrentTime(topic.start_time)}
                    type="button"
                  >
                    <span className="w-10 shrink-0 font-mono text-xs text-[#8c8c94]">
                      {formatTime(topic.start_time)}
                    </span>

                    <span>{topic.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="flex min-w-0 flex-col bg-white">
            <div className="border-b border-[#e7e7ea] p-5">
              <div className="flex h-[160px] items-center justify-center rounded-md bg-[#292a31] text-sm text-[#dedee4]">
                Recording preview unavailable
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button
                  className="grid h-8 w-8 place-items-center rounded-full bg-[#6741d2] text-xs text-white hover:bg-[#5935c2]"
                  onClick={() => setIsPlaying((playing) => !playing)}
                  type="button"
                >
                  {isPlaying ? "Ⅱ" : "▶"}
                </button>

                <span className="w-10 font-mono text-xs text-[#777780]">
                  {formatTime(currentTime)}
                </span>

                <input
                  className="h-1 flex-1 accent-[#6741d2]"
                  max={meeting.duration_seconds}
                  min="0"
                  onChange={(event) =>
                    setCurrentTime(Number(event.target.value))
                  }
                  type="range"
                  value={currentTime}
                />

                <span className="w-10 font-mono text-xs text-[#777780]">
                  {formatTime(meeting.duration_seconds)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-[#e7e7ea] px-5 py-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold">Transcript</h2>

                <button
                  className={`text-xs font-medium ${
                    transcriptEditing ? "text-[#6741d2]" : "text-[#7d7d85]"
                  }`}
                  onClick={() => {
                    setTranscriptEditing((editing) => !editing);
                    setEditingSegmentId(null);
                  }}
                  type="button"
                >
                  {transcriptEditing ? "Done" : "Edit"}
                </button>
              </div>

              <label className="flex h-8 w-[230px] items-center gap-2 rounded-md border border-[#dedee3] px-2.5">
                <span className="text-[#8a8a92]">⌕</span>

                <input
                  className="w-full bg-transparent text-xs outline-none placeholder:text-[#9a9aa1]"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find in transcript"
                  value={query}
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {visibleSegments.map((segment) => {
                const isActive =
                  currentTime >= segment.start_time &&
                  currentTime < segment.end_time;

                return (
                  <div
                    className={`grid grid-cols-[58px_130px_minmax(0,1fr)] gap-3 border-b border-[#f0f0f1] px-5 py-4 ${
                      isActive ? "bg-[#f1edff]" : "hover:bg-[#fafafa]"
                    }`}
                    key={segment.id}
                  >
                    <button
                      className="font-mono text-left text-xs text-[#92929a]"
                      onClick={() => {
                        setCurrentTime(segment.start_time);
                        setIsPlaying(true);
                      }}
                      type="button"
                    >
                      {formatTime(segment.start_time)}
                    </button>

                    <button
                      className="truncate text-left text-sm font-medium text-[#5f40c6]"
                      onClick={() => {
                        setCurrentTime(segment.start_time);
                        setIsPlaying(true);
                      }}
                      type="button"
                    >
                      {segment.speaker_name}
                    </button>

                    <div className="min-w-0">
                      {editingSegmentId === segment.id ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            className="h-8 min-w-0 flex-1 rounded border border-[#7048e8] px-2 text-sm outline-none"
                            onChange={(event) =>
                              setSegmentTextDraft(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                void saveTranscriptSegment(segment.id);
                              }
                            }}
                            value={segmentTextDraft}
                          />

                          <button
                            className="text-xs font-medium text-[#6741d2]"
                            onClick={() =>
                              void saveTranscriptSegment(segment.id)
                            }
                            type="button"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          className="text-left text-sm leading-6 text-[#3f4047]"
                          onClick={() => {
                            setCurrentTime(segment.start_time);
                            setIsPlaying(true);
                          }}
                          type="button"
                        >
                          {highlightText(segment.text, query)}
                        </button>
                      )}

                      {transcriptEditing && editingSegmentId !== segment.id && (
                        <div className="mt-2 flex gap-3">
                          <button
                            className="text-xs text-[#777780] hover:text-[#6741d2]"
                            onClick={() => {
                              setSegmentTextDraft(segment.text);
                              setEditingSegmentId(segment.id);
                            }}
                            type="button"
                          >
                            Edit line
                          </button>

                          <button
                            className="text-xs text-[#8d8d94] hover:text-[#b42318]"
                            onClick={() =>
                              void removeTranscriptSegment(segment.id)
                            }
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {visibleSegments.length === 0 && (
                <p className="p-6 text-sm text-[#84848c]">
                  No transcript matches “{query}”.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-md bg-[#292a31] px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}