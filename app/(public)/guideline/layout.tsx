import { PublicGnb } from "../_components/public-gnb";

export default function GuidelineLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicGnb />
      {children}
    </>
  );
}
