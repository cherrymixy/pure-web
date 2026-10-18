// @implemented
import { redirect } from "next/navigation";

// User Data was renamed to Community: old motion links land on the new route.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/lab/community/${encodeURIComponent(id)}`);
}
