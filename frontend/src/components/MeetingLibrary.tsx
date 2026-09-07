"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CreateMeetingModal from "@/components/CreateMeetingModal";
import { getMeetings } from "@/lib/api";
import ComingSoonModal from "@/components/ComingSoonModal";
import { useRouter } from "next/navigation";

import type { MeetingListItem } from "@/lib/types";

const navigationItems = [
  { label: "Home", icon: "⌂" },
  { label: "Meetings", icon: "▣", active: true },
  { label: "Playlist", icon: "▶" },
  { label: "Apps", icon: "⊞" },
];

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MeetingLibrary() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "oldest" | "title">("recent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState("");

  const [participant, setParticipant] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMeetings({
            search: search.trim() || undefined,
            participant: participant.trim() || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            sort,
        });

        setMeetings(data);
      } catch {
        setError(
          "Could not reach the API. Make sure the FastAPI server is running.",
        );
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search, participant, dateFrom, dateTo, sort]);

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-[#202124]">
      <aside className="fixed inset-y-0 left-0 z-10 flex w-[220px] flex-col border-r border-[#e7e7ea] bg-white px-3 py-5">
        <div className="mb-8 flex items-center gap-2 px-3">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-[#7148e8] text-sm font-bold text-white">
            F
          </div>
          <span className="text-[17px] font-semibold tracking-[-0.03em]">
            fireflies.ai
          </span>
        </div>

        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <button
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm ${
                item.active
                  ? "bg-[#f0ecff] font-medium text-[#5d36cf]"
                  : "text-[#5f6368] hover:bg-[#f5f5f6]"
              }`}
              key={item.label}
              onClick={() => {
                if (item.label === "Home" || item.label === "Meetings") {
                    router.push("/");
                    return;
                }
                setComingSoonFeature(item.label);
            }}
              type="button"
            >
              <span className="w-4 text-center text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-7 border-t border-[#ededee] pt-5">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#97979d]">
            Workspace
          </p>
          <button
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#5f6368] hover:bg-[#f5f5f6]"
            onClick={() => setComingSoonFeature("Team settings")}
            type="button"
          >
            <span className="w-4 text-center">⌘</span>
            Team settings
          </button>
        </div>

        <div className="mt-auto border-t border-[#ededee] pt-4">
          <button
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-[#f5f5f6]"
            onClick={() => setComingSoonFeature("Profile settings")}
            type="button"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#ffe6cf] text-[11px] font-semibold text-[#994d08]">
              SK
            </span>
            <span>
              <span className="block text-sm font-medium">Sukhbeer Kaur</span>
              <span className="block text-xs text-[#88888f]">Free workspace</span>
            </span>
          </button>
        </div>
      </aside>

      <main className="ml-[220px] min-h-screen">
        <header className="flex h-[68px] items-center justify-between border-b border-[#e7e7ea] bg-white px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-[19px] font-semibold tracking-[-0.025em]">
              Meetings
            </h1>
            <span className="rounded bg-[#f1f1f3] px-2 py-0.5 text-xs text-[#72727a]">
              {meetings.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="rounded-md border border-[#dedee2] px-3 py-2 text-sm font-medium text-[#4f5057] hover:bg-[#f7f7f8]"
              
              type="button"
            >
              Upload
            </button>
            <button
              className="rounded-md bg-[#6941d8] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#5c36c6]"
              onClick={() => setShowCreateModal(true)}
              type="button"
            >
              + Add meeting
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-[1200px] px-8 py-8">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <label className="flex h-10 w-[310px] items-center gap-2 rounded-md border border-[#dcdce1] bg-white px-3">
              <span className="text-[#8d8e96]">⌕</span>
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#9a9aa1]"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search meetings"
                value={search}
              />
            </label>

            <button
              className="h-10 rounded-md border border-[#dcdce1] bg-white px-3 text-sm text-[#4f5057] hover:bg-[#fafafa]"
              type="button"
            >
              My meetings
            </button>
            <button
              className="h-10 rounded-md border border-[#dcdce1] bg-white px-3 text-sm text-[#4f5057] hover:bg-[#fafafa]"
              type="button"
            >
              All meetings
            </button>
            <button
              className="h-10 rounded-md border border-[#dcdce1] bg-white px-3 text-sm text-[#4f5057] hover:bg-[#fafafa]"
              onClick={() => setFiltersOpen((open) => !open)}
              type="button"
            >
              Filters
            </button>

            <select
              className="ml-auto h-10 rounded-md border border-[#dcdce1] bg-white px-3 text-sm text-[#4f5057] outline-none"
              onChange={(event) =>
                setSort(event.target.value as "recent" | "oldest" | "title")
              }
              value={sort}
            >
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>

          {filtersOpen && (
            <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-[#e2e2e6] bg-white p-4">
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-[#707078]">
                        Participant
                    </span>
                    <input
                        className="h-9 w-[210px] rounded-md border border-[#dcdce1] px-3 text-sm outline-none focus:border-[#7048e8]"
                        onChange={(event) => setParticipant(event.target.value)}
                        placeholder="e.g. Sarah Chen"
                        value={participant}
                    />
                </label>

                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-[#707078]">
                        From date
                    </span>
                    <input
                        className="h-9 rounded-md border border-[#dcdce1] px-3 text-sm outline-none focus:border-[#7048e8]"
                        onChange={(event) => setDateFrom(event.target.value)}
                        type="date"
                        value={dateFrom}
                    />
                </label>

                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-[#707078]">
                        To date
                    </span>
                    <input
                        className="h-9 rounded-md border border-[#dcdce1] px-3 text-sm outline-none focus:border-[#7048e8]"
                        onChange={(event) => setDateTo(event.target.value)}
                        type="date"
                        value={dateTo}
                    />
                </label>

                <button
                    className="h-9 rounded-md px-3 text-sm font-medium text-[#6741d2] hover:bg-[#f4f0ff]"
                    onClick={() => {
                        setParticipant("");
                        setDateFrom("");
                        setDateTo("");
                    }}
                    type="button"
                >
                    Clear filters
                </button>
            </div>
        )}

          <div className="overflow-hidden rounded-lg border border-[#e2e2e6] bg-white">
            <div className="grid grid-cols-[minmax(0,1fr)_140px_110px_36px] border-b border-[#e9e9eb] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#96969d]">
              <span>Meeting</span>
              <span>Date</span>
              <span>Duration</span>
              <span />
            </div>

            {loading && (
              <p className="px-5 py-10 text-sm text-[#777780]">
                Loading meetings…
              </p>
            )}

            {error && (
              <p className="px-5 py-10 text-sm text-[#b42318]">{error}</p>
            )}

            {!loading && !error && meetings.length === 0 && (
              <p className="px-5 py-10 text-sm text-[#777780]">
                No meetings match your search.
              </p>
            )}

            {!loading &&
              !error &&
              meetings.map((meeting) => (
                <Link
                  className="grid grid-cols-[minmax(0,1fr)_140px_110px_36px] items-center border-b border-[#eeeeef] px-5 py-4 last:border-b-0 hover:bg-[#fafafa]"
                  href={`/meetings/${meeting.id}`}
                  key={meeting.id}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#292a2f]">
                      {meeting.title}
                    </p>
                    <div className="mt-2 flex items-center">
                      {meeting.participants.slice(0, 4).map((participant, index) => (
                        <span
                          className="-ml-1 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-[#e9e3ff] text-[8px] font-semibold text-[#6740d3] first:ml-0"
                          key={participant.id}
                          style={{ zIndex: 4 - index }}
                          title={participant.name}
                        >
                          {initials(participant.name)}
                        </span>
                      ))}
                      <span className="ml-2 truncate text-xs text-[#81818a]">
                        {meeting.participants.map((person) => person.name).join(", ")}
                      </span>
                    </div>
                  </div>

                  <span className="text-sm text-[#6f7078]">
                    {formatDate(meeting.meeting_date)}
                  </span>
                  <span className="text-sm text-[#6f7078]">
                    {formatDuration(meeting.duration_seconds)}
                  </span>
                  <span className="text-center text-lg text-[#878790]">•••</span>
                </Link>
              ))}
          </div>


        </section>
      </main>

      {showCreateModal && (
        <CreateMeetingModal onClose={() => setShowCreateModal(false)} />
      )}

      {comingSoonFeature && (
        <ComingSoonModal
            feature={comingSoonFeature}
            onClose={() => setComingSoonFeature("")}
        />
    )}
    </div>
  );
}