export { MagicLinkEmail } from "./templates/MagicLinkEmail.js";
export type { MagicLinkEmailProps } from "./templates/MagicLinkEmail.js";
export { ReceiptEmail } from "./templates/ReceiptEmail.js";
export type { ReceiptEmailProps } from "./templates/ReceiptEmail.js";

export {
  sendMagicLinkEmail,
  sendReceiptEmail,
} from "./send.js";
export type {
  SendMagicLinkEmailParams,
  SendReceiptEmailParams,
} from "./send.js";
