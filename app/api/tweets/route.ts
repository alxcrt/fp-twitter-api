import { db } from "@/db";
import { getSession } from "@/lib";
import { tweetSchema } from "@/schemas";
import zod from "zod";

export const revalidate = 0;

export async function GET(req: Request, res: Response) {
  // const session = await getSession();

  // if (!session) return new Response("Unauthorized", { status: 401 });

  // save the tweet
  const tweets = await db.post.findMany({
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });

  return new Response(JSON.stringify({ tweets }), {
    headers: { "content-type": "application/json" },
  });
}
