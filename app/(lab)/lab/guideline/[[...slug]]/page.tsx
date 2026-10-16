// @implemented
// @screen W03
import { GuidelineView } from "@/components/ui/guideline/guideline-view";

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  return <GuidelineView base="/lab/guideline" slug={(await params).slug} />;
}
