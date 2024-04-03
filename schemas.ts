import { z } from "zod";

export const loginSchema = z.object({
  name: z.string(),
});

export type loginSchemaType = z.infer<typeof loginSchema>;

export const tweetSchema = z.object({
  content: z.string().emoji().min(1).max(280),
});

export type tweetSchemaType = z.infer<typeof tweetSchema>;
