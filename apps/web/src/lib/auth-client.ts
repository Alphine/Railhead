"use client";

import { createAuthClient } from "better-auth/react";

// The client only ever needs same-origin requests in this app, so no
// baseURL override is required — better-auth/react defaults to
// window.location.origin.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
