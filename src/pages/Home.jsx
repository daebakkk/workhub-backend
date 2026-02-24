import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="page landingPage">
      <header className="topBar landingTopBar">
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
        <section className="landingHero">
          <div className="heroGrid">
            <div className="heroCopy">
              <p className="heroKicker">Your work, beautifully organized</p>
              <h1 className="heroTitle">
                A polished workspace for tracking progress and celebrating momentum.
              </h1>
              <p className="heroSubtitle">
                WorkHub keeps your logs, projects, and approvals in one place so teams
                stay aligned without the chaos. It’s structured, but it still feels
                human.
              </p>
              <div className="heroButtons">
                <Link className="btn btnPrimary" to="/login">
                  Login
                </Link>
                <Link className="btn btnSecondary" to="/signup">
                  Sign Up
                </Link>
              </div>
              <div className="heroHighlights">
                <div>
                  <p className="heroHighlightValue">30s</p>
                  <p className="heroHighlightLabel">Live refresh</p>
                </div>
                <div>
                  <p className="heroHighlightValue">50+</p>
                  <p className="heroHighlightLabel">Specializations</p>
                </div>
                <div>
                  <p className="heroHighlightValue">1</p>
                  <p className="heroHighlightLabel">Unified workspace</p>
                </div>
              </div>
            </div>

            <div className="heroVisual">
              <div className="heroCard heroCardMain">
                <img
                  src="/landing-hero.svg"
                  alt="WorkHub overview illustration"
                  className="heroImage heroImageLight"
                />
                <img
                  src="/landing-hero-dark.svg"
                  alt="WorkHub overview illustration"
                  className="heroImage heroImageDark"
                />
                <div className="heroCardFooter">
                  <div>
                    <p className="heroCardTitle">Weekly cadence</p>
                    <p className="heroCardSubtitle">Stay ahead of approvals</p>
                  </div>
                  <span className="statusPill">On track</span>
                </div>
              </div>
              <div className="heroCard heroCardMini">
                <img
                  src="/landing-collab.svg"
                  alt="Collaborative planning illustration"
                  className="heroImageMini heroImageLight"
                />
                <img
                  src="/landing-collab-dark.svg"
                  alt="Collaborative planning illustration"
                  className="heroImageMini heroImageDark"
                />
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

        <section className="landingSection">
          <div className="sectionHeader">
            <h2>Everything you need, nothing you don’t</h2>
            <p>
              Keep your team in flow with the right mix of structure, visibility,
              and momentum.
            </p>
          </div>
          <div className="featureGrid">
            <article className="featureCard">
              <h3>Live work logs</h3>
              <p>Capture progress in seconds and share it instantly with admins.</p>
            </article>
            <article className="featureCard">
              <h3>Project clarity</h3>
              <p>Track projects by status, teammates, and completion signals.</p>
            </article>
            <article className="featureCard">
              <h3>Approval rhythm</h3>
              <p>Approve, reject, and report without leaving the workspace.</p>
            </article>
            <article className="featureCard">
              <h3>Goal tracking</h3>
              <p>Set weekly targets and celebrate when you hit them.</p>
            </article>
          </div>
        </section>

        <section className="landingSection landingShowcase">
          <div className="showcaseCard">
            <div>
              <h2>Designed for teams who move fast</h2>
              <p>
                Admins can review logs, staff can focus on execution, and everyone
                sees the same story.
              </p>
              <div className="showcaseTags">
                <span>Approvals</span>
                <span>Reports</span>
                <span>Notifications</span>
              </div>
            </div>
            <div className="showcaseVisual">
              <div className="showcaseBubble">Reports in seconds</div>
              <div className="showcaseBubble">Auto-refresh insights</div>
              <div className="showcaseBubble">Clear accountability</div>
            </div>
          </div>
        </section>

        <section className="landingSection ctaSection">
          <div className="ctaPanel">
            <div>
              <h2>Ready to make progress feel good?</h2>
              <p>
                Get started in minutes and give your team a home for their work.
              </p>
            </div>
            <div className="heroButtons">
              <Link className="btn btnPrimary" to="/signup">
                Create your account
              </Link>
              <Link className="btn btnSecondary" to="/login">
                I already have one
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
