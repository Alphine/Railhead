import { getDeadLetterJobs, QUEUE_NAMES, type QueueName } from "@railhead/queue";

// This page reads live queue state (Redis) on every request — it must never
// be statically prerendered at build time (there is no Redis connection
// available then), so force dynamic (SSR) rendering.
export const dynamic = "force-dynamic";

const QUEUES: QueueName[] = Object.values(QUEUE_NAMES);

async function loadDeadLetterJobs() {
  const results = await Promise.all(
    QUEUES.map(async (name) => ({
      name,
      jobs: await getDeadLetterJobs(name),
    }))
  );
  return results;
}

export default async function AdminJobsPage() {
  const queues = await loadDeadLetterJobs();

  return (
    <main>
      <h1>Dead-letter jobs</h1>
      <p>Failed jobs across all queues, for manual inspection.</p>

      {queues.map(({ name, jobs }) => (
        <section key={name} style={{ marginTop: "2rem" }}>
          <h2>{name}</h2>
          {jobs.length === 0 ? (
            <p>No failed jobs.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Attempts</th>
                  <th>Failed reason</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.id}</td>
                    <td>{job.attemptsMade}</td>
                    <td>{job.failedReason ?? "—"}</td>
                    <td>
                      <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                        {JSON.stringify(job.data, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </main>
  );
}
