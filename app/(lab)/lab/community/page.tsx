// @implemented
// @screen W04-1~3
import { Suspense } from "react";
import { CommunityBrowser } from "./_components/community-browser";

export default function Page() {
  return (
    <Suspense>
      <CommunityBrowser />
    </Suspense>
  );
}
