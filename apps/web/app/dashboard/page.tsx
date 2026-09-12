import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema } from "@railhead/db";
import { getAuth } from "../../src/lib/auth";

export default async function DashboardPage() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, session.user.id),
  });

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Signed in as {session.user.email}.</p>

      <h2>Subscription</h2>
      {subscription ? (
        <table>
          <tbody>
            <tr>
              <th>Status</th>
              <td>
                <span className="status-badge">{subscription.status}</span>
              </td>
            </tr>
            <tr>
              <th>Price</th>
              <td>{subscription.priceId ?? "—"}</td>
            </tr>
            <tr>
              <th>Current period end</th>
              <td>
                {subscription.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleString()
                  : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p>
          No active subscription yet. <a href="/">Subscribe on the pricing page</a>.
        </p>
      )}
    </main>
  );
}
