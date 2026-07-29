import { createClient } from "npm:@supabase/supabase-js@2";
import { md5, parameterString } from "../_shared/payfast.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const body = await request.text();
    const fields = Object.fromEntries(new URLSearchParams(body).entries());
    const signature = fields.signature;
    if (!signature || md5(parameterString(fields, Deno.env.get("PAYFAST_PASSPHRASE"))) !== signature) {
      throw new Error("Invalid signature.");
    }
    if (fields.merchant_id !== Deno.env.get("PAYFAST_MERCHANT_ID")) throw new Error("Invalid merchant.");

    const sandbox = Deno.env.get("PAYFAST_SANDBOX") === "true";
    const validationUrl = sandbox
      ? "https://sandbox.payfast.co.za/eng/query/validate"
      : "https://www.payfast.co.za/eng/query/validate";
    const validation = await fetch(validationUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if ((await validation.text()).trim() !== "VALID") throw new Error("PayFast rejected the notification.");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: application, error } = await admin.from("applications")
      .select("id,payment_amount")
      .eq("payment_ref", fields.m_payment_id).single();
    if (error || !application) throw new Error("Unknown payment reference.");
    if (Number(application.payment_amount).toFixed(2) !== Number(fields.amount_gross).toFixed(2)) {
      throw new Error("Payment amount mismatch.");
    }
    if (fields.payment_status === "COMPLETE") {
      const { error: updateError } = await admin.from("applications").update({
        status: "under_review",
        payfast_payment_id: fields.pf_payment_id,
        paid_at: new Date().toISOString(),
      }).eq("id", application.id).eq("status", "pending_payment");
      if (updateError) throw updateError;
    }
    return new Response("OK");
  } catch (error) {
    console.error("PayFast ITN rejected:", error);
    return new Response("Invalid notification", { status: 400 });
  }
});
