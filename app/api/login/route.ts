import { db } from "@/db";
import { login } from "@/lib";
import { loginSchema } from "@/schemas";
import zod from "zod";

export async function POST(req: Request, res: Response) {
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
      data: {
        name: body.name,
      },
    });
    await db.user.update({
      where: { id: user.id },
      data: { avatar: `https://i.pravatar.cc/150?img=${user.id}` },
    });
    await login(body, user.id);
  }

  return new Response(JSON.stringify({ user }), {
    status: 201,
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
