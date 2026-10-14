import Link from "next/link";
import { LegalPage, LegalSection } from "@/src/components/LegalPage";

export default function TermsOfService() {
  return (
    <LegalPage title="Terms of service" intro="ft_cluster is a student project built at 42: a 3D coworking space where you can study with others, chat and ask an AI assistant for help. By creating an account or using the app, you agree to these terms.">
      <LegalSection title="Your account">
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>Use a real email address you have access to. We use it to verify your account and to confirm data exports and deletions.</li>
          <li>Keep your password and authenticator codes to yourself. You are responsible for what happens on your account; we recommend enabling two-factor authentication.</li>
          <li>One account per person. Do not create accounts to impersonate someone else.</li>
          <li>Pick a username and avatar that are not offensive or misleading.</li>
        </ul>
      </LegalSection>

      <LegalSection title="How to behave">
        <p>ft_cluster is a shared study space, so treat it like one. You must not:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>harass, threaten or insult other users, or post hateful, sexual or illegal content;</li>
          <li>spam rooms or direct messages, or flood the AI assistant with requests;</li>
          <li>share someone else&apos;s personal information without their permission;</li>
          <li>try to break, overload or get around the security of the app, or access accounts and messages that are not yours.</li>
        </ul>
        <p>We may remove content or accounts that break these rules.</p>
      </LegalSection>

      <LegalSection title="Rooms and messages">
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>What you write belongs to you. By posting it, you let us store it and show it to the people in that room or conversation.</li>
          <li>Rooms are temporary: a room that is more than a day old and has nobody in it is deleted automatically, along with its chat history. Direct messages are kept.</li>
          <li>Private rooms are protected by a password chosen by their owner. Don&apos;t share it with people who shouldn&apos;t join.</li>
        </ul>
      </LegalSection>

      <LegalSection title="The AI assistant">
        <p>The assistant is powered by Google Gemini. Its answers can be wrong or incomplete, so double-check anything important, and don&apos;t rely on it for medical, legal or financial advice. Your questions and chat messages are sent to Google to generate answers, as explained in the <Link href="/privacy-policy" className="underline">privacy policy</Link>.</p>
      </LegalSection>

      <LegalSection title="Your data">
        <p>The <Link href="/privacy-policy" className="underline">privacy policy</Link> explains what we collect and why. You can download all of your data or delete your account at any time from your <Link href="/profile" className="underline">profile</Link>.</p>
      </LegalSection>

      <LegalSection title="No guarantees">
        <p>This is a student project, provided as is and free of charge. It may be unavailable, change, or have its data reset without notice, and we can&apos;t guarantee it is free of bugs. Don&apos;t use it to store anything you can&apos;t afford to lose.</p>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>We may update these terms as the project evolves. If you keep using ft_cluster after a change, you accept the new version.</p>
      </LegalSection>
    </LegalPage>
  );
}
