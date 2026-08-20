export async function POST(request) {
  console.log("🔥 verify-email endpoint hit!");

  try {
    const body = await request.json();
    const { email } = body;

    const adminEmail = process.env.ADMIN_EMAIL;

    if (!email) {
      return Response.json(
        { allowed: false, error: "Email required" },
        { status: 400 }
      );
    }

    const allowed = email.toLowerCase().trim() === adminEmail?.toLowerCase().trim();
    console.log(`✅ Check: "${email}" === "${adminEmail}" → ${allowed}`);

    return Response.json({ allowed }, { status: 200 });
  } catch (error) {
    console.error("💥 verify-email error:", error);
    return Response.json(
      { allowed: false, error: error.message },
      { status: 500 }
    );
  }
}