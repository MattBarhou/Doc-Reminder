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
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0;">
        <tr>
          <td style="padding: 40px 20px;">
            
            <!-- Main Container -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
              
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px 12px 0 0;">
                  <div style="width: 60px; height: 60px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 28px; line-height: 1;">🕒</span>
                  </div>
                  <h1 style="margin: 0 0 8px; color: white; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                    DocReminder
                  </h1>
                  <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                    Document Management Made Simple
                  </p>
                </td>
              </tr>
              
              <!-- Alert Banner -->
              <tr>
                <td style="padding: 0; background: ${
                  config.bgColor
                }; border-left: 4px solid ${config.color};">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="padding: 20px 40px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="width: 50px; vertical-align: top;">
                              <div style="width: 40px; height: 40px; background: ${
                                config.color
                              }; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 20px; line-height: 1;">${
                                  config.emoji
                                }</span>
                              </div>
                            </td>
                            <td style="padding-left: 16px; vertical-align: top;">
                              <h3 style="margin: 0 0 4px; color: ${
                                config.color
                              }; font-size: 18px; font-weight: 600;">
                                ${reminderType}
                              </h3>
                              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                Action required for your document
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Main Content -->
              <tr>
                <td style="padding: 40px;">
                  
                  <!-- Title -->
                  <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 24px; font-weight: 600; text-align: center; line-height: 1.3;">
                    Your ${documentName} expires soon
                  </h2>
                  
                  <p style="margin: 0 0 32px; color: #6b7280; font-size: 16px; line-height: 1.5; text-align: center;">
                    We're here to help you stay organized and never miss important deadlines.
                  </p>
                  
                  <!-- Document Details Card -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 32px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <tr>
                      <td style="padding: 24px;">
                        
                        <!-- Document Name -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                  <td style="color: #64748b; font-size: 14px; font-weight: 500;">Document</td>
                                  <td style="text-align: right; color: #1e293b; font-size: 16px; font-weight: 600;">${documentName}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Document Type -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                  <td style="color: #64748b; font-size: 14px; font-weight: 500;">Type</td>
                                  <td style="text-align: right; color: #1e293b; font-size: 16px; font-weight: 500; text-transform: capitalize;">${documentType}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Expiry Date -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 16px;">
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                  <td style="color: #64748b; font-size: 14px; font-weight: 500;">Expires On</td>
                                  <td style="text-align: right; color: #dc2626; font-size: 16px; font-weight: 600;">${formattedDate}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Days Left -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                          <tr>
                            <td style="padding: 8px 0;">
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                  <td style="color: #64748b; font-size: 14px; font-weight: 500;">Time Remaining</td>
                                  <td style="text-align: right;">
                                    <span style="background: ${
                                      config.color
                                    }; color: white; padding: 6px 12px; border-radius: 16px; font-size: 14px; font-weight: 600;">
                                      ${daysUntilExpiry} days
                                    </span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                      </td>
                    </tr>
                  </table>
                  
                  <!-- CTA Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 32px;">
                    <tr>
                      <td style="text-align: center;">
                        <a href="${
                          Deno.env.get("APP_URL") || "https://your-app.com"
                        }" 
                           style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);">
                          View My Documents
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Info Box -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="background: #eff6ff; border-left: 3px solid #3b82f6; border-radius: 4px; padding: 16px;">
                        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                          <strong>💡 Tip:</strong> Set up automatic renewals when possible to avoid last-minute stress.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 32px 40px; background: #f8fafc; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e2e8f0;">
                  
                  <!-- Unsubscribe -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
                    <tr>
                      <td style="text-align: center;">
                        <a href="${
                          Deno.env.get("APP_URL") || "https://your-app.com"
                        }/unsubscribe?email=${encodeURIComponent(to)}" 
                           style="color: #64748b; text-decoration: none; font-size: 14px; padding: 8px 16px; border: 1px solid #cbd5e1; border-radius: 6px;">
                          Unsubscribe
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Copyright -->
                  <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px;">
                    © ${new Date().getFullYear()} DocReminder
                  </p>
                  <p style="margin: 0; color: #cbd5e1; font-size: 11px;">
                    This email was sent to ${to}
                  </p>
                  
                </td>
              </tr>
              
            </table>
            
          </td>
        </tr>
      </table>
      
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
