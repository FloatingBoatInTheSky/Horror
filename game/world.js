import * as T from './vendor/three.module.js';
export function buildWorld(scene){
 const mat=(color,roughness=1)=>new T.MeshStandardMaterial({color,roughness});
 const m={floor:mat('#514b43'),wall:mat('#716e62'),trim:mat('#343b38'),wood:mat('#564438'),metal:mat('#99917a'),paper:mat('#b9a988'),dark:mat('#1d2728'),glass:mat('#132e39',.15),cloth:mat('#414b48'),light:new T.MeshBasicMaterial({color:'#dac5a2'})};
 const objects={}, lights={};
 function box(x,y,z,w,h,d,material,parent=scene){let o=new T.Mesh(new T.BoxGeometry(w,h,d),material);o.position.set(x,y,z);parent.add(o);return o}
 function obj(id,x,y,z,w,h,d,material){let o=box(x,y,z,w,h,d,material);objects[id]=o;return o}
 scene.background=new T.Color('#29343a');scene.fog=new T.Fog('#29343a',22,47);
 scene.add(new T.HemisphereLight('#8c9aaa','#514134',2.1));
 box(0,-.13,0,24,.25,18,m.floor);box(0,3.15,0,24,.3,18,m.dark);
 for(let x=-11.5;x<12;x+=1.4)box(x,.006,0,.018,.012,18,m.wood);
 function wall(x,z,w,d){box(x,1.5,z,w,3,d,m.wall);box(x,.18,z,w,.12,d+.06,m.trim);box(x,2.85,z,w,.12,d+.06,m.trim)}
 wall(0,-9,24,.25);wall(0,9,24,.25);wall(-12,0,.25,18);wall(12,0,.25,18);
 // Hallway runs along the middle; gaps connect all six rooms.
 for(let x of [-8,0,8]){wall(x-2.25,-1.5,3.5,.18);wall(x+2.25,-1.5,3.5,.18);wall(x-2.25,1.5,3.5,.18);wall(x+2.25,1.5,3.5,.18)}
 for(let x of [-4,4]){wall(x,-5.25,.18,7.5);wall(x,5.25,.18,7.5)}
 const names=[['SALA',-8,-5],['COZINHA',0,-5],['QUARTO',8,-5],['ENTRADA',-8,5],['BANHEIRO',0,5],['ESTÚDIO',8,5]];
 names.forEach(([name,x,z],i)=>{let bulb=new T.PointLight(i===4?'#9dbacd':'#ffcd8e',i===5?7:9,15,2);bulb.position.set(x,2.55,z);scene.add(bulb);lights[name]=bulb;box(x,2.85,z,.45,.05,.45,m.light)});
 // A lived-in house: furnishings, books, frames, dishes, windows and switches.
 obj('tv',-10,1.05,-7,.18,1.1,1.6,new T.MeshBasicMaterial({color:'#10212a'}));box(-10,.35,-7,.75,.7,2,m.wood);
 box(-7,.45,-5,2,.65,1,m.cloth);box(-7,.85,-5.5,2,.6,.2,m.cloth);box(-6,.35,-7.5,1.3,.7,.8,m.wood);
 obj('photo',-11.85,1.7,-5,.07,.85,.7,m.paper);box(-11.8,1.7,-5,.09,.58,.48,m.dark);
 box(1,.45,-6,3,.9,1.3,m.wood);box(-2,.6,-7,1.2,1.2,2,m.wood);obj('kettle',1.2,1,-6,.4,.22,.4,m.metal);
 box(6,.3,-6,2.4,.5,3,m.wood);box(6,.64,-6,2.1,.18,2.7,m.cloth);box(10,.6,-7,1,1.2,1,m.wood);
 obj('drawer',10,1.22,-7,.45,.12,.45,m.paper);box(10,1.9,-8.85,1.4,1.2,.12,m.dark);
 box(-10,.5,6,1.2,1,1,m.wood);obj('key',-10,1.08,6,.22,.04,.1,m.metal);box(-6,.45,7,1.1,.9,.6,m.wood);
 box(0,.5,7,1.3,1,1,m.paper);box(-2,.4,7,.7,.8,.7,m.metal);obj('mirror',1,1.6,8.82,1.2,1.3,.06,m.glass);
 box(6,.7,6,2.8,1.4,.6,m.wood);for(let i=0;i<9;i++)box(5+i*.3,1.5,6,.15,.35,.27,i%2?m.paper:m.cloth);
 obj('recorder',9,1.2,6,.55,.22,.35,m.metal);obj('letter',6,1.52,6,.42,.02,.3,m.paper);
 for(let x of [-8,0,8])for(let z of [-8.82,8.82]){box(x,1.65,z,1.9,1.4,.1,m.trim);box(x,1.65,z+Math.sign(z)*.07,1.6,1.1,.07,m.glass)}
 obj('frontDoor',-8,1.5,8.84,1.45,2.7,.13,m.wood);
 obj('hiddenDoor',11.88,1.5,7.4,.13,2.7,1.3,m.wood);objects.hiddenDoor.visible=false;
 obj('secret',13,.95,7.4,1,.7,1,m.wood);objects.secret.visible=false;
 // Architectural details, useful objects and room-specific storytelling.
 const brass=mat('#bc9860',.4), pale=mat('#c4b6a0'), rust=mat('#704b3c'), green=mat('#38544b');
 function cylinder(x,y,z,r,h,material,parent=scene){const o=new T.Mesh(new T.CylinderGeometry(r,r,h,10),material);o.position.set(x,y,z);parent.add(o);return o}
 function label(text,x,y,z,width=.9,rotation=0){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#d8c9a8';ctx.fillRect(0,0,512,128);ctx.fillStyle='#292d29';ctx.font='bold 49px Georgia';ctx.textAlign='center';ctx.fillText(text,256,83);const texture=new T.CanvasTexture(canvas);const mesh=new T.Mesh(new T.PlaneGeometry(width,width/4),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.y=rotation;scene.add(mesh)}
 names.forEach(([name,x,z])=>label(name,x,2.42,z<0?-1.37:1.37,1.15,z<0?0:Math.PI));
 // Floor runner and layered molding give the central hall a distinct silhouette.
 box(0,.015,0,22,.018,.95,mat('#65463f'));for(let x=-11;x<12;x+=.72)box(x,.028,0,.025,.01,.92,brass);
 for(let x of [-8,0,8]){box(x,2.65,-8.65,2,.1,.2,m.trim);box(x,2.65,8.65,2,.1,.2,m.trim)}
 // Entry: coat rack, umbrella, scattered mail and an actual keyed hook.
 cylinder(-6,1,7.9,.045,2,m.wood);for(let dx of [-.26,.26])box(-6+dx,1.8,7.9,.48,.055,.08,m.wood);
 box(-9.7,1.06,6.3,.5,.025,.28,m.paper);box(-9.4,1.065,6.48,.4,.025,.26,m.paper);
 const key=objects.key;key.scale.set(1,1,1);cylinder(-10,1.11,6,.07,.03,brass);box(-9.88,1.1,6,.22,.025,.035,brass);
 // Living room: framed photos, side table lamp, magazines and detailed television.
 box(-10,.47,-7,.85,.08,2.1,m.trim);box(-9.88,1.05,-7,.08,1.22,1.7,m.trim);cylinder(-6.15,.72,-7.2,.14,.07,brass);box(-6.15,1.02,-7.2,.27,.45,.27,pale);
 for(let i=0;i<4;i++)box(-6.6+i*.19,.73,-7.48,.16,.03,.27,i%2?m.paper:rust);
 for(let i=0;i<3;i++){box(-11.83,1.55,-3.8+i*.55,.08,.45,.37,m.wood);box(-11.77,1.55,-3.8+i*.55,.04,.3,.23,i===1?m.paper:green)}
 // Kitchen: overhead cabinets, hob rings, plates and a kettle with handle and spout.
 for(let x of [-2.5,-1.35,.05,1.45,2.65]){box(x,2.27,-8.55,1.03,.86,.6,m.wood);box(x+.37,2.25,-8.23,.035,.12,.04,brass)}
 for(let x of [-.45,.15]){cylinder(x,.94,-6.05,.24,.018,m.dark);cylinder(x,.95,-6.05,.16,.019,m.metal)}
 cylinder(1.2,1.19,-6,.2,.3,m.metal);box(1.2,1.39,-6,.25,.04,.25,m.dark);box(1.42,1.26,-6,.16,.055,.07,m.metal);
 for(let x of [1.9,2.3])cylinder(x,.97,-6.38,.17,.023,pale);
 // Bedroom: pillows, wardrobe panels, bedside books and wall clock.
 for(let x of [5.5,6.5])box(x,.76,-7,.7,.14,.5,pale);
 box(10.65,1.5,-4.9,.62,2.85,2.5,m.wood);for(let z of [-5.5,-4.3]){box(10.32,1.54,z,.06,2.45,.92,m.trim);cylinder(10.27,1.55,z+.25,.045,.08,brass)}
 for(let i=0;i<3;i++)box(10,.99+i*.12,-6.5,.34,.08,.28,i%2?m.paper:green);
 cylinder(7.3,2.15,-8.72,.33,.045,brass).rotation.x=Math.PI/2;
 // Bathroom: medicine cabinet, basin, towels, tiles and plumbing.
 box(1,.88,7.7,1.25,.12,.65,pale);cylinder(1,.87,7.7,.37,.06,pale);cylinder(1,1.01,8.02,.065,.2,m.metal);
 for(let x=-3.7;x<4;x+=.55)box(x,.5,8.83,.015,1,.025,m.trim);
 for(let x of [2.65,3.05])box(x,1.45,8.77,.32,.75,.09,x===2.65?pale:green);
 // Studio: desk lamp, tape reels, shelves, archive boxes and handwritten labels.
 cylinder(7.8,1.5,6,.07,.6,m.metal);box(7.8,1.82,6,.45,.18,.45,pale);
 for(let x of [8.85,9.2])cylinder(x,1.335,6,.14,.045,m.dark);
 for(let z of [4.5,5.3]){box(10.9,1.4,z,.65,.9,.65,m.wood);label(z===4.5?'1978':'1986',10.56,1.48,z,.35,Math.PI/2)}
 // A side-wall cellar door, with frame, panels, hinges and handle.
 box(11.77,1.5,7.4,.2,2.9,1.58,m.trim);for(let y of [.85,1.87])box(11.68,y,7.4,.035,.62,1.08,m.wood);
 cylinder(11.57,1.42,6.95,.065,.07,brass).rotation.z=Math.PI/2;
 label('PORAO',11.54,2.48,7.4,.8,Math.PI/2);
 // Safe is a multi-part object built into the studio shelving, not a single grey box.
 box(10.78,.64,6.65,.63,.85,.9,m.trim);box(10.42,.64,6.65,.07,.72,.78,m.metal);
 box(10.375,.64,6.65,.02,.58,.63,m.dark);cylinder(10.34,.7,6.65,.16,.04,brass).rotation.z=Math.PI/2;
 for(let z of [6.37,6.93])for(let y of [.38,.9]){const screw=cylinder(10.32,y,z,.023,.02,brass);screw.rotation.z=Math.PI/2}
 obj('safe',10.29,.64,6.65,.04,.75,.8,m.trim);
 // Phone lies flat on the entry console: case, glass, speaker and lit notification.
 box(-9.28,1.11,6,.29,.045,.52,m.dark);obj('phone',-9.28,1.14,6,.24,.009,.42,new T.MeshBasicMaterial({color:'#688894'}));box(-9.28,1.151,5.83,.1,.005,.012,m.dark);
 
 let figure=new T.Group();let silhouette=new T.MeshBasicMaterial({color:'#090c10'});box(0,1.05,0,.47,1.5,.34,silhouette,figure);box(0,2.01,0,.33,.42,.31,silhouette,figure);figure.visible=false;figure.position.set(0,0,0);scene.add(figure);
 return {objects,lights,figure,box,m};
}
