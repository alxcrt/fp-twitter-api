import {SignJWT,jwtVerify} from 'jose';
import {z} from 'zod';

const issuer='fp-twitter-demo';
const audience='fp-twitter-demo';
const userSchema=z.object({id:z.number().int().positive(),name:z.string()});
const sessionSchema=z.object({user:userSchema,expires:z.iso.datetime(),iat:z.number().int(),exp:z.number().int()});
export type DemoUser=z.infer<typeof userSchema>;
export type Session=z.infer<typeof sessionSchema>;
export const lifetimeSeconds=5*60*60;

export function sessionKey(){
  const secret=process.env.SESSION_SECRET;
  if(!secret || Buffer.byteLength(secret,'utf8')<32) throw new Error('SESSION_SECRET must contain at least 32 bytes');
  return new TextEncoder().encode(secret);
}

export async function encrypt(input:DemoUser){
  const user=userSchema.parse(input);
  const now=Math.floor(Date.now()/1000);
  const expires=new Date((now+lifetimeSeconds)*1000).toISOString();
  return new SignJWT({user,expires}).setProtectedHeader({alg:'HS256',typ:'JWT'}).setIssuer(issuer).setAudience(audience).setIssuedAt(now).setExpirationTime(now+lifetimeSeconds).sign(sessionKey());
}

export async function decrypt(input:string):Promise<Session|null>{
  const key=sessionKey();
  try{
    const {payload}=await jwtVerify(input,key,{algorithms:['HS256'],issuer,audience,requiredClaims:['iat','exp']});
    const parsed=sessionSchema.safeParse(payload);
    if(!parsed.success)return null;
    const session=parsed.data;
    const now=Math.floor(Date.now()/1000);
    if(session.iat>now || session.exp<=session.iat || session.exp-session.iat>lifetimeSeconds || Date.parse(session.expires)!==session.exp*1000)return null;
    return session;
  }catch{return null;}
}

export async function sessionFromInputs(cookie:string|undefined,authorization:string|null){
  const token=cookie || (authorization?.startsWith('Bearer ')?authorization.slice(7):undefined);
  return token?decrypt(token):null;
}
