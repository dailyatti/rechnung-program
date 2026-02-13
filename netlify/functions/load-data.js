// Netlify Function: Load data from Netlify Blobs
export default async (req) => {
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("rechnung-data");

    const data = await store.get("app-state", { type: "json" });

    if (!data) {
      return new Response(JSON.stringify({ ok: false, error: "No data found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("Load error:", e);
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const config = {
  path: "/.netlify/functions/load-data"
};
