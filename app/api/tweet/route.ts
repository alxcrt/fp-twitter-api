import { db } from "@/db";
import { getSession } from "@/lib";
import { tweetSchema } from "@/schemas";
import zod from "zod";

export const revalidate = 0;

export async function POST(req: Request, res: Response) {
  const session = await getSession();

  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();

  try {
    tweetSchema.parse(body);
  } catch (error) {
    if (error instanceof zod.ZodError)
      return new Response(JSON.stringify({ error: error.errors }), {
        status: 400,
      });
    return new Response(null, { status: 500 });
  }

  // save the tweet
  const tweet = await db.post.create({
    data: {
      content: body.content,
      authorId: session.user.id,
    },
  });

  return new Response(JSON.stringify({ tweet }), {
    headers: { "content-type": "application/json" },
  });
}

export async function OPTIONS(req: Request, res: Response) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
