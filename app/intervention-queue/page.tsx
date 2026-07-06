import { QueueWorkspace } from "@/components/interactive";
import { PageHeader } from "@/components/ui";

export default function InterventionQueuePage() {
  return (
    <>
      <PageHeader
        kicker="Ranked worklist"
        title="Intervention Queue"
        description="Filter priority municipalities, open evidence, assign owners, request updates and move source-backed risks into briefings."
      />
      <QueueWorkspace />
    </>
  );
}
