"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

const TABS = [
  { label: "General", href: (c: string) => `/projects/${c}/settings/general` },
  {
    label: "Access control",
    href: (c: string) => `/projects/${c}/settings/access-control`,
  },
  { label: "Members", href: (c: string) => `/projects/${c}/settings/members` },
  {
    label: "Integrations",
    href: (c: string) => `/projects/${c}/settings/integrations`,
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const code = params.code as string;

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-8 pt-10 pb-16">
        <h1 className="text-3xl font-bold text-text-main mb-8 tracking-tight">
          Project settings
        </h1>

        {/* Tab bar — matches Qase style */}
        <div className="border-b border-border mb-10">
          <nav className="flex -mb-px gap-1">
            {TABS.map((tab) => {
              const href = tab.href(code);
              const active = pathname === href || pathname.startsWith(href);
              return (
                <Link
                  key={tab.label}
                  href={href}
                  className={`px-5 py-3.5 text-[15px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    active
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-text-muted hover:text-text-main hover:border-border"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {children}
      </div>
    </div>
  );
}
