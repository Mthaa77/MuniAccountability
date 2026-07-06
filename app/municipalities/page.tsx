import { PageHeader } from "@/components/ui";
import { MunicipalityDirectory } from "@/components/interactive";

export default function MunicipalitiesPage() {
  return (
    <>
      <PageHeader
        kicker="Municipality directory"
        title="Find and open every pilot case file."
        description="Search municipalities by name, audit posture, category or intervention priority. Each card opens a source-backed Municipality 360 workspace."
      />
      <MunicipalityDirectory />
    </>
  );
}
