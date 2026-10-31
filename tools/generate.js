// Ringlock level generator + BFS solver
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function key(s){return s.ring.join('')+'|'+s.tubes.map(t=>t.join('')).join('/')}
function clone(s){return {ring:s.ring.slice(),tubes:s.tubes.map(t=>t.slice())}}
function solved(s,cfg){ if(s.ring.some(v=>v>0))return false; return s.tubes.every(t=>t.length===0||(t.length===cfg.cap&&t.every(v=>v===t[0])));}
function moves(s,cfg){ // forward legal moves
  const out=[]; const N=s.ring.length;
  {const r=clone(s); r.ring=s.ring.map((_,i)=>s.ring[(i-1+N)%N]); out.push(['cw',r]);}
  if(!cfg.oneWay){const r=clone(s); r.ring=s.ring.map((_,i)=>s.ring[(i+1)%N]); out.push(['ccw',r]);}
  cfg.ports.forEach((p,t)=>{const b=s.ring[p], tube=s.tubes[t];
    if(b>0){ if(tube.length<cfg.cap&&(tube.length===0||tube[tube.length-1]===b)){const r=clone(s);r.ring[p]=0;r.tubes[t].push(b);out.push(['t'+t,r]);} }
    else if(b===0&&tube.length){const r=clone(s);r.ring[p]=r.tubes[t].pop();out.push(['t'+t,r]);}
  });
  return out;
}
function solve(start,cfg,limit=4e6){
  const seen=new Map(); seen.set(key(start),null); let frontier=[start]; let depth=0;
  if(solved(start,cfg))return {len:0,path:[]};
  const parent=new Map();
  while(frontier.length){ depth++; const next=[];
    for(const s of frontier){ const ks=key(s);
      for(const [m,r] of moves(s,cfg)){ const k=key(r); if(seen.has(k))continue; seen.set(k,[ks,m]);
        if(solved(r,cfg)){ const path=[]; let kk=k; while(seen.get(kk)){const [pk,mm]=seen.get(kk); path.unshift(mm); kk=pk;} return {len:depth,path,states:seen.size}; }
        next.push(r);} }
    if(seen.size>limit)return null; frontier=next; }
  return {len:-1};
}
function scramble(cfg,steps,rnd){
  const N=cfg.N; const ring=Array(N).fill(0); (cfg.blockers||[]).forEach(i=>ring[i]=-1);
  const tubes=cfg.ports.map((_,t)=>t<cfg.colors?Array(cfg.cap).fill(t+1):[]);
  let s={ring,tubes};
  for(let i=0;i<steps;i++){
    const opts=[];
    const rot=d=>{const r=clone(s); r.ring=s.ring.map((_,j)=>s.ring[(j+d+N)%N]); return r;};
    opts.push(rot(1)); if(!cfg.oneWay)opts.push(rot(-1));  // reverse of cw is ccw: ring[j]=old[j+1]
    cfg.ports.forEach((p,t)=>{const tube=s.tubes[t];
      if(s.ring[p]===0&&tube.length){const b=tube[tube.length-1]; if(tube.length===1||tube[tube.length-2]===b){const r=clone(s); r.ring[p]=r.tubes[t].pop(); opts.push(r);} }
      if(s.ring[p]>0&&tube.length<cfg.cap){const r=clone(s); r.tubes[t].push(r.ring[p]); r.ring[p]=0; opts.push(r); opts.push(r);}
    });
    s=opts[Math.floor(rnd()*opts.length)];
  }
  return s;
}
module.exports={solve,scramble,mulberry32,moves,key,solved};
if(require.main===module){
  const specs=JSON.parse(process.argv[2]);
  const out=[];
  for(const spec of specs){
    let best=null;
    for(let seed=1;seed<=spec.tries;seed++){
      const nh=[...String(spec.name)].reduce((h,c)=>h*31+c.charCodeAt(0),7)|0; const rnd=mulberry32(seed*1013+spec.N*7+spec.colors+nh);
      const st=scramble(spec,spec.steps,rnd);
      if(solved(st,spec))continue;
      const balls=st.ring.filter(v=>v>0).length;
      const r=solve(st,spec,spec.limit||3e6); if(!r||r.len<0)continue;
      if(r.len>=spec.min&&r.len<=spec.max){ const score=r.len; if(!best||score>best.len)best={...r,st,seed}; if(r.len>=spec.target)break;}
    }
    if(!best){out.push({name:spec.name,fail:true});continue;}
    out.push({name:spec.name,N:spec.N,cap:spec.cap,colors:spec.colors,ports:spec.ports,oneWay:!!spec.oneWay,ring:best.st.ring,tubes:best.st.tubes,par:best.len,sol:best.path.join(' '),states:best.states});
    console.error(spec.name,'par',best.len,'states',best.states);
  }
  console.log(JSON.stringify(out));
}
