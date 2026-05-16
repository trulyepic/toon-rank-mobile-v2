import { PlaceholderCard } from "../components/PlaceholderCard";
import { ScreenShell } from "../components/ScreenShell";

export function MoreScreen() {
  return (
    <ScreenShell
      title="More"
      subtitle="This holds the future account, settings, and post-auth features without blocking Phase 1."
    >
      <PlaceholderCard
        title="Deferred features"
        body="Auth, reading list management, forum interactions, contributor tools, and admin workflows stay out of the initial mobile build."
      />
    </ScreenShell>
  );
}
