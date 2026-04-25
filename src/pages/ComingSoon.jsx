import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function LeafCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    function resize() { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; }
    resize();
    window.addEventListener('resize', resize);

    function drawLeaf(ctx, size, c1, c2, stemColor) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0,-size);
      ctx.bezierCurveTo(size*0.85,-size*0.55,size*0.85,size*0.55,0,size*0.7);
      ctx.bezierCurveTo(-size*0.85,size*0.55,-size*0.85,-size*0.55,0,-size);
      ctx.closePath();
      const g = ctx.createLinearGradient(-size*0.3,-size,size*0.3,size*0.7);
      g.addColorStop(0,c1); g.addColorStop(1,c2);
      ctx.fillStyle=g; ctx.fill();
      ctx.strokeStyle='rgba(0,60,0,0.12)'; ctx.lineWidth=size*0.04; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0,size*0.7); ctx.quadraticCurveTo(size*0.12,size*1.15,0,size*1.5);
      ctx.strokeStyle=stemColor; ctx.lineWidth=size*0.1; ctx.lineCap='round'; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0,-size*0.85); ctx.lineTo(0,size*0.65);
      ctx.strokeStyle='rgba(0,70,0,0.22)'; ctx.lineWidth=size*0.07; ctx.stroke();
      [[-0.4,-0.5,-0.75,0.05],[0.4,-0.5,0.75,0.05],[-0.35,0,-0.72,0.4],[0.35,0,0.72,0.4],[-0.22,0.32,-0.52,0.58],[0.22,0.32,0.52,0.58]].forEach(([x1,y1,x2,y2])=>{
        ctx.beginPath(); ctx.moveTo(x1*size,y1*size); ctx.lineTo(x2*size,y2*size);
        ctx.strokeStyle='rgba(0,70,0,0.17)'; ctx.lineWidth=size*0.04; ctx.stroke();
      });
      ctx.restore();
    }

    const palettes = [['#72d83c','#2a8a10','#5a3010'],['#4ec828','#1e6e0a','#4a2808'],['#90e055','#3aaa18','#5a3010'],['#3ab818','#1a6008','#4a2808'],['#5cd030','#28900e','#583010'],['#a0e868','#3cb020','#603818'],['#28a010','#145808','#3a2006']];
    const sizeRanges = [{min:5,max:10,weight:25},{min:11,max:18,weight:30},{min:19,max:28,weight:22},{min:29,max:42,weight:15},{min:43,max:62,weight:8}];
    function randomSize() { const total=sizeRanges.reduce((s,r)=>s+r.weight,0); let r=Math.random()*total; for(const range of sizeRanges){r-=range.weight;if(r<=0)return range.min+Math.random()*(range.max-range.min);} return 15; }

    class Leaf {
      constructor(init) { this.reset(init); }
      reset(init) {
        const W=canvas.width, H=canvas.height;
        this.size=randomSize(); this.x=Math.random()*(W+120)-60; this.y=init?Math.random()*(H+100)-50:-this.size*2-10;
        const sf=1-this.size/120;
        this.vy=0.4+sf*1.4+Math.random()*0.8; this.vx=(Math.random()-0.5)*(1.5+(1-sf)*0.8);
        this.wSpeed=0.008+Math.random()*0.025; this.wAmp=20+Math.random()*70; this.t=Math.random()*Math.PI*2;
        this.rotZ=Math.random()*Math.PI*2; this.rotZS=(Math.random()-0.5)*(0.02+sf*0.03);
        this.rotX=Math.random()*Math.PI*2; this.rotXS=(Math.random()-0.5)*0.05;
        this.rotY=Math.random()*Math.PI*2; this.rotYS=(Math.random()-0.5)*0.04;
        const p=palettes[Math.floor(Math.random()*palettes.length)];
        this.c1=p[0]; this.c2=p[1]; this.stem=p[2]; this.alpha=0.72+Math.random()*0.28;
      }
      update() { this.t+=this.wSpeed; this.x+=this.vx+Math.sin(this.t)*0.9; this.y+=this.vy+Math.cos(this.t*0.6)*0.3; this.rotZ+=this.rotZS; this.rotX+=this.rotXS; this.rotY+=this.rotYS; if(this.y>canvas.height+this.size*3)this.reset(false); }
      draw() { ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(this.rotZ); const sx=Math.cos(this.rotY); const sy=Math.abs(Math.cos(this.rotX))*0.45+0.55; ctx.scale(sx===0?0.01:sx,sy); ctx.globalAlpha=this.alpha; drawLeaf(ctx,this.size,this.c1,this.c2,this.stem); ctx.restore(); }
    }

    const leaves = [];
    for(let i=0;i<80;i++) leaves.push(new Leaf(true));
    let animId;
    function loop() { ctx.clearRect(0,0,canvas.width,canvas.height); const sorted=[...leaves].sort((a,b)=>b.size-a.size); sorted.forEach(l=>{l.update();l.draw();}); animId=requestAnimationFrame(loop); }
    loop();
    return () => { window.removeEventListener('resize',resize); cancelAnimationFrame(animId); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:1 }} />
  );
}

