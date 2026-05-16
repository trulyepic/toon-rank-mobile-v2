import { PlaceholderCard } from "../components/PlaceholderCard";
import { ScreenShell } from "../components/ScreenShell";

export function MoreScreen() {
  return (
    <ScreenShell
      title="More"
      subtitle="Account, reading list, forum activity, settings, and support live here."
    >
      <PlaceholderCard
        title="Account features"
        body="Sign in, saved titles, forum activity, settings, Terms, Privacy, and support links will be organized from this screen."
      />
    </ScreenShell>
  );
}
