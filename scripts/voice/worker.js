// Local-only helper: turns narration text into speech with Workers AI. Run by scripts/voice/make.mjs.
export default {
  async fetch(request, env) {
    const { model, input } = await request.json();
    try {
      const out = await env.AI.run(model, input, { returnRawResponse: true });
      return new Response(out.body, { headers: { "content-type": out.headers.get("content-type") || "application/octet-stream" } });
    } catch (e) {
      return new Response(String(e), { status: 500 });
    }
  },
};
