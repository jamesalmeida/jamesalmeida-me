import { ChatApp } from "@/components/chat-app";
import { StaticIntro } from "@/components/static-intro";
import { getSiteAvatar } from "@/lib/avatar-settings.server";

export default async function Home() {
  // Skaffen's avatar is a site setting (/admin); the default comes from SITE.
  const { avatar } = await getSiteAvatar();
  return <ChatApp avatar={avatar} fallback={<StaticIntro avatar={avatar} />} />;
}
