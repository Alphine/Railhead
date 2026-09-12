import { render } from "@react-email/render";
import { Resend } from "resend";
import * as React from "react";
import { MagicLinkEmail } from "./templates/MagicLinkEmail.js";
import { ReceiptEmail } from "./templates/ReceiptEmail.js";

interface ResendEnv {
  apiKey: string;
  fromEmail: string;
}

function getResendEnv(): ResendEnv {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  const missing: string[] = [];
  if (!apiKey) missing.push("RESEND_API_KEY");
  if (!fromEmail) missing.push("RESEND_FROM_EMAIL");

  if (missing.length > 0) {
    throw new Error(
      `@railhead/email: missing required environment variable(s): ${missing.join(
        ", "
      )}. Set them before sending email.`
    );
  }

  return { apiKey: apiKey as string, fromEmail: fromEmail as string };
}

export interface SendMagicLinkEmailParams {
  to: string;
  url: string;
}

export async function sendMagicLinkEmail({
  to,
  url,
}: SendMagicLinkEmailParams): Promise<void> {
  const { apiKey, fromEmail } = getResendEnv();
  const resend = new Resend(apiKey);

  const html = await render(React.createElement(MagicLinkEmail, { url }));

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: "Sign in to Railhead",
    html,
  });

  if (error) {
    throw new Error(`@railhead/email: failed to send magic link email: ${error.message}`);
  }
}

export interface SendReceiptEmailParams {
  to: string;
  amount: number;
  currency: string;
  subscriptionId: string;
}

export async function sendReceiptEmail({
  to,
  amount,
  currency,
  subscriptionId,
}: SendReceiptEmailParams): Promise<void> {
  const { apiKey, fromEmail } = getResendEnv();
  const resend = new Resend(apiKey);

  const html = await render(
    React.createElement(ReceiptEmail, { amount, currency, subscriptionId })
  );

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: "Your Railhead payment receipt",
    html,
  });

  if (error) {
    throw new Error(`@railhead/email: failed to send receipt email: ${error.message}`);
  }
}
