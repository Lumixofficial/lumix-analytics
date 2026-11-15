// Proves the legacy-volume migration on a disposable DB; never opens api_mongo_data.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";

const root = resolve(import.meta.dirname, ".."), secrets = resolve(root, ".local/visitors-production");
if (!existsSync(resolve(secrets,"mongo-root-password"))) throw new Error("Run npm run visitors:secrets:production first.");
const docker = process.platform === "win32" ? "docker.exe" : "docker";
const name = `lumix-visitors-migration-check-${Date.now()}`, volume = name + "-data", network = name + "-net";
const run = args => execFileSync(docker,args,{cwd:root,encoding:"utf8",windowsHide:true,stdio:["ignore","pipe","pipe"]}).trim();
const mounted = ["mongo-root-password","mongo-app-password","mongo-api-password"].flatMap(file => ["--mount",`type=bind,source=${resolve(secrets,file)},target=/run/secrets/${file.replaceAll("-","_")},readonly`]);
const boot = ["--mount",`type=bind,source=${resolve(root,"deploy/mongo-bootstrap.cjs")},target=/run/lumix/mongo-bootstrap.cjs,readonly`];
const delay = ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function ready() {
  for(let i=0;i<60;i++){try{run(["exec",name,"mongosh","--quiet","--eval","quit(db.adminCommand({ping:1}).ok===1?0:1)"]);return;}catch{}await delay(250);}
  throw new Error("Disposable Mongo did not start");
}
try {
  run(["volume","create",volume]);run(["network","create","--internal",network]);
  const common=["run","-d","--name",name,"--network",network,"--mount",`type=volume,source=${volume},target=/data/db`,...mounted,...boot,"mongo:7.0"];
  run([...common,"mongod","--bind_ip_all"]);await ready();
  run(["exec",name,"mongosh","--quiet","--eval","db.getSiblingDB('lumix').migration_fixture.insertOne({_id:'preserved',value:'fixture-only'})"]);
  run(["stop",name]);run(["rm",name]);
  run([...common,"mongod","--auth","--bind_ip_all"]);await ready();
  run(["exec",name,"mongosh","--quiet","--file","/run/lumix/mongo-bootstrap.cjs"]);
  const result=run(["exec",name,"mongosh","--quiet","--eval",[
    "const f=require('fs');const a=db.getSiblingDB('admin');a.auth('lumix_root',f.readFileSync('/run/secrets/mongo_root_password','utf8').trim());",
    "if(db.getSiblingDB('lumix').migration_fixture.countDocuments({_id:'preserved'})!==1)quit(2);",
    "print('LEGACY_DATA_PRESERVED');",
  ].join("")]);assert.equal(result,"LEGACY_DATA_PRESERVED");
  const denied=run(["exec",name,"mongosh","--quiet","--eval","try{db.getSiblingDB('lumix').migration_fixture.findOne();quit(2);}catch(e){if(e.code!==13)throw e;print('AUTH_ENFORCED');}"]);
  assert.equal(denied,"AUTH_ENFORCED");
  assert.equal(run(["inspect",name,"--format","{{json .HostConfig.PortBindings}}"]),"{}");
  console.log("PASS populated legacy-volume migration: authenticated users provisioned, data preserved, anonymous reads denied, no host DB port.");
} finally {
  for(const args of [["rm","-f",name],["volume","rm",volume],["network","rm",network]]){try{run(args);}catch{}}
}
