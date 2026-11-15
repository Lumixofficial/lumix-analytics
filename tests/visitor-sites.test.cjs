const {test}=require('node:test');const assert=require('node:assert/strict');
const {isPageview,createCollector}=require('../lib/visitors/collector.ts');
const {frontendSiteConfig}=require('../lib/visitors/sites.ts');
test('site/route pairs and distinct origins fail closed',async()=>{
 const previous={...process.env};Object.assign(process.env,{VISITOR_FRONT_ENABLED:'true',VISITOR_FRONT_ORIGIN:'http://localhost:3001',VISITOR_FRONT_UNIQUES_ENABLED:'true'});
 try{
 const config={origin:'http://localhost:3000',localTest:true,retentionDays:30,maxPerMinute:300,estimator:{enabled:true}};
 const sites=[];const collect=createCollector({config:()=>config,store:async(c,site)=>{sites.push(site);return{takeBudget:async()=>true,increment:async()=>{},estimate:async()=>{}};}});
 const body={v:1,type:'pageview',site:'lumix-front',route:'/spot'};
 const req=(data,origin)=>new Request('http://localhost:3000/api/visitors',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(data)});
 assert.equal((await collect(req(body,'http://localhost:3001'))).status,204);assert.deepEqual(sites,['lumix-front']);
 assert.equal((await collect(req(body,'http://evil.test'))).status,403);
 assert.equal((await collect(req(body,'http://localhost:3000'))).status,403);
 assert.equal(isPageview({...body,site:'unknown'}),false);assert.equal(isPageview({...body,route:'/'}),false);assert.equal(isPageview({...body,route:'/spot?wallet=secret'}),false);
 process.env.VISITOR_FRONT_ORIGIN='https://front.test/path';assert.equal(frontendSiteConfig(config),null);
 }finally{for(const key of ['VISITOR_FRONT_ENABLED','VISITOR_FRONT_ORIGIN','VISITOR_FRONT_UNIQUES_ENABLED']){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];}}
});
