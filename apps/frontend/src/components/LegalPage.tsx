import type { ReactNode } from "react";

// Shared layout for the privacy policy and terms of service pages
export const LegalPage = ({ title, intro, children }: { title: string, intro: string, children: ReactNode }) => (
  <div className="h-full w-full overflow-y-auto custom-scrollbar">
    <div className="mx-auto max-w-[700px] flex flex-col gap-8 p-6 sm:p-10 text-black">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="text-sm text-black/60">{intro}</p>
      </div>
      {children}
    </div>
  </div>
);

export const LegalSection = ({ title, children }: { title: string, children: ReactNode }) => (
  <section className="flex flex-col gap-2">
    <h2 className="text-lg font-semibold">{title}</h2>
    <div className="flex flex-col gap-2 text-sm text-black/80 leading-relaxed">{children}</div>
  </section>
);
