import { SiteNav } from "@/components/site-nav";

export function SitePageShell({
  current,
  children,
}: {
  current?: "work" | "consulting" | "privacy";
  children: React.ReactNode;
}) {
  return (
    <div className="site-page">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <SiteNav current={current} />
        {children}
      </div>
    </div>
  );
}
