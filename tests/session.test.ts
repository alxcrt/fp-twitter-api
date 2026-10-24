import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SignJWT,jwtVerify} from 'jose';
import {encrypt,decrypt,sessionFromInputs,sessionKey,lifetimeSeconds} from '../session.ts';
process.env.SESSION_SECRET='unit-test-secret-used-only-in-isolated-tests-2026';
const user={id:7,name:'demo'};
const second={id:8,name:'another-demo'};
const now=()=>Math.floor(Date.now()/1000);
async function crafted(overrides:Record<string,unknown>={},key=sessionKey(),alg='HS256'){
 const start=now();
 return new SignJWT({user,expires:new Date((start+lifetimeSeconds)*1000).toISOString(),iat:start,exp:start+lifetimeSeconds,iss:'fp-twitter-demo',aud:'fp-twitter-demo',...overrides}).setProtectedHeader({alg}).sign(key);
}
test('legitimate signed session keeps identity and five-hour contract',async()=>{
 const token=await encrypt(user),session=await decrypt(token);assert.deepEqual(session?.user,user);assert.equal(session!.exp-session!.iat,lifetimeSeconds);
 assert.equal(Date.parse(session!.expires),session!.exp*1000);
});
test('original public-key forgery reproduces under old verifier and is rejected by new boundary',async()=>{
 const oldKey=new TextEncoder().encode('secret');const forged=await crafted({user:{id:1234567,name:'forged'}},oldKey);
 assert.equal((await jwtVerify(forged,oldKey,{algorithms:['HS256']})).payload.user!==undefined,true);
 assert.equal(await decrypt(forged),null);
});
test('cookie and Bearer controls, precedence and missing inputs',async()=>{
 const cookie=await encrypt(user),bearer=await encrypt(second);
 assert.deepEqual((await sessionFromInputs(cookie,null))?.user,user);
 assert.deepEqual((await sessionFromInputs(undefined,'Bearer '+bearer))?.user,second);
 assert.deepEqual((await sessionFromInputs(cookie,'Bearer '+bearer))?.user,user);
 assert.equal(await sessionFromInputs('invalid','Bearer '+bearer),null);
 assert.equal(await sessionFromInputs(undefined,'Basic '+bearer),null);
 assert.equal(await sessionFromInputs(undefined,null),null);
});
test('malformed, expired, wrong-algorithm and wrong-context tokens fail closed',async()=>{
 const start=now();
 for(const token of ['invalid',await crafted({iat:start-7200,exp:start-3600,expires:new Date((start-3600)*1000).toISOString()}),await crafted({},sessionKey(),'HS384'),await crafted({iss:'other'}),await crafted({aud:'other'})])assert.equal(await decrypt(token),null);
});
test('missing or malformed time and identity claims fail closed',async()=>{
 for(const claims of [{user:{id:'7',name:'demo'}},{user:{id:0,name:'demo'}},{user:{id:7}},{user:undefined},{exp:undefined},{iat:undefined},{expires:undefined},{expires:'invalid'},{expires:new Date(0).toISOString()},{iat:now()+600},{exp:now()+lifetimeSeconds+600,expires:new Date((now()+lifetimeSeconds+600)*1000).toISOString()}])assert.equal(await decrypt(await crafted(claims)),null);
});
test('renewal uses the same verifier and never promotes an invalid session',async()=>{
 const original=await decrypt(await encrypt(user));assert.ok(original);
 assert.deepEqual((await decrypt(await encrypt(original.user)))?.user,user);
 assert.equal(await decrypt(await crafted({user:{id:-1,name:'invalid'}})),null);
});
test('missing or weak deployment keys are configuration failures',()=>{
 const previous=process.env.SESSION_SECRET;
 for(const value of [undefined,'short']){if(value===undefined)delete process.env.SESSION_SECRET;else process.env.SESSION_SECRET=value;assert.throws(()=>sessionKey(),/SESSION_SECRET/);}
 process.env.SESSION_SECRET=previous;
});
