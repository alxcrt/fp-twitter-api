import { db } from "@/db";
import { NextRequest } from "next/server";

export const revalidate = 0;

export async function GET(req: NextRequest) {

  const searchParams = req.nextUrl.searchParams;
  const name = searchParams.get("name");

  if (name) {
    const tweets = await db.post.findMany({
      where: { author: { name } },
      include: { author: true },
      orderBy: { createdAt: "desc" },
    });
    return new Response(JSON.stringify({ tweets }), {
      headers: { "content-type": "application/json" },
    });
  }

  const tweets = await db.post.findMany({
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });

  return new Response(JSON.stringify({ tweets }), {
    headers: { "content-type": "application/json" },
  });
}
