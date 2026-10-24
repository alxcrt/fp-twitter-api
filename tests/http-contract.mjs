import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {SignJWT} from 'jose';
const base=new URL(process.env.TEST_BASE_URL??'http://127.0.0.1:18080');
if(base.protocol!=='http:'||!['127.0.0.1','localhost'].includes(base.hostname)||process.env.ISOLATED_TEST_DATABASE!=='1')throw Error('Only an explicitly isolated loopback test database is allowed');
const request=(path,options)=>fetch(new URL(path,base),options);
const jsonRequest=(path,body,headers={})=>request(path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
const name='homelab-isolated-'+randomUUID();
const before=await (await request('/api/tweets')).json();assert.ok(Array.isArray(before.tweets));
const login=await jsonRequest('/api/login',{name});assert.equal(login.status,201);const signed=await login.json();assert.equal(signed.user.name,name);assert.ok(signed.token);
const setCookie=login.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/i);assert.match(setCookie,/Secure/i);assert.match(setCookie,/SameSite=Lax/i);assert.match(setCookie,/Path=\//i);
const cookie='session='+signed.token;
const again=await jsonRequest('/api/login',{name});assert.equal(again.status,201);assert.equal((await again.json()).user.id,signed.user.id);
for(const headers of [{Cookie:cookie},{Authorization:'Bearer '+signed.token}]){const r=await request('/api/test',{headers});assert.equal(r.status,200);assert.equal((await r.json()).session.user.id,signed.user.id);}
const expired=await new SignJWT({user:{id:signed.user.id,name},expires:new Date(0).toISOString()}).setProtectedHeader({alg:'HS256'}).setIssuedAt(0).setExpirationTime(1).sign(new TextEncoder().encode(process.env.SESSION_SECRET));
const forged=await new SignJWT({user:{id:signed.user.id,name},expires:new Date(Date.now()+3600000).toISOString()}).setProtectedHeader({alg:'HS256'}).setExpirationTime('1h').sign(new TextEncoder().encode('secret'));
for(const headers of [{},{Authorization:'Bearer invalid'},{Authorization:'Bearer '+expired},{Authorization:'Bearer '+forged},{Cookie:'session=invalid'},{Cookie:'session=invalid',Authorization:'Bearer '+signed.token},{'x-middleware-subrequest':'proxy:proxy:proxy:proxy:proxy'}]){
 const r=await request('/api/test',{headers});assert.ok([400,401].includes(r.status));
 const write=await jsonRequest('/api/tweet',{content:'🙂'},headers);assert.ok([400,401].includes(write.status));
}
const still=await (await request('/api/tweets')).json();assert.equal(still.tweets.length,before.tweets.length);
const stale=await request('/',{headers:{Cookie:'session=invalid'}});assert.equal(stale.status,200);assert.match(stale.headers.get('set-cookie'),/session=;/);
const html=await stale.text();const assets=[...new Set([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(path=>path.startsWith('/') && /\.(?:css|js|svg|woff2?|ico)(?:\?|$)/.test(path)))];assert.ok(assets.length>0);for(const path of assets)assert.equal((await request(path)).status,200,'Static asset: '+path);

const invalid=await jsonRequest('/api/tweet',{content:'text'},{Authorization:'Bearer '+signed.token});assert.equal(invalid.status,400);
const post=await jsonRequest('/api/tweet',{content:'🙂'},{Authorization:'Bearer '+signed.token});assert.equal(post.status,201);const created=await post.json();assert.equal(created.tweet.authorId,signed.user.id);
const tweets=await (await request('/api/tweets?name='+encodeURIComponent(name))).json();assert.ok(tweets.tweets.some(t=>t.id===created.tweet.id));
const user=await (await request('/api/user?name='+encodeURIComponent(name))).json();assert.equal(user.user.id,signed.user.id);
assert.equal((await request('/api/user')).status,400);
const preflight=await request('/api/tweet',{method:'OPTIONS',headers:{Origin:'https://demo.invalid','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});assert.equal(preflight.status,204);assert.match(preflight.headers.get('access-control-allow-headers'),/authorization/i);
console.log(JSON.stringify({passed:true,publicDemoNameSelection:true,cookieAndBearer:true,invalidSessionRejectedBeforeWrites:true,publicReads:true,emojiWrite:true,cors:true,fixtures:'isolated-database-only'}));
