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

  if (!name) {
    return new Response("Name is required in query params", { status: 400 });
  }

  const user = await db.user.findFirst({
    where: { name },
    include: { posts: true },
  });

  return new Response(JSON.stringify({ user }), {
    headers: { "content-type": "application/json" },
  });
}
