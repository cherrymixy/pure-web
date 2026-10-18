// @implemented
import { redirect } from "next/navigation";

// User Data was renamed to Community: old links land on the new route.
export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  redirect(tab === "popular" || tab === "recent" ? `/lab/community?tab=${tab}` : "/lab/community");
}
