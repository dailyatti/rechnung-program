// Netlify Function: Save data to Netlify Blobs
export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();

    // Use Netlify Blobs for persistence
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("rechnung-data");

    await store.setJSON("app-state", {
      ...body,
      savedAt: new Date().toISOString()
    });

    return new Response(JSON.stringify({ ok: true, savedAt: new Date().toISOString() }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Save error:", e);
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = {
  path: "/.netlify/functions/save-data"
};
