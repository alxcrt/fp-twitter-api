import {cp,mkdir,rm} from 'node:fs/promises';
for(const [source,target] of [['public','.next/standalone/public'],['.next/static','.next/standalone/.next/static']]){
 await rm(target,{recursive:true,force:true});await mkdir(target,{recursive:true});await cp(source,target,{recursive:true});
}
