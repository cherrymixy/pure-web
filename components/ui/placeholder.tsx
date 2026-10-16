export function Placeholder({ screen, route }: { screen: string; route: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-16">
      <h1 className="text-2xl font-semibold">{screen}</h1>
      <p className="font-mono text-sm text-neutral-500">{route}</p>
      <p className="text-sm text-neutral-400">Not implemented yet</p>
    </div>
  );
}
