import { getSession } from "@/lib";

export async function GET() {
  const session = await getSession();

  if (!session) return new Response("Unauthorized", { status: 401 });

  return new Response(JSON.stringify({ session }), {
    headers: { "content-type": "application/json" },
  });
}
