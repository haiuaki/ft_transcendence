import Link from "next/link";
import type { ReactNode } from "react";

const Section = ({ title, children }: { title: string, children: ReactNode }) => (
  <section className="flex flex-col gap-2">
    <h2 className="text-lg font-semibold">{title}</h2>
    <div className="flex flex-col gap-2 text-sm text-black/80 leading-relaxed">{children}</div>
  </section>
);

export default function PrivacyPolicy() {
  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar">
      <div className="mx-auto max-w-[700px] flex flex-col gap-8 p-6 sm:p-10 text-black">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Privacy policy</h1>
          <p className="text-sm text-black/60">
            ft_cluster is a student project built at 42. This page explains what data we collect, why, and how you can access or erase it.
          </p>
        </div>

        <Section title="What we collect">
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li><b>Account:</b> your email address, username, avatar and, if you sign up with a password, a salted hash of it (never the password itself). If you sign in with Google, GitHub or 42, we receive your email address and avatar from that provider.</li>
            <li><b>Security:</b> if you enable two-factor authentication, the secret used to check your codes.</li>
            <li><b>Social:</b> your friends and friend requests, the rooms you create or join, and the messages you send in rooms and direct messages.</li>
            <li><b>Activity:</b> how long you spend in rooms and how many messages you send each day, shown on your own dashboard.</li>
          </ul>
        </Section>

        <Section title="How we use it">
          <p>Only to run the app: signing you in, showing your profile and friends, delivering messages, and building your activity dashboard. We do not sell your data, show ads or track you across other websites.</p>
        </Section>

        <Section title="Services we share data with">
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li><b>Google Gemini:</b> powers the AI study assistant. The questions you ask it are sent to Google, and so are chat messages, which are turned into search vectors so the assistant can find relevant context.</li>
            <li><b>Resend:</b> sends our emails (account verification, data export and account deletion confirmations) to your address.</li>
            <li><b>Google, GitHub and 42:</b> only if you choose to sign in with them.</li>
          </ul>
        </Section>

        <Section title="Stored in your browser">
          <p>We keep your session token and your day/night preference in your browser&apos;s local storage. We do not use tracking or advertising cookies.</p>
        </Section>

        <Section title="Your rights">
          <p>You stay in control of your data at any time, from the <b>Your data</b> section of your <Link href="/profile" className="underline">profile</Link>:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li><b>Access:</b> download a copy of all your data as a JSON file. We email you each time an export is made.</li>
            <li><b>Erasure:</b> delete your account. Your email, password, avatar and security settings are wiped, and your messages, friends, rooms and activity are deleted. You receive a confirmation email.</li>
            <li><b>Rectification:</b> change your username and avatar from your profile.</li>
          </ul>
        </Section>

        <Section title="How long we keep it">
          <p>Your data is kept for as long as your account exists, and erased when you delete it. A deleted account only leaves behind an anonymous placeholder, with no personal data, so the rest of the app keeps working.</p>
        </Section>
      </div>
    </div>
  );
}
