// @ts-ignore - Deno runtime will resolve these imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno runtime will resolve these imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare Deno global for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Document {
  id: string;
  user_id: string;
  type: string;
  name: string;
  expiry_date: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get current date and calculate reminder dates
    const today = new Date();
    const fourMonthsFromNow = new Date(
      today.getTime() + 120 * 24 * 60 * 60 * 1000
    ); // 4 months
    const oneMonthFromNow = new Date(
      today.getTime() + 30 * 24 * 60 * 60 * 1000
    ); // 1 month
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
    const threeDaysFromNow = new Date(
      today.getTime() + 3 * 24 * 60 * 60 * 1000
    ); // 3 days

    // Format dates for SQL query
    const formatDate = (date: Date): string => date.toISOString().split("T")[0];

    // Query documents that need reminders
    const { data: documents, error } = await supabaseClient
      .from("documents")
      .select("id, user_id, type, name, expiry_date")
      .in("expiry_date", [
        formatDate(fourMonthsFromNow),
        formatDate(oneMonthFromNow),
        formatDate(oneWeekFromNow),
        formatDate(threeDaysFromNow),
      ]);

    if (error) {
      throw error;
    }

    console.log(`Found ${documents?.length || 0} documents needing reminders`);

    // Send emails for each document
    const emailPromises =
      documents?.map(async (doc: Document) => {
        // Get user email using RPC function
        const { data: userEmail, error: userError } = await supabaseClient.rpc(
          "get_user_email",
          { user_uuid: doc.user_id }
        );

        if (userError || !userEmail) {
          console.error(
            `Failed to get email for user ${doc.user_id}:`,
            userError
          );
          return null;
        }

        const expiryDate = new Date(doc.expiry_date);
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        let reminderType = "";
        let urgencyLevel = "";

        if (daysUntilExpiry <= 3) {
          reminderType = "URGENT - 3 Days Left";
          urgencyLevel = "urgent";
        } else if (daysUntilExpiry <= 7) {
          reminderType = "1 Week Reminder";
          urgencyLevel = "warning";
        } else if (daysUntilExpiry <= 30) {
          reminderType = "1 Month Reminder";
          urgencyLevel = "notice";
        } else {
          reminderType = "4 Month Reminder";
          urgencyLevel = "info";
        }

        return sendReminderEmail({
          to: userEmail,
          documentName: doc.name,
          documentType: doc.type,
          expiryDate: doc.expiry_date,
          daysUntilExpiry,
          reminderType,
          urgencyLevel,
        });
      }) || [];

    // Wait for all emails to be sent
    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${
          documents?.length || 0
        } documents. Sent: ${successful}, Failed: ${failed}`,
        results: results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-reminders function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function sendReminderEmail({
  to,
  documentName,
  documentType,
  expiryDate,
  daysUntilExpiry,
  reminderType,
  urgencyLevel,
}: {
  to: string;
  documentName: string;
  documentType: string;
  expiryDate: string;
  daysUntilExpiry: number;
  reminderType: string;
  urgencyLevel: string;
}): Promise<any> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    console.error("RESEND_API_KEY not found in environment variables");
    throw new Error("RESEND_API_KEY not found in environment variables");
  }

  console.log("Sending email to:", to);
  console.log("Using API key prefix:", resendApiKey.substring(0, 8) + "...");

  // Format expiry date nicely
  const formattedDate = new Date(expiryDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Choose emoji and colors based on urgency
  const urgencyConfig: Record<
    string,
    { emoji: string; color: string; bgColor: string }
  > = {
    urgent: { emoji: "🚨", color: "#dc2626", bgColor: "#fef2f2" },
    warning: { emoji: "⚠️", color: "#d97706", bgColor: "#fffbeb" },
    notice: { emoji: "📅", color: "#2563eb", bgColor: "#eff6ff" },
    info: { emoji: "📋", color: "#059669", bgColor: "#f0fdf4" },
  };

  const config = urgencyConfig[urgencyLevel] ?? urgencyConfig.info;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document Expiry Reminder</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
              🕒 DocReminder
            </h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">
              Document Expiry Notification
            </p>
          </div>

          <!-- Alert Banner -->
          <div style="background-color: ${
            config.bgColor
          }; border-left: 4px solid ${config.color}; padding: 16px; margin: 0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 24px;">${config.emoji}</span>
              <span style="color: ${
                config.color
              }; font-weight: 600; font-size: 18px;">
                ${reminderType}
              </span>
            </div>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">
              Your ${documentName} is expiring soon!
            </h2>
            
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Document:</span>
                  <span style="color: #1f2937; font-weight: 600;">${documentName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Type:</span>
                  <span style="color: #1f2937; text-transform: capitalize;">${documentType}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #6b7280; font-weight: 500;">Expiry Date:</span>
                  <span style="color: #dc2626; font-weight: 600;">${formattedDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                  <span style="color: #6b7280; font-weight: 500;">Days Remaining:</span>
                  <span style="color: ${
                    config.color
                  }; font-weight: 700; font-size: 18px;">${daysUntilExpiry} days</span>
                </div>
              </div>
            </div>

            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
              <p style="color: white; margin: 0 0 15px 0; font-size: 16px;">
                Don't let your document expire! Take action now.
              </p>
              <a href="${Deno.env.get("APP_URL") || "https://your-app.com"}" 
                 style="display: inline-block; background: white; color: #6366f1; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; transition: all 0.2s;">
                View My Documents
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0;">
              This is an automated reminder from DocReminder. We'll continue to send you notifications as your document expiry date approaches.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} DocReminder. Never miss an expiry date again.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "DocReminder <onboarding@resend.dev>", // Using Resend's default domain for testing
      to: [to],
      subject: `${config.emoji} ${reminderType}: ${documentName} expires in ${daysUntilExpiry} days`,
      html: emailHtml,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Resend API Error:", error);
    console.error("Response status:", response.status);
    throw new Error(`Failed to send email: ${error}`);
  }

  const result = await response.json();
  console.log(`Email sent successfully to ${to}:`, result);
  return result;
}
