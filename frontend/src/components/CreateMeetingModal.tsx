"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import {
  createMeeting,
  generateInsights,
  pasteTranscript,
} from "@/lib/api";

export default function CreateMeetingModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [participants, setParticipants] = useState("");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();



    if (!title.trim() || !meetingDate) {
      setError("A meeting title and date are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const participantList = participants
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({ name }));

      const meeting = await createMeeting({
        title: title.trim(),
        meeting_date: new Date(meetingDate).toISOString(),
        participants: participantList,
      });

      if (transcript.trim()) {
        await pasteTranscript(meeting.id, transcript.trim());
      }


      if (transcript.trim()) {
        await generateInsights(meeting.id);
      }


      router.push(`/meetings/${meeting.id}`);
      router.refresh();
    } catch {
      setError("Could not create the meeting. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4">
      <div className="w-full max-w-[620px] rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e8e8eb] px-6 py-4">
          <h2 className="text-[16px] font-semibold">Add meeting</h2>
          <button
            className="text-xl text-[#777780] hover:text-[#303139]"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form className="space-y-5 p-6" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Meeting title</span>
            <input
              className="h-10 w-full rounded-md border border-[#d9d9de] px-3 text-sm outline-none focus:border-[#7048e8]"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Product roadmap planning"
              value={title}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Meeting date</span>
            <input
              className="h-10 w-full rounded-md border border-[#d9d9de] px-3 text-sm outline-none focus:border-[#7048e8]"
              onChange={(event) => setMeetingDate(event.target.value)}
              type="datetime-local"
              value={meetingDate}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Participants
            </span>
            <input
              className="h-10 w-full rounded-md border border-[#d9d9de] px-3 text-sm outline-none focus:border-[#7048e8]"
              onChange={(event) => setParticipants(event.target.value)}
              placeholder="Sarah Chen, Alex Morgan"
              value={participants}
            />
            <span className="mt-1.5 block text-xs text-[#83838b]">
              Separate names with commas.
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Paste transcript
            </span>
            <textarea
              className="min-h-[150px] w-full resize-y rounded-md border border-[#d9d9de] p-3 font-mono text-xs leading-5 outline-none focus:border-[#7048e8]"
              onChange={(event) => setTranscript(event.target.value)}
              placeholder={"[00:00] Sarah Chen: Welcome everyone.\n[00:18] Alex Morgan: I will finish the API by Friday."}
              value={transcript}
            />
            <span className="mt-1.5 block text-xs text-[#83838b]">
              Use [MM:SS] Speaker: text format for timestamps and speakers.
            </span>
          </label>

          {error && <p className="text-sm text-[#b42318]">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-[#eeeeef] pt-5">
            <button
              className="rounded-md border border-[#d9d9de] px-4 py-2 text-sm font-medium text-[#52535a] hover:bg-[#fafafa]"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-md bg-[#6941d8] px-4 py-2 text-sm font-medium text-white hover:bg-[#5c36c6] disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? "Creating…" : "Create meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}