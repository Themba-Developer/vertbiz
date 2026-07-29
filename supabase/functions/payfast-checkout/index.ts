import { createClient } from "npm:@supabase/supabase-js@2";
import { md5, parameterString, SERVICE_PRICES } from "../_shared/payfast.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) throw new Error("Authentication required.");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) throw new Error("Authentication required.");

    const { applicationId } = await request.json();
    const { data: application, error } = await admin.from("applications")
      .select("id,user_id,service_id,primary_director_name,primary_director_email,status,payment_ref")
      .eq("id", applicationId).eq("user_id", user.id).single();
    if (error || !application) throw new Error("Application not found.");
    if (application.status !== "pending_payment") throw new Error("This application is not awaiting payment.");

    const service = SERVICE_PRICES[application.service_id];
    if (!service) throw new Error("Unsupported service.");
    const merchantId = Deno.env.get("PAYFAST_MERCHANT_ID");
    const merchantKey = Deno.env.get("PAYFAST_MERCHANT_KEY");
    const siteUrl = Deno.env.get("SITE_URL")?.replace(/\/$/, "");
    if (!merchantId || !merchantKey || !siteUrl) throw new Error("PayFast is not configured.");
    const sandbox = Deno.env.get("PAYFAST_SANDBOX") === "true";
    const paymentRef = application.payment_ref || `VCG-${crypto.randomUUID()}`;
    const names = application.primary_director_name.trim().split(/\s+/);
    const fields: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${siteUrl}/success?id=${application.id}`,
      cancel_url: `${siteUrl}/checkout?serviceId=${encodeURIComponent(application.service_id)}&applicationId=${application.id}`,
      notify_url: `${supabaseUrl}/functions/v1/payfast-itn`,
      name_first: names[0]?.slice(0, 100) || "Customer",
      name_last: names.slice(1).join(" ").slice(0, 100),
      email_address: application.primary_director_email.slice(0, 100),
      m_payment_id: paymentRef,
      amount: service.amount,
      item_name: service.name.slice(0, 100),
      custom_str1: application.id,
    };
    fields.signature = md5(parameterString(fields, Deno.env.get("PAYFAST_PASSPHRASE")));
    const { error: updateError } = await admin.from("applications").update({
      payment_ref: paymentRef,
      payment_amount: service.amount,
    }).eq("id", application.id);
    if (updateError) throw updateError;

    return Response.json({
      action: sandbox
        ? "https://sandbox.payfast.co.za/eng/process"
        : "https://www.payfast.co.za/eng/process",
      fields,
    }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Checkout failed." }, {
      status: 400, headers: corsHeaders,
    });
  }
});
