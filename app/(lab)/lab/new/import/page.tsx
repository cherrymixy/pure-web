// @implemented
// @screen W02B-2
import { Suspense } from "react";
import { ImportModel } from "./_components/import-model";

export default function Page() {
  return (
    <Suspense>
      <ImportModel />
    </Suspense>
  );
}
