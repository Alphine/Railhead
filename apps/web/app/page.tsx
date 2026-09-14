"use client";

import { useState } from "react";

type Plan = "monthly" | "annual";

export default function HomePage() {
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function subscribe(plan: Plan) {
    setError(null);
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Failed to start checkout");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoadingPlan(null);
    }
  }

  return (
    <main className="rh-landing">
      <div className="rh-glow rh-glow-top" />
      <div className="rh-glow rh-glow-side" />

      <div className="rh-shell">
        <nav className="rh-nav">
          <div className="rh-wordmark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 17 L10 5 L14 5 L20 17" />
              <path d="M7.2 11 H16.8" />
              <path d="M2.5 20.5 H21.5" />
            </svg>
            <span>Railhead</span>
          </div>
          <div className="rh-nav-links">
            <a href="#pricing">Pricing</a>
            <a href="#stack">Stack</a>
            <a href="/sign-in" className="rh-nav-signin">
              Sign in
            </a>
          </div>
        </nav>

        <section className="rh-hero">
          <span className="rh-eyebrow">
            <span className="rh-eyebrow-dot" />
            SaaS starter for Railway
          </span>

          <h1 className="rh-headline">
            Deploy a SaaS,
            <br />
            not <em>the plumbing</em>.
          </h1>

          <p className="rh-subhead">
            Next.js, Postgres, Better Auth, Stripe billing, and a background worker that
            outlives a request — wired together, one Railway deploy away.
          </p>

          <div className="rh-hero-actions">
            <a href="#pricing" className="rh-btn rh-btn-primary">
              Get started
            </a>
            <a href="https://github.com/Alphine/Railhead" className="rh-btn rh-btn-ghost">
              View source
            </a>
          </div>

          <div id="stack" className="rh-stack-row">
            {["Next.js 15", "Postgres", "Better Auth", "Stripe", "Resend", "BullMQ"].map(
              (item, i) => (
                <span key={item} className="rh-stack-item">
                  {i > 0 && <span className="rh-stack-dot" />}
                  {item}
                </span>
              ),
            )}
          </div>
        </section>

        <section className="rh-features">
          <div className="rh-feature">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2 L4 14 H11 L10 22 L20 9 H13 Z" />
            </svg>
            <h3>Billing that just works</h3>
            <p>
              Stripe Checkout and webhooks, verified and queued — never blocking the 5-second
              response window.
            </p>
          </div>
          <div className="rh-feature">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="6" rx="1.5" />
              <rect x="3" y="14" width="18" height="6" rx="1.5" />
              <path d="M7 7 H7.01 M7 17 H7.01" />
            </svg>
            <h3>A worker that outlives a request</h3>
            <p>A real BullMQ consumer on Redis — the one thing serverless platforms can&apos;t one-click.</p>
          </div>
          <div className="rh-feature">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11 V7 a4 4 0 0 1 8 0 v4" />
            </svg>
            <h3>Auth without the SaaS tax</h3>
            <p>Better Auth, self-hosted on your own Postgres — no per-MAU bill from a third party.</p>
          </div>
        </section>

        <section id="pricing" className="rh-pricing">
          <div className="rh-pricing-head">
            <span className="rh-eyebrow-label">Pricing</span>
            <h2>One plan, billed your way.</h2>
          </div>

          {error && <p className="rh-error">{error}</p>}

          <div className="rh-pricing-grid">
            <div className="rh-plan-card">
              <h3 className="rh-plan-name">Monthly</h3>
              <div className="rh-plan-price">
                <span>$[YOUR&nbsp;PRICE]</span>
                <small>/ month</small>
              </div>
              <p className="rh-plan-sub">Billed every month. Cancel anytime.</p>

              <ul className="rh-plan-features">
                <li>Full source, self-hosted on Railway</li>
                <li>Auth, billing, and worker included</li>
                <li>Cancel anytime</li>
              </ul>

              <button
                className="rh-btn rh-btn-outline rh-plan-cta"
                onClick={() => subscribe("monthly")}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === "monthly" ? "Redirecting…" : "Subscribe"}
              </button>
            </div>

            <div className="rh-plan-card rh-plan-card-featured">
              <span className="rh-plan-badge">Best value</span>
              <h3 className="rh-plan-name">Annual</h3>
              <div className="rh-plan-price">
                <span>$[YOUR&nbsp;PRICE]</span>
                <small>/ year</small>
              </div>
              <p className="rh-plan-sub">Billed once a year — [YOUR&nbsp;DISCOUNT]% off monthly.</p>

              <ul className="rh-plan-features">
                <li>Everything in Monthly</li>
                <li>Priority for template updates</li>
                <li>Lock in this year&apos;s rate</li>
              </ul>

              <button
                className="rh-btn rh-btn-primary rh-plan-cta"
                onClick={() => subscribe("annual")}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === "annual" ? "Redirecting…" : "Subscribe"}
              </button>
            </div>
          </div>

          <p className="rh-signin-line">
            Already have an account? <a href="/sign-in">Sign in</a>
          </p>
        </section>

        <footer className="rh-footer">
          <span>Railhead — a Railway template.</span>
          <div className="rh-footer-links">
            <a href="https://github.com/Alphine/Railhead">GitHub</a>
            <a href="https://railway.com">Deploy on Railway</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
