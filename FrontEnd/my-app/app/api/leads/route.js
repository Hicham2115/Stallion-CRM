import { leadSchema, validateBriefFile } from "@/lib/validations/lead";

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || "http://localhost:8000";

function parseIncomingFormData(formData) {
  const raw = Object.fromEntries(formData.entries());
  let attribution = {};
  try {
    attribution = raw.attribution ? JSON.parse(raw.attribution) : {};
  } catch {
    attribution = {};
  }

  return {
    ...raw,
    is_decision_maker: raw.is_decision_maker === "true",
    attribution,
  };
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const payload = parseIncomingFormData(formData);
    const briefFile = formData.get("brief_file");

    const parsed = leadSchema.safeParse(payload);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || "Invalid submission" },
        { status: 400 },
      );
    }

    const fileCheck = validateBriefFile(briefFile instanceof File ? briefFile : null);
    if (!fileCheck.ok) {
      return Response.json({ error: fileCheck.message }, { status: 400 });
    }

    // Forward with native fetch, not the shared axios instance: Node's axios
    // can't stream a web FormData/File the way fetch does natively, and this
    // is a server-to-server call, not the client-facing traffic axios wraps.
    const forwardData = new FormData();
    for (const [key, value] of Object.entries(parsed.data)) {
      if (key === "attribution") {
        forwardData.append("attribution", JSON.stringify(value));
        continue;
      }
      forwardData.append(key, String(value));
    }
    if (briefFile instanceof File && briefFile.size > 0) {
      forwardData.append("brief_file", briefFile, briefFile.name);
    }

    const laravelResponse = await fetch(`${LARAVEL_API_URL}/api/leads`, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: forwardData,
    });

    const data = await laravelResponse.json().catch(() => ({}));

    if (!laravelResponse.ok) {
      return Response.json(
        { error: data.error || data.message || "Could not save this lead" },
        { status: laravelResponse.status },
      );
    }

    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
