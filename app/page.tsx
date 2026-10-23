import { ChatApp } from "@/components/chat-app";
import { StaticIntro } from "@/components/static-intro";
import { getSiteAvatar } from "@/lib/avatar-settings.server";
import { getSiteMotion } from "@/lib/motion-settings.server";

export default async function Home() {
  // Skaffen's avatar and the chat's pace are site settings (/admin); defaults come from code.
  const [{ avatar }, motion] = await Promise.all([getSiteAvatar(), getSiteMotion()]);
  return <ChatApp avatar={avatar} motion={motion} fallback={<StaticIntro avatar={avatar} />} />;
}
