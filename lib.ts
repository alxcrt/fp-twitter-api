import {cookies,headers} from 'next/headers';
import {NextRequest,NextResponse} from 'next/server';
import type {loginSchemaType} from './schemas';
import {encrypt,decrypt,sessionFromInputs,lifetimeSeconds} from './session';
export {encrypt,decrypt};
const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};

export async function login(data:loginSchemaType,userId:number){
  // Intentional public course demo: selecting a name is not proof of ownership.
  const expires=new Date(Date.now()+lifetimeSeconds*1000);
  const session=await encrypt({name:data.name,id:userId});
  (await cookies()).set('session',session,{...cookieOptions,expires});
  return session;
}
export async function logout(){(await cookies()).set('session','',{...cookieOptions,expires:new Date(0)});}
export async function getSession(){return sessionFromInputs((await cookies()).get('session')?.value,(await headers()).get('Authorization'));}
export async function updateSession(request:NextRequest){
  const token=request.cookies.get('session')?.value;
  if(!token)return;
  const session=await decrypt(token);
  const response=NextResponse.next();
  if(!session){response.cookies.set('session','',{...cookieOptions,expires:new Date(0)});return response;}
  const expires=new Date(Date.now()+lifetimeSeconds*1000);
  response.cookies.set('session',await encrypt(session.user),{...cookieOptions,expires});
  return response;
}
