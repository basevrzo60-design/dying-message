import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {Server} from 'socket.io';
import {io as connect, type Socket} from 'socket.io-client';
import {attachCheese} from './cheeseSocket.js';
import type {CheeseView} from '../../shared/cheese.js';
test('four real socket clients play a private complete game and reconnect',{timeout:20000},async()=>{
 const http=createServer();const io=new Server(http);const gm=attachCheese(io);
 await new Promise<void>(resolve=>http.listen(0,'127.0.0.1',resolve));
 const port=(http.address() as {port:number}).port;
 const clients:Socket[]=[];const views:(CheeseView|null)[]=[];
 const action=(i:number,event:string,data:object={})=>new Promise<any>((resolve,reject)=>clients[i].timeout(4000).emit('action',{event,data},(err:Error|null,res:any)=>err?reject(err):resolve(res)));
 const until=async(predicate:()=>boolean)=>{const end=Date.now()+4000;while(!predicate()){if(Date.now()>end)throw Error('State update timed out');await new Promise(r=>setTimeout(r,10));}};
 try{
  for(let i=0;i<4;i++){const socket=connect(`http://127.0.0.1:${port}/cheese`,{forceNew:true,reconnection:false});clients.push(socket);socket.on('state',s=>views[i]=s);await new Promise<void>(resolve=>socket.once('connect',resolve));}
  const created=await action(0,'create',{playerName:'A',roomName:'Integration',capacity:4});assert.equal(created.ok,true);
  const code=created.session.code;for(let i=1;i<4;i++)assert.equal((await action(i,'join',{playerName:`P${i}`,code})).ok,true);
  for(let i=0;i<4;i++)await action(i,'ready');await action(0,'start');await until(()=>views.every(v=>v?.phase==='reveal'));
  const leader=views.findIndex(v=>v?.me.role==='leader');assert.ok(leader>=0);for(const view of views){assert.equal(view!.result,null);assert.ok(view!.players.every(p=>!('role'in p)&&!('hour'in p)&&!('token'in p)));}
  for(let i=0;i<4;i++)await action(i,'confirm');await until(()=>views.every(v=>v?.phase==='night'));
  const room=gm.rooms.get(code)!;
  // Force a server deadline to verify timer broadcasts without a three-minute test.
  await action(0,'auto');room.deadline=Date.now()-1;await until(()=>views.every(v=>v?.hour===2));await action(0,'auto');
  for(let h=2;h<=6;h++) {for(let i=0;i<4;i++)if(views[i]!.me.hour===h){const v=views[i]!;if(v.me.canPeek){assert.equal((await action(i,'peek',{targetId:v.players.find(p=>p.id!==v.me.id)!.id})).ok,true);}await action(i,'night_done');}assert.equal((await action(0,'next')).ok,true);await until(()=>views.every(v=>h===6?v?.phase==='recruit':v?.hour===h+1));}
  const helper=views[leader]!.players.find(p=>p.id!==views[leader]!.me.id)!.id;
  assert.equal((await action((leader+1)%4,'recruit',{ids:[helper]})).ok,false);await action(leader,'recruit',{ids:[helper]});await until(()=>views.every(v=>v?.phase==='morning'));
  await action(0,'open_vote');await until(()=>views.every(v=>v?.phase==='vote'));
  const target=views[leader]!.me.id;for(let i=0;i<4;i++)await action(i,'vote',{targetId:target});await until(()=>views.every(v=>v?.phase==='result'));assert.ok(views.every(v=>v!.result!.winner==='mice'));
  clients[0].disconnect();await until(()=>!views[1]!.players[0].connected);clients[0].connect();await new Promise<void>(resolve=>clients[0].once('connect',resolve));assert.equal((await action(0,'rejoin',created.session)).ok,true);await until(()=>views[0]!.players[0].connected);assert.equal(views[0]!.result!.winner,'mice');
 }finally{clients.forEach(c=>c.disconnect());await new Promise<void>(resolve=>io.close(()=>resolve()));}
});
