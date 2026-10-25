/**
 * Re-mounts on every navigation inside the app shell: the page fades in under a
 * short sand-coloured sweep ("turning the page"). Opacity only — a transform here
 * would break `position: fixed` children (quiz confetti, cheers) while it runs.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="route-enter h-full">
      <span aria-hidden="true" className="route-sand-sweep" />
      {children}
    </div>
  );
}
