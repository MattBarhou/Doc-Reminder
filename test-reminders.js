// Test script to manually trigger the reminder function
// Run with: node test-reminders.js

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
