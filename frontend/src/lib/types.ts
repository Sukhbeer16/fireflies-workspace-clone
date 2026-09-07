export interface Participant {
  id: number;
  meeting_id: number;
  name: string;
  email: string | null;
}

export interface TranscriptSegment {
  id: number;
  meeting_id: number;
  speaker_name: string;
  start_time: number;
  end_time: number;
  text: string;
  sequence: number;
}

export interface ActionItem {
  id: number;
  meeting_id: number;
  text: string;
  assignee: string | null;
  due_date: string | null;
  is_completed: boolean;
  created_at: string;
}

export interface Topic {
  id: number;
  meeting_id: number;
  title: string;
  description: string | null;
  start_time: number;
}

export interface MeetingListItem {
  id: number;
  title: string;
  meeting_date: string;
  duration_seconds: number;
  status: string;
  source: string;
  participants: Participant[];
}

export interface MeetingDetail extends MeetingListItem {
  summary: string | null;
  notes: string | null;
  keywords: string | null;
  created_at: string;
  updated_at: string;
  transcript_segments: TranscriptSegment[];
  action_items: ActionItem[];
  topics: Topic[];
}

export interface MeetingSearchParams {
  search?: string;
  participant?: string;
  sort?: "recent" | "oldest" | "title";
}