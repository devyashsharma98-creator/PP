import "@supabase/functions-js/edge-runtime.d.ts"

const jsonHeaders = {
  "Content-Type": "application/json",
} as const

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    })
  }

  const expectedSecret = Deno.env.get("NOTIFICATION_DISPATCH_SECRET")
  if (!expectedSecret) {
    return new Response(JSON.stringify({ error: "Function secret is not configured" }), {
      status: 500,
      headers: jsonHeaders,
    })
  }

  const providedSecret =
    req.headers.get("x-dispatch-secret") ??
    req.headers.get("x-webhook-secret")

  if (providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: jsonHeaders,
    })
  }

  let payload: {
    notificationIds?: string[]
    dryRun?: boolean
    channel?: string
  }

  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: jsonHeaders,
    })
  }

  const notificationIds = Array.isArray(payload.notificationIds)
    ? payload.notificationIds.filter((v) => typeof v === "string" && v.length > 0)
    : []

  // Foundation only: queue/dispatch integration will be added when real providers are selected.
  return new Response(JSON.stringify({
    ok: true,
    received: notificationIds.length,
    dryRun: Boolean(payload.dryRun),
    channel: payload.channel ?? "unspecified",
    message: "Notification dispatch hook scaffold is active. Provider integration is TODO.",
  }), {
    status: 200,
    headers: jsonHeaders,
  })
})
