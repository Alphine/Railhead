import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export interface ReceiptEmailProps {
  amount: number;
  currency: string;
  subscriptionId: string;
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export function ReceiptEmail({
  amount,
  currency,
  subscriptionId,
}: ReceiptEmailProps) {
  const formattedAmount = formatAmount(amount, currency);
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Html>
      <Head />
      <Preview>{`Your Railhead receipt for ${formattedAmount}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Railhead</Heading>
          <Text style={paragraph}>
            Thanks for your payment. Here is your receipt.
          </Text>
          <Section style={card}>
            <Row style={row}>
              <Column>
                <Text style={label}>Amount</Text>
              </Column>
              <Column align="right">
                <Text style={value}>{formattedAmount}</Text>
              </Column>
            </Row>
            <Hr style={hr} />
            <Row style={row}>
              <Column>
                <Text style={label}>Subscription ID</Text>
              </Column>
              <Column align="right">
                <Text style={value}>{subscriptionId}</Text>
              </Column>
            </Row>
            <Hr style={hr} />
            <Row style={row}>
              <Column>
                <Text style={label}>Date</Text>
              </Column>
              <Column align="right">
                <Text style={value}>{date}</Text>
              </Column>
            </Row>
          </Section>
          <Text style={footer}>
            If you have any questions about this charge, reply to this email
            and we&apos;ll be happy to help.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ReceiptEmail;

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "32px",
  maxWidth: "480px",
  borderRadius: "8px",
};

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#111827",
  marginBottom: "16px",
};

const paragraph: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#374151",
};

const card: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "20px 0",
};

const row: React.CSSProperties = {
  padding: "6px 0",
};

const label: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  margin: 0,
};

const value: React.CSSProperties = {
  fontSize: "13px",
  color: "#111827",
  fontWeight: 600,
  margin: 0,
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "4px 0",
};

const footer: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  marginTop: "16px",
};
