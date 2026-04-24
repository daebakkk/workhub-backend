import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const FEATURES = [
  {
    icon: '⏱',
    title: 'Timer & manual logs',
    desc: 'Start a timer or log hours manually. Every second of work captured, linked to a project and task.',
  },
  {
    icon: '📁',
    title: 'Project tracking',
    desc: 'Create projects, assign tasks with required hours, and watch progress move as logs come in.',
  },
  {
    icon: '✓',
    title: 'Approval workflow',
    desc: 'Admins review, approve or reject logs with one click. Staff get notified instantly.',
  },
  {
    icon: '📊',
    title: 'Leaderboard',
    desc: 'See who\'s putting in the hours. Spot overworked and underworked team members at a glance.',
  },
  {
    icon: '🎯',
    title: 'Weekly goals',
    desc: 'Set a weekly hour target and track your progress against it right from the dashboard.',
  },
  {
    icon: '📄',
    title: 'Reports',
    desc: 'Generate detailed breakdowns by project, date, and status. Export-ready summaries.',
  },
];

const STEPS = [
  { num: '01', title: 'Log your work', desc: 'Use the timer or manual entry to capture what you worked on, how long, and which project.' },
  { num: '02', title: 'Get approved', desc: 'Your admin reviews and approves logs. You get notified and your hours count toward your goal.' },
  { num: '03', title: 'Track progress', desc: 'Watch task progress bars move, hit your weekly goal, and climb the leaderboard.' },
];

export default function Home() {
  return (
    <div className="landingPage">
      <header className="landingTopBar">
        <div className="landingLogo">
          <span className="logoBadge">WH</span>
          <div>
            <p className="logoName">WorkHub</p>
            <p className="logoTag">Work smarter, together</p>
          </div>
        </div>
        <Navbar />
      </header>

      <main className="landingMain">

        {/* ── Hero ── */}
        <section className="landingHero">
          <div className="heroGrid">
            <div className="heroCopy">
              <p className="heroKicker">Built for dev teams</p>
              <h1 className="heroTitle">
                Track work.<br />
                Ship faster.<br />
                <span className="heroAccent">Stay aligned.</span>
              </h1>
              <p className="heroSubtitle">
                WorkHub gives your team one place to log hours, manage projects,
                and celebrate progress — without the spreadsheet chaos.
              </p>
              <div className="heroButtons">
                <Link className="btn btnPrimary" to="/signup">Get started free</Link>
                <Link className="btn btnSecondary" to="/login">Sign in</Link>
              </div>
              <div className="heroHighlights">
                <div className="heroHighlightItem">
                  <p className="heroHighlightValue">50+</p>
                  <p className="heroHighlightLabel">Specializations</p>
                </div>
                <div className="heroHighlightItem">
                  <p className="heroHighlightValue">Live</p>
                  <p className="heroHighlightLabel">Auto-refresh</p>
                </div>
                <div className="heroHighlightItem">
                  <p className="heroHighlightValue">1</p>
                  <p className="heroHighlightLabel">Unified workspace</p>
                </div>
              </div>
            </div>

            <div className="heroVisual">
              <div className="heroCard heroCardMain">
                <img src="/landing-hero.svg" alt="WorkHub dashboard" className="heroImage heroImageLight" />
                <img src="/landing-hero-dark.svg" alt="WorkHub dashboard" className="heroImage heroImageDark" />
                <div className="heroCardFooter">
                  <div>
                    <p className="heroCardTitle">Weekly cadence</p>
                    <p className="heroCardSubtitle">Stay ahead of approvals</p>
                  </div>
                  <span className="statusPill">On track</span>
                </div>
              </div>
              <div className="heroCard heroCardMini">
                <img src="/landing-collab.svg" alt="Team collaboration" className="heroImageMini heroImageLight" />
                <img src="/landing-collab-dark.svg" alt="Team collaboration" className="heroImageMini heroImageDark" />
                <div>
                  <p className="heroCardTitle">Team-ready</p>
                  <p className="heroCardSubtitle">Assign, align, deliver</p>
                </div>
              </div>
              <div className="floatingBadge">
                <span>✨</span>
                <p>Focused. Clear. Fast.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="landingSection">
          <div className="sectionHeader">
            <p className="sectionKicker">Features</p>
            <h2>Everything your team needs</h2>
            <p className="sectionSub">No bloat. Just the tools that keep work moving.</p>
          </div>
          <div className="featureGrid">
            {FEATURES.map((f) => (
              <article className="featureCard" key={f.title}>
                <span className="featureIcon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="landingSection">
          <div className="sectionHeader">
            <p className="sectionKicker">How it works</p>
            <h2>Up and running in minutes</h2>
            <p className="sectionSub">Three steps from signup to full visibility.</p>
          </div>
          <div className="stepsGrid">
            {STEPS.map((s) => (
              <div className="stepCard" key={s.num}>
                <span className="stepNum">{s.num}</span>
                <h3 className="stepTitle">{s.title}</h3>
                <p className="stepDesc">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="landingSection ctaSection">
          <div className="ctaPanel">
            <div className="ctaCopy">
              <h2>Ready to make progress feel good?</h2>
              <p>Get your team set up in minutes. No credit card required.</p>
            </div>
            <div className="heroButtons">
              <Link className="btn btnPrimary" to="/signup">Create your account</Link>
              <Link className="btn btnSecondary" to="/login">I already have one</Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
