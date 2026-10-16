// @implemented
// @screen W02B-3
import { Analyzing } from "./_components/analyzing";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <Analyzing id={(await params).id} />;
}
