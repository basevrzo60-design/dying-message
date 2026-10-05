import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CheeseManager} from './CheeseManager.js';
import {henchmenFor} from '../../shared/cheese.js';
function game(count=4,hours=[1,2,2,4,5,6,3,3]){
  const sequence=[0,...hours.slice(0,count).map(h=>h-1)];
  const gm=new CheeseManager(()=>sequence.shift()??0);
  const {room}=gm.create('s0',{playerName:'หนู 0',roomName:'ทดสอบ',capacity:count});
  for(let i=1;i<count;i++)gm.join(`s${i}`,{playerName:`หนู ${i}`,code:room.code});
  room.players.forEach(p=>gm.action(p.socketId!,'ready'));
  gm.action('s0','start');return {gm,room};
}
function night(g:ReturnType<typeof game>){g.room.players.forEach(p=>g.gm.action(p.socketId!,'confirm'));}
function morning(g:ReturnType<typeof game>){night(g);for(let i=0;i<6;i++)g.gm.advance(g.room);g.gm.action('s0','recruit',{ids:g.room.players.slice(1,1+henchmenFor(g.room.players.length)).map(p=>p.id)});}
test('rooms validate capacity, names, readiness, host authority and late joins',()=>{
 const gm=new CheeseManager();assert.throws(()=>gm.create('x',{playerName:'a',roomName:'b',capacity:3}));
 const {room}=gm.create('s0',{playerName:'a',roomName:'b',capacity:4});
 assert.throws(()=>gm.join('s1',{playerName:' A ',code:room.code}));
 assert.throws(()=>gm.action('s0','start'));
 for(let i=1;i<4;i++)gm.join(`s${i}`,{playerName:`p${i}`,code:room.code});
 assert.throws(()=>gm.join('s4',{playerName:'extra',code:room.code}));
 assert.throws(()=>gm.action('s1','start'));
 for(let i=0;i<4;i++)gm.action(`s${i}`,'ready');gm.action('s0','start');
 assert.throws(()=>gm.join('s4',{playerName:'late',code:room.code}));
});
test('snapshots omit other roles, hours, tokens, votes and sleeping-player observations',()=>{
 const g=game();const {gm,room}=g;night(g);
 for(const p of room.players){const view=gm.snapshot(room,p);assert.equal(view.result,null);assert.deepEqual(view.me.team,[]);for(const publicPlayer of view.players){assert.deepEqual(Object.keys(publicPlayer).sort(),['connected','id','name','ready']);}assert.ok(!JSON.stringify(view).includes(p.token));}
 const sleeper=gm.snapshot(room,room.players[1]);assert.equal(sleeper.me.awake,false);assert.deepEqual(sleeper.me.companions,[]);assert.deepEqual(sleeper.me.knownCompanions,[]);
});
test('solo wake permits exactly one private peek; shared wake only reveals companions',()=>{
 const g=game();const {gm,room}=g;night(g);const [a,b,c,d]=room.players;
 assert.equal(gm.snapshot(room,a).me.canPeek,true);
 assert.throws(()=>gm.action('s1','peek',{targetId:d.id}));
 assert.throws(()=>gm.action('s0','peek',{targetId:a.id}));
 gm.action('s0','peek',{targetId:b.id});assert.deepEqual(gm.snapshot(room,a).me.peek,{id:b.id,hour:2});
 assert.equal(gm.snapshot(room,b).me.peek,null);assert.throws(()=>gm.action('s0','peek',{targetId:d.id}));
 assert.throws(()=>gm.action('s0','next'));gm.action('s0','night_done');gm.action('s0','next');
 assert.deepEqual(gm.snapshot(room,b).me.companions,[c.id]);assert.deepEqual(gm.snapshot(room,c).me.companions,[b.id]);assert.deepEqual(gm.snapshot(room,d).me.companions,[]);
 assert.equal(gm.snapshot(room,b).me.canPeek,false);assert.throws(()=>gm.action('s1','peek',{targetId:d.id}));
 gm.action('s1','night_done');gm.action('s2','night_done');gm.action('s0','next');assert.deepEqual(gm.snapshot(room,b).me.knownCompanions,[c.id]);
});
test('leader alone recruits correct distinct number at 4–8 players; team stays private',()=>{
 for(let count=4;count<=8;count++){
  const g=game(count);const {gm,room}=g;night(g);for(let i=0;i<6;i++)gm.advance(room);assert.equal(room.phase,'recruit');
  assert.throws(()=>gm.action('s1','recruit',{ids:[room.players[2].id]}));
  assert.throws(()=>gm.action('s0','recruit',{ids:[]}));
  assert.throws(()=>gm.action('s0','recruit',{ids:Array(henchmenFor(count)).fill(room.players[0].id)}));
  const ids=room.players.slice(1,1+henchmenFor(count)).map(p=>p.id);gm.action('s0','recruit',{ids});
  assert.equal(room.phase,'morning');assert.equal(room.players.filter(p=>p.role==='henchman').length,henchmenFor(count));
  assert.equal(gm.snapshot(room,room.players[1]).me.team.length,ids.length+1);
  assert.deepEqual(gm.snapshot(room,room.players.at(-1)!).me.team,[]);
 }
});
test('leader accusation wins for mice; henchman, ordinary mouse and tied vote win for thieves',()=>{
 for(const target of [0,1,3]){const g=game();morning(g);const {gm,room}=g;gm.action('s0','open_vote');gm.action('s0','vote',{targetId:room.players[target].id});assert.throws(()=>gm.action('s0','vote',{targetId:room.players[2].id}));assert.equal(gm.snapshot(room,room.players[1]).result,null);for(let i=1;i<4;i++)gm.action(`s${i}`,'vote',{targetId:room.players[target].id});assert.equal(gm.snapshot(room,room.players[0]).result!.winner,target===0?'mice':'thieves');
 const before=gm.snapshot(room,room.players[1]).result;gm.leave('s0');assert.deepEqual(gm.snapshot(room,room.players[1]).result,before);}
 const g=game();morning(g);g.gm.action('s0','open_vote');for(let i=0;i<4;i++)g.gm.action(`s${i}`,'vote',{targetId:g.room.players[i].id});assert.equal(g.gm.snapshot(g.room,g.room.players[0]).result!.tied,true);
});
test('disconnect pauses night, changes host and securely restores same role and peek',()=>{
 const g=game();night(g);const {gm,room}=g;const p=room.players[0];const credentials=gm.credentials(room,p);
 gm.action('s0','peek',{targetId:room.players[1].id});gm.action('s0','auto');gm.disconnect('s0');assert.equal(gm.paused(room),true);assert.equal(room.hostId,room.players[1].id);assert.equal(room.deadline,null);gm.advance(room);assert.equal(room.hour,1);
 assert.throws(()=>gm.rejoin('attacker',{...credentials,token:'x'.repeat(36)}));gm.rejoin('restored',credentials);assert.equal(gm.paused(room),false);assert.equal(p.role,'leader');assert.equal(p.peek!.hour,2);assert.ok(room.deadline!>Date.now());assert.throws(()=>gm.rejoin('duplicate',credentials));
});
