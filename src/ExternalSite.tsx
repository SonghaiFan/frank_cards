import "./ExternalSite.css";

type ExternalPage = "marketing" | "privacy" | "support";

const Brand = () => (
  <a className="site-brand" href="/" aria-label="FrankCards home">
    <img src="/frank-signature.svg" alt="Frank" />
    <strong>Cards</strong>
  </a>
);

const Header = ({ page }: { page: ExternalPage }) => (
  <header className="site-header">
    <Brand />
    <nav className="site-nav" aria-label="Primary navigation">
      <a href={page === "marketing" ? "/support/" : "/marketing/"}>{page === "marketing" ? "Support" : "About"}</a>
      <a href="/">Open app</a>
    </nav>
  </header>
);

const Footer = ({ page }: { page: ExternalPage }) => (
  <footer className="site-footer">
    <span>FrankCards</span>
    <span><a href="/privacy/">Privacy</a><span aria-hidden="true"> · </span><a href={page === "marketing" ? "/support/" : "/marketing/"}>{page === "marketing" ? "Support" : "About FrankCards"}</a></span>
  </footer>
);

function MarketingPage() {
  return (
    <div className="site-shell">
      <Header page="marketing" />
      <main>
        <section className="marketing-hero" aria-labelledby="marketing-title">
          <div className="marketing-copy">
            <h1 id="marketing-title">A good question changes the room.</h1>
            <p>FrankCards helps people put their phones down, take turns, and make space for the conversations that matter.</p>
            <div className="marketing-actions">
              <a className="button" href="/">Open FrankCards</a>
              <a className="button secondary" href="/support/">Get support</a>
            </div>
          </div>
          <figure className="marketing-art">
            <img src="/media/frankcards-flat-conversation.jpg" alt="Two people sharing coffee and conversation cards at a table" />
          </figure>
        </section>
        <section className="marketing-note" aria-label="About FrankCards">
          <h2>Less choosing. More talking.</h2>
          <p>Start with a curated pack, or make a private topic that fits the people in front of you. Every card gives the next person somewhere honest to begin.</p>
        </section>
      </main>
      <Footer page="marketing" />
    </div>
  );
}

function SupportPage() {
  return (
    <div className="site-shell">
      <Header page="support" />
      <main className="support-main">
        <section className="support-hero" aria-labelledby="support-title">
          <h1 id="support-title">Support for a better conversation.</h1>
          <p>Find quick answers below, or email us when you need a hand with FrankCards.</p>
        </section>
        <div className="support-grid">
          <section className="support-section" aria-labelledby="questions-title">
            <h2 id="questions-title">Common questions</h2>
            <div className="support-questions">
              <details><summary>How do I start a card pack?</summary><p>Open FrankCards, choose a pack, then start the session. Pass the device around and let each card guide the next turn.</p></details>
              <details><summary>Why do I need an account?</summary><p>Built-in packs can be explored without an account. An account is needed to create and save your own topics, upload an avatar, like Community packs, or submit a topic for review.</p></details>
              <details><summary>How do Community topics work?</summary><p>Topics you create stay private until you submit them. Community submissions are reviewed before they are published.</p></details>
              <details><summary>What happens when I use AI-assisted drafting?</summary><p>It is optional. Your topic and card settings are sent to the compatible AI provider you select. Your API key is used for that request and is not saved by FrankCards.</p></details>
              <details><summary>How can I request account deletion?</summary><p>Email us from the address linked to your account with the subject “FrankCards account deletion”. Include the email address of the account you want removed. We will verify the request before processing it.</p></details>
            </div>
          </section>
          <aside className="support-contact" aria-labelledby="contact-title">
            <h2 id="contact-title">Still need help?</h2>
            <p>Tell us what happened, what device you use, and any error message you saw.</p>
            <a className="button" href="mailto:hello@frankcards.songhai.one?subject=FrankCards%20support">Email FrankCards support</a>
            <small>For account help, contact us from the email address connected to your FrankCards account.</small>
          </aside>
        </div>
      </main>
      <Footer page="support" />
    </div>
  );
}

function PrivacyPage() {
  return (
    <div className="site-shell">
      <Header page="privacy" />
      <main className="privacy-main">
        <section className="privacy-hero" aria-labelledby="privacy-title">
          <p className="privacy-kicker">Effective 8 September 2026</p>
          <h1 id="privacy-title">Privacy that stays clear.</h1>
          <p>This policy explains what FrankCards collects, why it is used, and the choices you have.</p>
        </section>
        <div className="privacy-layout">
          <nav className="privacy-nav" aria-label="Privacy policy sections">
            <a href="#data">Information we collect</a>
            <a href="#use">How we use it</a>
            <a href="#sharing">When it is shared</a>
            <a href="#retention">Retention and deletion</a>
            <a href="#contact">Contact us</a>
          </nav>
          <article className="privacy-copy">
            <p>FrankCards is a conversation-card app. We collect only the information needed to provide accounts, personal topics, Community features, and optional AI-assisted drafting.</p>
            <section id="data"><h2>Information we collect</h2><p><strong>Account information.</strong> If you create an account, we collect your email address and an account identifier. You may also provide a display name and an avatar image.</p><p><strong>Content you create.</strong> We store the titles, categories, questions, cards, and related details of topics you create. Topics remain private unless you submit them for Community review. Published Community topics may display your chosen profile name and avatar.</p><p><strong>Interactions and preferences.</strong> We store Community pack likes with your account. Your language, theme, reading-side preference, and a local unlock preference may be stored on your device.</p><p><strong>Optional AI-assisted drafting.</strong> If you choose to use it, the topic, audience, language, card settings, and prompt you provide are sent to the compatible AI provider you select. Your API key is used for that request and is not saved by FrankCards.</p></section>
            <section id="use"><h2>How we use information</h2><p>We use account information to sign you in, send account confirmation or password-reset emails, and protect your account. We use your profile, topics, and likes to provide the features you request. We use optional AI inputs only to generate the draft you ask for.</p></section>
            <section id="sharing"><h2>When information is shared</h2><p>FrankCards uses Supabase to provide authentication, database, and avatar storage services. Public Community topics, profile names, avatars, and aggregate pack likes can be visible to other FrankCards users. When you choose AI-assisted drafting, your input is sent directly to the provider you select, such as OpenAI, DeepSeek, Kimi, or a compatible custom provider.</p><p>FrankCards does not use your information for cross-app advertising tracking and does not sell personal information.</p></section>
            <section id="retention"><h2>Retention and deletion</h2><p>We keep your account information and private content while your account is active. You can delete your own topics and avatar from the app where those controls are available. You can permanently delete your account from My Topics, under Public profile. This removes your account, profile, avatar, topics, Community submissions, and likes. If you cannot access the app, email us from the address linked to the account with the subject “FrankCards account deletion”.</p><p>Some information may be retained where needed to prevent abuse, resolve disputes, meet legal obligations, or enforce our terms.</p></section>
            <section id="contact"><h2>Contact us</h2><p>For privacy questions or a deletion request, email <a href="mailto:hello@frankcards.songhai.one?subject=FrankCards%20privacy">hello@frankcards.songhai.one</a>.</p></section>
            <section><h2>Changes to this policy</h2><p>If this policy changes materially, we will update this page and revise its effective date.</p></section>
          </article>
        </div>
      </main>
      <Footer page="privacy" />
    </div>
  );
}

export default function ExternalSite({ page }: { page: ExternalPage }) {
  if (page === "support") return <SupportPage />;
  if (page === "privacy") return <PrivacyPage />;
  return <MarketingPage />;
}
