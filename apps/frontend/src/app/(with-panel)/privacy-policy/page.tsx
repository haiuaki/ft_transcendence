import Link from "next/link";
import { LegalPage, LegalSection } from "@/src/components/LegalPage";

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy policy" intro="ft_cluster is a student project built at 42. This page explains what data we collect, why, and how you can access or erase it.">
      <LegalSection title="What we collect">
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li><b>Account:</b> your email address, username, avatar and, if you sign up with a password, a salted hash of it (never the password itself). If you sign in with Google, GitHub or 42, we receive your email address and avatar from that provider.</li>
          <li><b>Security:</b> if you enable two-factor authentication, the secret used to check your codes.</li>
          <li><b>Social:</b> your friends and friend requests, the rooms you create or join, and the messages you send in rooms and direct messages.</li>
          <li><b>Activity:</b> how long you spend in rooms and how many messages you send each day, shown on your own dashboard.</li>
        </ul>
      </LegalSection>

      <LegalSection title="How we use it">
        <p>Only to run the app: signing you in, showing your profile and friends, delivering messages, and building your activity dashboard. We do not sell your data, show ads or track you across other websites.</p>
      </LegalSection>

      <LegalSection title="Services we share data with">
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li><b>Google Gemini:</b> powers the AI study assistant. The questions you ask it are sent to Google, and so are chat messages, which are turned into search vectors so the assistant can find relevant context.</li>
          <li><b>Resend:</b> sends our emails (account verification, data export and account deletion confirmations) to your address.</li>
          <li><b>Google, GitHub and 42:</b> only if you choose to sign in with them.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Stored in your browser">
        <p>We keep your session token, your day/night preference and your conversation with the AI assistant in your browser&apos;s storage. The assistant conversation is cleared when you sign out or delete your account. We do not use tracking or advertising cookies.</p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>You stay in control of your data at any time, from the <b>Your data</b> section of your <Link href="/profile" className="underline">profile</Link>:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li><b>Access:</b> download a copy of all your data as a JSON file. We email you each time an export is made.</li>
          <li><b>Erasure:</b> delete your account. Your email, password, avatar and security settings are wiped, and your messages, friends, rooms and activity are deleted. You receive a confirmation email.</li>
          <li><b>Rectification:</b> change your username and avatar from your profile.</li>
        </ul>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>Your data is kept for as long as your account exists, and erased when you delete it. A deleted account only leaves behind an anonymous placeholder, with no personal data, so the rest of the app keeps working.</p>
      </LegalSection>
    </LegalPage>
  );
}
