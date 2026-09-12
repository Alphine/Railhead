import type { NextRequest } from "next/server";
import { getAuth } from "../../../../src/lib/auth";

// Better Auth's instance (and the env validation it depends on) is built
// lazily on first request, not at module load time — so we call getAuth()
// inside each handler rather than using toNextJsHandler(auth.handler) at
// module scope.
export async function GET(request: NextRequest) {
  return getAuth().handler(request);
}

export async function POST(request: NextRequest) {
  return getAuth().handler(request);
}
