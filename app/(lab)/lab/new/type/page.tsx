// @implemented
// @screen W02B-1
import { TypePicker } from "./_components/type-picker";

// `?select=joint-fixed` only presets the selected card (display state for review screenshots).
export default async function Page({ searchParams }: { searchParams: Promise<{ select?: string }> }) {
  const { select } = await searchParams;
  return <TypePicker initialSelected={select === "joint-fixed"} />;
}