export default function ComingSoon() {
  const navigate = useNavigate();
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }, []);

  return (
    <div className="cs-page" style={{ position:'relative', minHeight:'100vh', overflow:'hidden', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingTop:'5rem' }}>

      <div style={{ position:'absolute', inset:0, background:'#f0faf0', zIndex:0 }} />
      <audio ref={audioRef} src="/Eco Audio.mpeg" loop />
      <LeafCanvas />

      <div style={{ position:'relative', zIndex:10, display:'flex', flexDirection:'column', alignItems:'flex-start', padding:'2rem', userSelect:'none', width:'100%', maxWidth:'700px' }}>

        <div className="cs-race-font" style={{ fontSize:'clamp(3rem, 10vw, 7rem)', fontWeight:900, color:'#1a1a1a', lineHeight:0.75, textTransform:'uppercase' }}>RACE</div>
        <div className="cs-race-font" style={{ fontSize:'clamp(2rem, 6.8vw, 4.8rem)', fontWeight:900, color:'#2d7a1e', lineHeight:0.75, textTransform:'uppercase' }}>DISTRICT</div>

        <div style={{ display:'flex', alignItems:'center', gap:2 }}>
          <div className="cs-race-font" style={{ fontSize:'clamp(2rem, 6.8vw, 4.8rem)', fontWeight:900, color:'#3cb521', lineHeight:0.50, textTransform:'uppercase' }}>ECO</div>
          <svg width="100" height="100" viewBox="0 0 900 900" style={{ marginBottom:-25, marginLeft:-15 }}>
            <g><path fill="#498536" d="M 731.953125 531.511719 C 489.75 353.085938 359.007812 548.273438 359.007812 548.273438 C 359.007812 548.273438 489.378906 485.628906 593.007812 531.109375 C 593.007812 531.109375 481.152344 509.746094 372.859375 562.632812 C 372.859375 562.632812 309.164062 594.65625 288.070312 655.390625 C 288.070312 655.390625 319.914062 600.894531 388.65625 576.109375 C 442.488281 618.121094 566.242188 678.242188 731.953125 531.511719"/></g>
            <g><path fill="#80cc28" d="M 478.09375 221.507812 C 167.964844 307.507812 245.941406 546.40625 245.941406 546.40625 C 245.941406 546.40625 279.296875 395.332031 386.007812 338.160156 C 386.007812 338.160156 294.167969 418.183594 267.1875 544.238281 C 267.1875 544.238281 252.085938 618.980469 289.28125 676.832031 C 289.28125 676.832031 264.433594 614.050781 288.960938 539.835938 C 359.871094 522.28125 492.191406 457.835938 478.09375 221.507812"/></g>
          </svg>
        </div>

        <div style={{ width:'100%', height:3, background:'linear-gradient(to right, #3cb521, transparent)', marginTop:6, borderRadius:2 }} />

        <div style={{ marginTop:'1.5rem', fontFamily:'Inter, sans-serif', fontSize:'clamp(0.85rem, 2vw, 1.15rem)', color:'#3a5a3a', fontWeight:500, letterSpacing:'0.04em' }}>
          Something green is growing. Stay tuned.
        </div>

        <div style={{ marginTop:'1.25rem', display:'inline-flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 1.25rem', background:'rgba(44,122,30,0.12)', border:'1px solid rgba(44,122,30,0.3)', borderRadius:'999px', fontFamily:'Orbitron, monospace', fontSize:'0.75rem', fontWeight:800, color:'#2d7a1e', letterSpacing:'0.12em' }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'#3cb521', boxShadow:'0 0 8px #3cb521', animation:'csPulse 1.6s ease-in-out infinite', display:'inline-block' }} />
          COMING SOON
        </div>

        <div className="cs-btn-row" style={{ marginTop:'2rem', display:'flex', gap:'1rem', flexWrap:'wrap' }}>
          <button onClick={()=>navigate('/shop')}
            style={{ padding:'0.75rem 1.75rem', background:'#2d7a1e', border:'none', borderRadius:'0.5rem', color:'white', fontFamily:'Orbitron, sans-serif', fontWeight:700, fontSize:'0.8rem', letterSpacing:'0.08em', cursor:'pointer', transition:'background 0.2s, transform 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#246318';e.currentTarget.style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#2d7a1e';e.currentTarget.style.transform='translateY(0)';}}>
            SHOP NOW
          </button>
          <button onClick={()=>navigate('/about')}
            style={{ padding:'0.75rem 1.75rem', background:'transparent', border:'1px solid rgba(44,122,30,0.5)', borderRadius:'0.5rem', color:'#2d7a1e', fontFamily:'Orbitron, sans-serif', fontWeight:700, fontSize:'0.8rem', letterSpacing:'0.08em', cursor:'pointer', transition:'all 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(44,122,30,0.1)';e.currentTarget.style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.transform='translateY(0)';}}>
            LEARN MORE
          </button>
        </div>
      </div>

      <style>{`
        @font-face {
          font-family: 'Hyperspace Race';
          src: url('/fonts/hyperspace-race-heavy-italic.otf') format('opentype');
          font-weight: 900; font-style: italic; font-display: swap;
        }
        .cs-race-font { font-family: 'Hyperspace Race', 'Arial Black', Impact, sans-serif; font-style: italic; }
        @keyframes csPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.35); } }

        /* ── Mobile: HUGE text, ZERO gap between DISTRICT and ECO ── */
        @media (max-width: 768px) {
          .cs-page { 
            padding-top: 4rem !important; 
            justify-content: center !important; 
          }
          .cs-page > div:nth-child(3) {
            padding: 1rem 1rem !important;
            align-items: center !important;
            text-align: center !important;
            max-width: 100% !important;
          }
          
          /* HUGE text on mobile */
          .cs-page > div:nth-child(3) > .cs-race-font:nth-child(1) { 
            font-size: clamp(6rem, 28vw, 11rem) !important; 
            line-height: 0.8 !important;
            margin-bottom: -0.3rem !important;
          }
          .cs-page > div:nth-child(3) > .cs-race-font:nth-child(2) { 
            font-size: clamp(4.5rem, 20vw, 8rem) !important; 
            line-height: 0.8 !important;
            margin-top: -0.4rem !important;
            margin-bottom: -0.4rem !important;
          }
          
          /* ECO row - TIGHT spacing, almost touching DISTRICT */
          .cs-page > div:nth-child(3) > div:nth-child(3) {
            margin-top: -0.5rem !important;
            line-height: 0.8 !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .cs-page > div:nth-child(3) > div:nth-child(3) .cs-race-font { 
            font-size: clamp(4.5rem, 20vw, 8rem) !important; 
            line-height: 0.8 !important;
          }
          
          /* Bigger leaf icon */
          .cs-page svg[viewBox="0 0 900 900"] { 
            width: 100px !important; 
            height: 100px !important; 
            margin-bottom: -10px !important;
            margin-left: -5px !important;
          }
          
          /* Centered gradient line */
          .cs-page > div:nth-child(3) > div:nth-child(4) {
            background: linear-gradient(to right, transparent, #3cb521, transparent) !important;
            margin-top: 0.5rem !important;
            height: 4px !important;
          }
          
          /* Full width buttons */
          .cs-btn-row { 
            flex-direction: column !important; 
            width: 100% !important; 
            gap: 0.75rem !important;
            margin-top: 2rem !important;
          }
          .cs-btn-row button { 
            width: 100% !important; 
            text-align: center !important; 
            padding: 1.1rem 1.75rem !important;
            font-size: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}