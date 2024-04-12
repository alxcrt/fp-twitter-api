import { db } from "@/db";
import { getSession } from "@/lib";
import { tweetSchema } from "@/schemas";
import { NextRequest } from "next/server";
import zod from "zod";

export const revalidate = 0;

export async function GET(req: NextRequest, res: Response) {
  // const session = await getSession();

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
