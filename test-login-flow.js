// test-login-flow.js
// Run with: node test-login-flow.js
// This avoids ALL PowerShell quoting issues by doing everything inside Node.

const BASE = "http://localhost:3000";

async function main() {
  const username = "testpandit_" + Date.now();
  const password = "Test1234"; // no special characters, to rule out shell issues entirely

  console.log("1) Creating test pandit:", username);

  const createRes = await fetch(`${BASE}/api/pandit/create-test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Flow Test Pandit",
      username,
      password,
      email: `${username}@example.com`,
      phone: "9000000001",
      speciality: ["Vedic Astrology"],
      languages: ["Hindi"],
    }),
  });

  const createData = await createRes.json();
  console.log("   Status:", createRes.status);
  console.log("   Response:", JSON.stringify(createData, null, 2));

  if (!createRes.ok) {
    console.log("❌ Failed to create test pandit. Stopping here.");
    return;
  }

  console.log("\n2) Attempting login with the SAME credentials...");

  const loginRes = await fetch(`${BASE}/api/mobile/pandit-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const loginData = await loginRes.json();
  console.log("   Status:", loginRes.status);
  console.log("   Response:", JSON.stringify(loginData, null, 2));

  if (loginRes.ok && loginData.token) {
    console.log("\n✅ SUCCESS — backend login flow works end-to-end.");
    console.log("   Use these EXACT credentials in the app:");
    console.log("   username:", username);
    console.log("   password:", password);
  } else {
    console.log("\n❌ Login failed even right after creation — this points to a real bug in the route, not a shell/typing issue.");
  }
}

main().catch((err) => {
  console.error("Script crashed:", err);
});