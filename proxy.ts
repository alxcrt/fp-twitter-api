import { NextRequest } from "next/server";
import { updateSession } from "./lib";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}
