import { db } from "@/db";
import { login } from "@/lib";
import { loginSchema } from "@/schemas";
import zod from "zod";

export default async function POST(req: Request, res: Response) {
  const body = await req.json();

  try {
    loginSchema.parse(body);
  } catch (error) {
    if (error instanceof zod.ZodError)
      return new Response(JSON.stringify({ error: error.errors }), {
        status: 400,
      });
    return new Response(null, { status: 500 });
  }

  // check if user exists
  let user = await db.user.findFirst({
    where: { name: body.name },
  });

  if (user) {
    await login(body, user.id);
  } else {
    user = await db.user.create({
      data: { name: body.name },
    });
    await login(body, user.id);
  }

  return new Response(JSON.stringify({ user }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
}
