// @implemented
// @screen W02F-5
import { ShareViewer } from "./_components/share-viewer";

export default async function Page({ params }: { params: Promise<{ shareId: string }> }) {
  return <ShareViewer id={(await params).shareId} />;
}
