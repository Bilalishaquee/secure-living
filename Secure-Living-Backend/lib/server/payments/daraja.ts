// Safaricom Daraja API client (Lipa Na M-Pesa Online / STK Push, plus B2C payouts).
// This is the only payment gateway wired into the platform today — every route that
// needs to talk to Safaricom goes through this module rather than calling the Daraja
// REST API directly, so a future provider only requires a new module, not touched call sites.

const SANDBOX_BASE_URL = "https://sandbox.safaricom.co.ke";
const PRODUCTION_BASE_URL = "https://api.safaricom.co.ke";

function baseUrl(): string {
  return process.env.DARAJA_ENV === "production" ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/** Normalizes a Kenyan phone number (07..., +2547..., 2547...) to Safaricom's expected 2547XXXXXXXX / 2541XXXXXXXX form. */
export function normalizeKenyanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
  return digits;
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const consumerKey = requireEnv("DARAJA_CONSUMER_KEY");
  const consumerSecret = requireEnv("DARAJA_CONSUMER_SECRET");
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const res = await fetch(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`Daraja OAuth failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: string };

  cachedToken = {
    value: json.access_token,
    // Refresh a little early to avoid using a token that expires mid-request.
    expiresAt: Date.now() + (Number(json.expires_in) - 60) * 1000,
  };
  return cachedToken.value;
}

export type StkPushRequest = {
  phoneNumber: string;
  amountKes: number;
  accountReference: string;
  transactionDesc: string;
  callbackUrl: string;
};

export type StkPushResponse = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
};

/** Initiates an STK Push (Lipa Na M-Pesa Online) prompt on the payer's phone. */
export async function stkPush(req: StkPushRequest): Promise<StkPushResponse> {
  const shortcode = requireEnv("DARAJA_BUSINESS_SHORTCODE");
  const passkey = requireEnv("DARAJA_PASSKEY");
  const ts = timestamp();
  const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");
  const phone = normalizeKenyanPhone(req.phoneNumber);
  const token = await getAccessToken();

  const res = await fetch(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(req.amountKes),
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: req.callbackUrl,
      AccountReference: req.accountReference.slice(0, 12),
      TransactionDesc: req.transactionDesc.slice(0, 13),
    }),
  });

  const json = (await res.json()) as StkPushResponse & { errorMessage?: string; errorCode?: string };
  if (!res.ok || json.ResponseCode !== "0") {
    throw new Error(`Daraja STK Push failed: ${json.errorMessage ?? json.ResponseDescription ?? res.statusText}`);
  }
  return json;
}

/** Shape of the callback POST body Safaricom sends to CallBackURL after the customer acts on the STK prompt. */
export type StkCallbackBody = {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value?: string | number }>;
      };
    };
  };
};

export type ParsedStkCallback = {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  amount?: number;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
};

export function parseStkCallback(body: StkCallbackBody): ParsedStkCallback {
  const cb = body.Body.stkCallback;
  const items = cb.CallbackMetadata?.Item ?? [];
  const find = (name: string) => items.find((i) => i.Name === name)?.Value;
  return {
    merchantRequestId: cb.MerchantRequestID,
    checkoutRequestId: cb.CheckoutRequestID,
    resultCode: cb.ResultCode,
    resultDesc: cb.ResultDesc,
    amount: find("Amount") as number | undefined,
    mpesaReceiptNumber: find("MpesaReceiptNumber") as string | undefined,
    transactionDate: find("TransactionDate") != null ? String(find("TransactionDate")) : undefined,
    phoneNumber: find("PhoneNumber") != null ? String(find("PhoneNumber")) : undefined,
  };
}

export type B2cPayoutRequest = {
  phoneNumber: string;
  amountKes: number;
  remarks: string;
  occasion?: string;
  resultUrl: string;
  timeoutUrl: string;
  commandId?: "BusinessPayment" | "SalaryPayment" | "PromotionPayment";
};

/**
 * Sends money out to a customer (e.g. tenant deposit refund, provider payout).
 * Requires DARAJA_INITIATOR_NAME + DARAJA_SECURITY_CREDENTIAL (Go-Live only —
 * not available/needed in sandbox testing without a registered initiator).
 */
export async function b2cPayout(req: B2cPayoutRequest): Promise<{ ConversationID: string; OriginatorConversationID: string; ResponseDescription: string }> {
  const shortcode = requireEnv("DARAJA_BUSINESS_SHORTCODE");
  const initiatorName = requireEnv("DARAJA_INITIATOR_NAME");
  const securityCredential = requireEnv("DARAJA_SECURITY_CREDENTIAL");
  const token = await getAccessToken();

  const res = await fetch(`${baseUrl()}/mpesa/b2c/v1/paymentrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      InitiatorName: initiatorName,
      SecurityCredential: securityCredential,
      CommandID: req.commandId ?? "BusinessPayment",
      Amount: Math.round(req.amountKes),
      PartyA: shortcode,
      PartyB: normalizeKenyanPhone(req.phoneNumber),
      Remarks: req.remarks.slice(0, 100),
      QueueTimeOutURL: req.timeoutUrl,
      ResultURL: req.resultUrl,
      Occasion: (req.occasion ?? "").slice(0, 100),
    }),
  });

  const json = (await res.json()) as {
    ConversationID: string;
    OriginatorConversationID: string;
    ResponseDescription: string;
    errorMessage?: string;
  };
  if (!res.ok) throw new Error(`Daraja B2C payout failed: ${json.errorMessage ?? res.statusText}`);
  return json;
}
