import MeetingWorkspace from "@/components/MeetingWorkspace";

export default async function MeetingPage(
  props: PageProps<"/meetings/[id]">,
) {
  const { id } = await props.params;
  const meetingId = Number(id);

  return <MeetingWorkspace meetingId={meetingId} />;
}