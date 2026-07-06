import { BriefingWorkspace } from "@/components/interactive";
import { PageHeader } from "@/components/ui";

export default function BriefingsPage() {
  return (
    <>
      <PageHeader
        kicker="Committee and executive packs"
        title="Generate source-cited decision packs."
        description="Choose a template, inspect required sections, and keep every statement tied to source-backed evidence."
      />
      <BriefingWorkspace />
    </>
  );
}
