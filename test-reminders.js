// Test script to manually trigger the reminder function
// Run with: node test-reminders.js

const SUPABASE_URL = "https://sjgivrbdebenyrlbmizg.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZ2l2cmJkZWJlbnlybGJtaXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MjM2NTYsImV4cCI6MjA3NzQ5OTY1Nn0.EWWSbmdbgEsfkPa66frVDIdNHNMfrOsVeTiGyhi80Z4";

async function testReminders() {
  try {
    console.log("🚀 Testing reminder function...");

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/send-reminders`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Success:", result);
    } else {
      console.error("❌ Error:", result);
    }
  } catch (error) {
    console.error("❌ Network error:", error);
  }
}

testReminders();
