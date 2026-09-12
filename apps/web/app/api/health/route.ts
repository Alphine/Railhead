import { NextResponse } from "next/server";

// Railway healthcheck endpoint. Deliberately does not touch the database or
// any other dependency — it only proves the process is up and serving
// requests.
export async function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
