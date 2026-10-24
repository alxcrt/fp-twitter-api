import { db } from "@/db";
import { NextRequest } from "next/server";

export const revalidate = 0;

export async function GET(req: NextRequest) {

  const searchParams = req.nextUrl.searchParams;
  const name = searchParams.get("name");

  if (!name) {
    return new Response("Name is required in query params", { status: 400 });
  }

  const user = await db.user.findFirst({
    where: { name },
    include: { posts: { include: { author: true } } },
  });

  return new Response(JSON.stringify({ user }), {
    headers: { "content-type": "application/json" },
  });
}
