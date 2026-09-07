import type {
  ActionItem,
  MeetingDetail,
  MeetingListItem,
  MeetingSearchParams,
  TranscriptSegment,
  Participant,
} from "@/lib/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function getMeetings(
  filters: MeetingSearchParams = {},
): Promise<MeetingListItem[]> {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      query.set(key, value);
    }
  }

  const suffix = query.toString();

  return apiFetch<MeetingListItem[]>(
    `/api/meetings${suffix ? `?${suffix}` : ""}`,
  );
}

export async function getMeeting(id: number): Promise<MeetingDetail> {
  return apiFetch<MeetingDetail>(`/api/meetings/${id}`);
}

export async function updateActionItem(
  actionItemId: number,
  data: Partial<Pick<ActionItem, "text" | "assignee" | "due_date" | "is_completed">>,
): Promise<ActionItem> {
  return apiFetch<ActionItem>(`/api/meetings/action-items/${actionItemId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function createMeeting(data: {
  title: string;
  meeting_date: string;
  participants: { name: string; email?: string }[];
}): Promise<MeetingDetail> {
  return apiFetch<MeetingDetail>("/api/meetings", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      duration_seconds: 0,
      status: "completed",
      source: "manual",
      transcript_segments: [],
      action_items: [],
      topics: [],
    }),
  });
}

export async function pasteTranscript(
  meetingId: number,
  content: string,
): Promise<void> {
  await apiFetch(`/api/meetings/${meetingId}/paste-transcript`, {
    method: "POST",
    body: JSON.stringify({
      content,
      replace: true,
    }),
  });
}

export async function generateInsights(
  meetingId: number,
): Promise<MeetingDetail> {
  return apiFetch<MeetingDetail>(
    `/api/meetings/${meetingId}/generate-insights`,
    {
      method: "POST",
    },
  );
}
export async function updateMeeting(
  meetingId: number,
  data: { title?: string },
): Promise<MeetingDetail> {
  return apiFetch<MeetingDetail>(`/api/meetings/${meetingId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteMeeting(meetingId: number): Promise<void> {
  await apiFetch<void>(`/api/meetings/${meetingId}`, {
    method: "DELETE",
  });
}
export async function createActionItem(
  meetingId: number,
  data: { text: string; assignee?: string | null },
): Promise<ActionItem> {
  return apiFetch<ActionItem>(`/api/meetings/${meetingId}/action-items`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteActionItem(actionItemId: number): Promise<void> {
  await apiFetch<void>(`/api/meetings/action-items/${actionItemId}`, {
    method: "DELETE",
  });
}
export async function updateTranscriptSegment(
  meetingId: number,
  segmentId: number,
  data: Partial<
    Pick<
      TranscriptSegment,
      "speaker_name" | "start_time" | "end_time" | "text" | "sequence"
    >
  >,
): Promise<TranscriptSegment> {
  return apiFetch<TranscriptSegment>(
    `/api/meetings/${meetingId}/transcript-segments/${segmentId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}


export async function deleteTranscriptSegment(
  meetingId: number,
  segmentId: number,
): Promise<void> {
  await apiFetch<void>(
    `/api/meetings/${meetingId}/transcript-segments/${segmentId}`,
    {
      method: "DELETE",
    },
  );
}
export async function replaceParticipants(
  meetingId: number,
  participants: { name: string; email?: string }[],
): Promise<Participant[]> {
  return apiFetch<Participant[]>(`/api/meetings/${meetingId}/participants`, {
    method: "PUT",
    body: JSON.stringify(participants),
  });
}