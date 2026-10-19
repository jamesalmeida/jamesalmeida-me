import { ChatApp } from "@/components/chat-app";
import { StaticIntro } from "@/components/static-intro";

export default function Home() {
  return <ChatApp fallback={<StaticIntro />} />;
}
