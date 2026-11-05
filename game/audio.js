export class AudioHouse{
 constructor(){this.ctx=null;this.volume=.6;this.timer=0}
 start(){try{this.ctx??=new (window.AudioContext||window.webkitAudioContext)();this.ctx.resume().catch(()=>{});}catch{this.ctx=null}}
 tone(freq=130,duration=.13,type='sine',volume=.16){if(!this.ctx)return;let o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,this.ctx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.65),this.ctx.currentTime+duration);g.gain.setValueAtTime(volume*this.volume,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+duration);o.connect(g).connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+duration+.01)}
 step(){this.tone(72,.055,'triangle',.09)}
 creak(){this.tone(180,.45,'sawtooth',.08)}
 tick(){this.tone(850,.025,'square',.025)}
}
