import { db } from "@/db";
import { members } from "@/db/schema";
import { ensureSeed, getSettings } from "@/lib/data";
import { registrationSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    await ensureSeed();
    const settings = await getSettings();
    const minAge = Math.max(16, Number(settings.min_age) || 18);
    const parsed = registrationSchema(minAge).safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0] ?? "form");
        if (!fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      return Response.json({ error: "Please fix the highlighted fields", fieldErrors }, { status: 422 });
    }
    if (parsed.data.categorySlug === "her" && parsed.data.gender && parsed.data.gender !== "Woman") {
      return Response.json(
        { error: "Her Table is women-only", fieldErrors: { categorySlug: "Her Table is a women-only experience. Please choose another table." } },
        { status: 422 },
      );
    }
    const [row] = await db.insert(members).values(parsed.data).returning({
      id: members.id,
      token: members.token,
      fullName: members.fullName,
    });
    return Response.json({ ok: true, memberToken: row.token, name: row.fullName });
  } catch (e) {
    console.error("register failed", e);
    return Response.json({ error: "We couldn't save your registration. Please try again." }, { status: 500 });
  }
}
