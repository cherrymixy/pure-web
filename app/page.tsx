import { redirect } from "next/navigation";

// shortcut: landing (Click to Start) skipped for now (user review) — the site opens straight in the Lab.
// To bring it back: `import { Landing } from "@/components/landing/landing"` and `return <Landing />`.
export default function Home() {
  redirect("/lab");
}
