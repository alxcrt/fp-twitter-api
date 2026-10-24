import {db} from '@/db';
import {sessionKey} from '@/session';
export const dynamic='force-dynamic';
export async function GET(){try{sessionKey();await db.$queryRaw`SELECT 1`;return new Response('ok');}catch{return new Response('not ready',{status:503});}}
