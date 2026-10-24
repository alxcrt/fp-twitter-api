import {PrismaClient} from './generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import 'server-only';

declare global { var cachedPrisma: PrismaClient | undefined; }
const connectionString=process.env.DATABASE_URL ?? process.env.POSTGRES_URL_NON_POOLING;
if(!connectionString) throw new Error('Database connection is not configured');
const createClient=()=>new PrismaClient({adapter:new PrismaPg({connectionString,max:5,connectionTimeoutMillis:5000,idleTimeoutMillis:30000})});
export const db=process.env.NODE_ENV==='production'?createClient():(global.cachedPrisma??=createClient());
