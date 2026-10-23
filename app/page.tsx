import { ChatApp } from "@/components/chat-app";
import { StaticIntro } from "@/components/static-intro";
import { getSiteAvatar } from "@/lib/avatar-settings.server";
import { getSiteLanding } from "@/lib/landing-settings.server";
import { getSiteMotion } from "@/lib/motion-settings.server";

export default async function Home() {
  // Skaffen's avatar, the chat's pace and the landing's words are site settings
  // (/admin); defaults come from code.
  const [{ avatar }, motion, landing] = await Promise.all([getSiteAvatar(), getSiteMotion(), getSiteLanding()]);
  return (
    <ChatApp
      avatar={avatar}
      motion={motion}
      landing={landing}
      fallback={<StaticIntro avatar={avatar} landing={landing} />}
    />
  );
}
