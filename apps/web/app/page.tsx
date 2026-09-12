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
    <main>
      <h1>Railhead</h1>
      <p>A batteries-included SaaS starter for Railway.</p>

      {error && <p className="error">{error}</p>}

      <div className="plans">
        <div className="plan-card">
          <h2>Monthly</h2>
          <p>Billed every month. Cancel anytime.</p>
          <button
            onClick={() => subscribe("monthly")}
            disabled={loadingPlan !== null}
          >
            {loadingPlan === "monthly" ? "Redirecting…" : "Subscribe"}
          </button>
        </div>
        <div className="plan-card">
          <h2>Annual</h2>
          <p>Billed once a year. Best value.</p>
          <button
            onClick={() => subscribe("annual")}
            disabled={loadingPlan !== null}
          >
            {loadingPlan === "annual" ? "Redirecting…" : "Subscribe"}
          </button>
        </div>
      </div>

      <p style={{ marginTop: "2rem" }}>
        Already have an account? <a href="/sign-in">Sign in</a>
      </p>
    </main>
  );
}
