import { useState, useEffect, useRef, useCallback } from "react";
import { HEXAGRAMS, throwCoins, lookupHexagram } from "./iching.js";
import { THC_TETRAGRAMS, throwTHCLine, lookupTHC } from "./thc.js";
import { DEMONS, findDemonsByZones } from "./demons.js";
import { SYZYGIES, ZONES, mapDecagram, HEXAGRAM_LINE_ZONES, TETRAGRAM_LINE_ZONES, LINE_PAIR_SYZYGIES } from "./numogram.js";
import { PATHS } from "./paths.js";

const G="#0f3",P="#b44aff",PD="#7a2db8",C="#00e5ff",A="#ffb800",AD="#b38600";

// ── BACKGROUND: pure black, no particles ──

// ── CSS COIN (realistic 3D flip) ──
function Coin3D({result,spinning,delay=0,size=58,showVal=true}){
  const[done,setDone]=useState(false);const[tick,setTick]=useState(0);const[pulse,setPulse]=useState(false);
  useEffect(()=>{if(!spinning){setDone(false);setTick(0);setPulse(false);return}
    const st=Date.now();const iv=setInterval(()=>{if(Date.now()-st<delay)return;setTick(t=>t+1)},50);
    const dur=1400+delay+Math.random()*500;
    const to=setTimeout(()=>{clearInterval(iv);setDone(true);setPulse(true);setTimeout(()=>setPulse(false),400)},dur);
    return()=>{clearInterval(iv);clearTimeout(to)}},[spinning,delay]);
  const isHeads=result===3||result===1;
  const spinRot=tick*43;
  // Final: heads face forward (0deg), tails face forward (180deg)
  const finalRot=done?(isHeads?360:540):spinRot;
  const bfv={WebkitBackfaceVisibility:"hidden",backfaceVisibility:"hidden"};
  return(
    <div style={{width:size,height:size+10,display:"inline-flex",flexDirection:"column",alignItems:"center",gap:3}}>
      <div style={{width:size,height:size,perspective:600}}>
        <div style={{width:"100%",height:"100%",position:"relative",transformStyle:"preserve-3d",
          transform:`rotateY(${finalRot}deg)${pulse?" scale(1.15)":""}`,
          transition:done?"transform 0.6s cubic-bezier(.17,.67,.35,1.2)":"none",
        }}>
          {/* HEADS (front face) */}
          <div style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",borderRadius:"50%",...bfv,
            background:"radial-gradient(circle at 38% 30%,#f0d080,#c9a030 25%,#8b6914 55%,#5a4208 85%,#3a2a04)",
            border:"2px solid #c9a03088",
            boxShadow:done&&isHeads?`0 0 18px ${G}55,inset 0 2px 4px rgba(255,255,255,.2),inset 0 -2px 4px rgba(0,0,0,.3)`:"inset 0 2px 3px rgba(255,255,255,.15),inset 0 -2px 3px rgba(0,0,0,.25)",
            display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",
          }}>
            <span style={{fontSize:size*.34,color:"#3a2a04",textShadow:"0 1px 0 rgba(255,255,255,.15)",lineHeight:1}}>☰</span>
            <span style={{fontSize:size*.1,color:"#5a420855",letterSpacing:1,marginTop:2,fontFamily:"monospace"}}>YANG</span>
            <div style={{position:"absolute",width:"82%",height:"82%",borderRadius:"50%",border:"1px solid rgba(255,255,255,.06)",top:"9%",left:"9%",pointerEvents:"none"}}/>
          </div>
          {/* TAILS (back face — pre-rotated 180deg) */}
          <div style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",borderRadius:"50%",...bfv,
            transform:"rotateY(180deg)",
            background:"radial-gradient(circle at 38% 30%,#aaa,#777 25%,#444 55%,#222 85%,#111)",
            border:"2px solid #55555555",
            boxShadow:done&&!isHeads?`0 0 12px #88888855,inset 0 2px 3px rgba(255,255,255,.1),inset 0 -2px 3px rgba(0,0,0,.3)`:"inset 0 2px 3px rgba(255,255,255,.08),inset 0 -2px 3px rgba(0,0,0,.2)",
            display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",
          }}>
            <span style={{fontSize:size*.34,color:"#777",textShadow:"0 1px 0 rgba(255,255,255,.06)",lineHeight:1}}>☷</span>
            <span style={{fontSize:size*.1,color:"#55555555",letterSpacing:1,marginTop:2,fontFamily:"monospace"}}>YIN</span>
            <div style={{position:"absolute",width:"82%",height:"82%",borderRadius:"50%",border:"1px solid rgba(255,255,255,.03)",top:"9%",left:"9%",pointerEvents:"none"}}/>
          </div>
        </div>
      </div>
      {showVal&&done&&<div style={{fontSize:8,color:isHeads?G:"#888",fontFamily:"monospace",letterSpacing:1,textShadow:isHeads?`0 0 4px ${G}`:"none",textAlign:"center"}}>
        {result===3?"3 ☰":result===2?"2 ☷":isHeads?"H":"T"}
      </div>}
    </div>
  );
}

// ── HEXAGRAM LINE ──
const LW=200,LG=24;
function HexLine({yang,changing,revealed,delay}){const[s,setS]=useState(false);useEffect(()=>{if(revealed){const t=setTimeout(()=>setS(true),delay);return()=>clearTimeout(t)}else setS(false)},[revealed,delay]);if(!s)return<div style={{height:20,display:"flex",alignItems:"center",justifyContent:"center",width:LW}}><span style={{fontFamily:"monospace",color:G,fontSize:9,letterSpacing:4,opacity:.15}}>· · · · · ·</span></div>;const col=changing?P:G,glow=changing?`0 0 12px ${P},0 0 24px ${P}44`:`0 0 8px ${G}`,sw=(LW-LG)/2;return<div style={{height:20,display:"flex",alignItems:"center",justifyContent:"center",width:LW,animation:"lineReveal .4s ease-out"}}>{yang?<div style={{width:LW,height:5,background:col,boxShadow:glow,borderRadius:1}}/>:<div style={{display:"flex",width:LW,justifyContent:"space-between"}}><div style={{width:sw,height:5,background:col,boxShadow:glow,borderRadius:1}}/><div style={{width:sw,height:5,background:col,boxShadow:glow,borderRadius:1}}/></div>}</div>}

// ── TETRAGRAM LINE ──
function TetLine({value,revealed,delay}){const[s,setS]=useState(false);useEffect(()=>{if(revealed){const t=setTimeout(()=>setS(true),delay);return()=>clearTimeout(t)}else setS(false)},[revealed,delay]);if(!s)return<div style={{height:20,display:"flex",alignItems:"center",justifyContent:"center",width:LW}}><span style={{fontFamily:"monospace",color:C,fontSize:9,letterSpacing:4,opacity:.15}}>· · · · · ·</span></div>;const glow=`0 0 8px ${C}`;if(value===0)return<div style={{height:20,display:"flex",alignItems:"center",justifyContent:"center",width:LW,animation:"lineReveal .4s ease-out"}}><div style={{width:LW,height:5,background:C,boxShadow:glow,borderRadius:1}}/></div>;const sw2=(LW-LG)/2,sw3=(LW-24)/3;if(value===1)return<div style={{height:20,display:"flex",alignItems:"center",justifyContent:"center",width:LW,animation:"lineReveal .4s ease-out"}}><div style={{display:"flex",width:LW,justifyContent:"space-between"}}><div style={{width:sw2,height:5,background:C,boxShadow:glow,borderRadius:1}}/><div style={{width:sw2,height:5,background:C,boxShadow:glow,borderRadius:1}}/></div></div>;return<div style={{height:20,display:"flex",alignItems:"center",justifyContent:"center",width:LW,animation:"lineReveal .4s ease-out"}}><div style={{display:"flex",width:LW,justifyContent:"space-between"}}><div style={{width:sw3,height:5,background:C,boxShadow:glow,borderRadius:1}}/><div style={{width:sw3,height:5,background:C,boxShadow:glow,borderRadius:1}}/><div style={{width:sw3,height:5,background:C,boxShadow:glow,borderRadius:1}}/></div></div>}

// ── COLLAPSIBLE ──
function Col({title,children,color=G}){const[o,setO]=useState(false);return<div style={{border:`1px solid ${o?color+"40":"#0f320"}`,borderRadius:2,marginBottom:12,background:o?"rgba(0,255,51,0.012)":"transparent",transition:"all .3s"}}><button onClick={()=>setO(!o)} style={{width:"100%",padding:"12px 14px",background:"transparent",border:"none",color,fontFamily:"monospace",fontSize:10,letterSpacing:3,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",textAlign:"left"}}><span>{title}</span><span style={{transform:o?"rotate(180deg)":"rotate(0)",transition:"transform .3s",fontSize:9,color:color+"88"}}>▼</span></button>{o&&<div style={{padding:"0 14px 14px",animation:"fadeIn .4s ease-out",fontSize:"clamp(13px,3.5vw,15px)",lineHeight:1.9,color:"#0a8"}}>{children}</div>}</div>}

// ── MAIN APP ──
export default function App(){
  const[phase,setPhase]=useState("intro");// intro|question|casting_iching|casting_thc|forming|reading
  const[question,setQuestion]=useState("");
  const[glitch,setGlitch]=useState(false);
  // I Ching state
  const[hexLines,setHexLines]=useState([]);const[hexCoins,setHexCoins]=useState([]);
  const[hexSpinning,setHexSpinning]=useState(false);const[hexThrow,setHexThrow]=useState(0);
  const[hexagram,setHexagram]=useState(null);const[relHex,setRelHex]=useState(null);
  // THC state
  const[tetLines,setTetLines]=useState([]);const[tetCoins,setTetCoins]=useState([]);
  const[tetSpinning,setTetSpinning]=useState(false);const[tetThrow,setTetThrow]=useState(0);
  const[tetragram,setTetragram]=useState(null);
  // Decagram state
  const[decagram,setDecagram]=useState(null);const[showReading,setShowReading]=useState(false);
  const[activeTab,setActiveTab]=useState(0);// 0=iching,1=thc,2=decagram
  // Reading history (max 9)
  const[history,setHistory]=useState([]);
  const[viewingHistory,setViewingHistory]=useState(null);// index into history or null

  const saveToHistory=(q,hex,rel,tet,dec,hLines,tLines)=>{
    const entry={question:q,hexagram:hex,relatingHex:rel,tetragram:tet,decagram:dec,hexLines:hLines,tetLines:tLines,timestamp:Date.now()};
    setHistory(prev=>[entry,...prev].slice(0,9));
  };

  const loadFromHistory=(idx)=>{
    const e=history[idx];if(!e)return;
    setViewingHistory(idx);setQuestion(e.question);setHexagram(e.hexagram);setRelHex(e.relatingHex);
    setTetragram(e.tetragram);setDecagram(e.decagram);setHexLines(e.hexLines||[]);setTetLines(e.tetLines||[]);
    setPhase("reading");setShowReading(true);setActiveTab(0);
  };

  useEffect(()=>{const iv=setInterval(()=>{setGlitch(true);setTimeout(()=>setGlitch(false),100+Math.random()*150)},4000+Math.random()*6000);return()=>clearInterval(iv)},[]);

  const reset=()=>{setPhase("intro");setHexLines([]);setHexCoins([]);setHexThrow(0);setHexagram(null);setRelHex(null);setTetLines([]);setTetCoins([]);setTetThrow(0);setTetragram(null);setDecagram(null);setShowReading(false);setActiveTab(0)};
  const startCast=()=>{setPhase("question");reset();setPhase("question")};

  // ── AUTOMATED DUAL CAST ──
  const castAll=useCallback(()=>{
    setPhase("casting_iching");
    const hResults=[];for(let i=0;i<6;i++)hResults.push(throwCoins());
    const tResults=[];for(let i=0;i<4;i++)tResults.push(throwTHCLine());
    let idx=0;
    // I Ching phase
    const doHex=()=>{
      if(idx>=6){
        const hex=lookupHexagram(hResults);setHexagram(hex);
        if(hResults.some(l=>l.changing)){const ch=hResults.map(l=>({...l,yang:l.changing?!l.yang:l.yang,changing:false}));setRelHex(lookupHexagram(ch))}
        setTimeout(()=>{setPhase("casting_thc");idx=0;setTimeout(doTet,600)},800);
        return;
      }
      setHexThrow(idx);setHexSpinning(true);
      setTimeout(()=>{setHexCoins(prev=>[...prev,hResults[idx]]);setHexSpinning(false);
        setTimeout(()=>{setHexLines(prev=>[...prev,hResults[idx]]);idx++;setTimeout(doHex,400)},400);
      },1000+Math.random()*300);
    };
    // THC phase
    const doTet=()=>{
      if(idx>=4){
        const tet=lookupTHC(tResults.map(r=>r.value));setTetragram(tet);
        setTimeout(()=>{
          // Compute Decagram
          const dm=mapDecagram(hResults,tResults);
          const activeSet=new Set(dm.hotZones.filter(z=>z.intensity>=2).map(z=>z.zone));
          const demons=findDemonsByZones(activeSet);
          const dm2={...dm,demons,primaryDemon:demons[0]||null};
          setDecagram(dm2);
          setViewingHistory(null);
          // Save to history
          const hex2=lookupHexagram(hResults);
          const rel2=hResults.some(l=>l.changing)?lookupHexagram(hResults.map(l=>({...l,yang:l.changing?!l.yang:l.yang,changing:false}))):null;
          const tet2=lookupTHC(tResults.map(r=>r.value));
          saveToHistory(question,hex2,rel2,tet2,dm2,[...hResults],[...tResults]);
          setPhase("reading");setTimeout(()=>setShowReading(true),600);
        },600);
        return;
      }
      setTetThrow(idx);setTetSpinning(true);
      setTimeout(()=>{setTetCoins(prev=>[...prev,tResults[idx]]);setTetSpinning(false);
        setTimeout(()=>{setTetLines(prev=>[...prev,tResults[idx]]);idx++;setTimeout(doTet,400)},400);
      },1000+Math.random()*300);
    };
    doHex();
  },[]);

  const lineLabels=["First","Second","Third","Fourth","Fifth","Sixth"];
  const lineTypes={old_yin:"OLD YIN [6]",young_yang:"YOUNG YANG [7]",young_yin:"YOUNG YIN [8]",old_yang:"OLD YANG [9]"};

  return(
    <div style={{minHeight:"100vh",background:"#000",color:G,fontFamily:"'Courier New','Lucida Console',monospace",position:"relative",overflow:"hidden"}}>
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1,pointerEvents:"none",background:"repeating-linear-gradient(0deg,rgba(0,0,0,.08) 0px,rgba(0,0,0,.08) 1px,transparent 1px,transparent 3px)"}}/>
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:1,pointerEvents:"none",background:"radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.6) 100%)"}}/>
      {/* pure black background — no particles */}
      <div style={{position:"relative",zIndex:2,maxWidth:620,margin:"0 auto",padding:"20px 16px"}}>

        {/* HEADER */}
        <header style={{textAlign:"center",padding:"24px 0 16px"}}>
          <div style={{fontSize:"clamp(8px,2vw,10px)",letterSpacing:8,color:"#0a5",marginBottom:10}}>DUAL ORACLE ⌁ DECIMAL LABYRINTH</div>
          <h1 style={{fontSize:"clamp(32px,9vw,56px)",fontWeight:400,letterSpacing:".12em",margin:"0 0 4px",lineHeight:1,textShadow:glitch?`-2px 0 #f00,2px 0 ${P}`:`0 0 20px ${G},0 0 40px ${G}88`,transform:glitch?`translate(${Math.random()*4-2}px,${Math.random()*2-1}px)`:"none",transition:glitch?"none":"text-shadow .3s"}}>十線圖</h1>
          <div style={{fontSize:"clamp(14px,4vw,22px)",letterSpacing:".3em",color:G,textShadow:`0 0 10px ${G}`,transform:glitch?"skewX(-2deg)":"none"}}>DECAGRAM</div>
          <div style={{fontSize:8,color:"#0c8",letterSpacing:4,marginTop:6}}>I CHING ⌁ T'AI HSÜAN CHING ⌁ NUMOGRAM</div>
        </header>

        {/* INTRO */}
        {phase==="intro"&&<div style={{padding:"8px 0 30px",animation:"fadeIn 1s ease-out"}}>
          <div style={{textAlign:"center",marginBottom:20}}><button onClick={startCast} style={{padding:"16px 40px",background:"transparent",border:`1px solid ${A}`,color:A,fontFamily:"monospace",fontSize:13,letterSpacing:6,cursor:"pointer",borderRadius:2,boxShadow:`0 0 15px ${A}18,inset 0 0 15px ${A}08`,transition:"all .3s"}}>CAST THE DECAGRAM</button></div>
          <Col title="WHAT IS THE DECAGRAM?"><p style={{margin:"0 0 10px"}}>The <strong style={{color:A}}>Decagram (十線圖)</strong> is a novel divination system that unifies three frameworks: the <strong style={{color:G}}>I Ching</strong> (64 hexagrams, binary), the <strong style={{color:C}}>T'ai Hsüan Ching</strong> (81 tetragrams, ternary), and the <strong style={{color:A}}>CCRU Numogram</strong> (10 zones, 45 demons).</p><p style={{margin:"0 0 10px"}}>The I Ching's binary system maps to 6 of the 10 Numogram zones (the Time-Circuit: 1,2,4,5,7,8). The excluded zones (0,3,6,9) are the triadic residue — what binary can't see. The THC's ternary system accesses precisely these hidden zones. Together, binary + ternary = the complete decimal labyrinth.</p><p style={{margin:0}}>The Decagram casts both oracles for a single question, then maps both readings onto the Numogram to reveal what neither oracle can see alone. It also identifies the demon whose rite-route passes through the activated zones, and delivers the corresponding reading from the <em>Book of Paths</em>.</p></Col>
          <Col title="HOW DOES THE I CHING WORK?"><p style={{margin:"0 0 10px"}}>The I Ching uses the <strong style={{color:G}}>three-coin method</strong>. For each of six lines, three coins are thrown. Heads=3, tails=2. The sum determines the line type: 6=old yin (<span style={{color:P}}>changing</span>), 7=young yang, 8=young yin, 9=old yang (<span style={{color:P}}>changing</span>). Lines are built bottom-up. Changing lines create a Relating Hexagram showing where the situation is heading.</p></Col>
          <Col title="HOW DOES THE T'AI HSÜAN CHING WORK?" color={C}><p style={{margin:"0 0 10px"}}>The THC uses a <strong style={{color:C}}>four-coin method</strong>. Two pairs of coins are thrown (re-throw if both tails). Total heads: 2=Heaven ⚊ (solid), 3=Earth ⚋ (once-broken), 4=Man 𝌀 (twice-broken). Lines are built <strong style={{color:C}}>top-down</strong>. No changing lines — each consultation produces a single tetragram from the 81 in the system.</p></Col>
          <Col title="WHAT IS THE NUMOGRAM?" color={A}><p style={{margin:"0 0 10px"}}>The CCRU <strong style={{color:A}}>Decimal Labyrinth</strong>: 10 zones (0-9), grouped into 5 syzygies by 9-sum twinning. Three time-systems: the <strong style={{color:G}}>Time-Circuit</strong> (zones 1,2,4,5,7,8 — what the I Ching reads), the <strong style={{color:C}}>Warp</strong> (zones 3,6), and the <strong style={{color:C}}>Plex</strong> (zones 0,9). 45 demons of the Pandemonium Matrix inhabit the zone-pairs. 84 paths from the <em>Book of Paths</em> trace routes through the labyrinth.</p><p style={{margin:0,fontSize:"clamp(11px,3vw,13px)",color:"#0c8"}}>"There is considerable evidence, both immanent and historical, that the Chinese I Ching and the Nma numogram share a hypercultural matrix." — CCRU, Decimal Labyrinth</p></Col>
          <Col title="THE BOOK OF PATHS" color={A}><p style={{margin:"0 0 10px"}}>The <strong style={{color:A}}>Book of Paths</strong> is an ancient oracular text translated from Tibetan by <strong style={{color:A}}>Chaim Horowitz</strong> and sent to Peter Vysparov in 1949. Vysparov mapped its 84 paths onto the Pandemonium Matrix, discovering that each path corresponds to a specific demon rite — a zone-traversal sequence through the Numogram.</p><p style={{margin:"0 0 10px",fontStyle:"italic",color:"#0c8",borderLeft:`2px solid ${A}30`,paddingLeft:12}}>From Horowitz's letter to Vysparov (February 1949): "Here at last is a complete translation of the Old Book... Echidna [Stillwell] has been able to find some tantalizing traces of its history within Chinese sources dating back to the Warring States period, when it was already considered profoundly archaic, with more than one 'dark school' even suggesting that it preceded the I Ching."</p><p style={{margin:"0 0 10px",fontStyle:"italic",color:"#0c8",borderLeft:`2px solid ${A}30`,paddingLeft:12}}>"She has stumbled upon persistent rumours that a series of 84 bronze tablets were inexplicably removed from the Shu Kingdom excavation site by figures described variously as 'looters' or 'senior officials'."</p><p style={{margin:0,fontSize:"clamp(11px,3vw,13px)",color:"#0c8"}}>Source: Vysparov Library, via CCRU (2003). The Horowitz-Vysparov concordance and complete Book of Paths text are available at ccru.net.</p></Col>
          <Col title="HOW DOES THE MAPPING WORK?" color={A}><p style={{margin:"0 0 10px"}}>Digital reduction of binary powers: 1,2,4,8,16→7,32→5 — a 6-cycle mapping to hexagram lines AND Time-Circuit zones. Hexagram line-pairs map to syzygies via 9-twinning: 8:1 (Mur Mur), 7:2 (Oddubb), 5:4 (Katak).</p><p style={{margin:0}}>The THC's ternary system accesses zones 0,3,6,9 — the triadic residue the binary system excludes. Four tetragram lines map to four outer zones: 9 (top), 6, 3, 0 (bottom). The I Ching reads the Time-Circuit; the THC reads Warp/Plex; together they read the whole Numogram.</p></Col>

          {/* READING LOG */}
          {history.length>0&&<div style={{marginTop:8}}>
            <div style={{fontSize:9,color:A,letterSpacing:4,marginBottom:10,textAlign:"center"}}>READING LOG ({history.length}/9)</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {history.map((entry,idx)=>{
                const d=new Date(entry.timestamp);
                const time=d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
                const date=d.toLocaleDateString([],{month:"short",day:"numeric"});
                const isViewing=viewingHistory===idx;
                return <button key={idx} onClick={()=>loadFromHistory(idx)} style={{
                  width:"100%",padding:"10px 14px",background:isViewing?"rgba(255,184,0,.06)":"rgba(0,0,0,.3)",
                  border:`1px solid ${isViewing?A+"50":"#0f320"}`,borderRadius:2,cursor:"pointer",
                  display:"flex",alignItems:"center",gap:10,textAlign:"left",
                  fontFamily:"monospace",transition:"all .2s",
                }}>
                  <div style={{fontSize:8,color:"#0c8",minWidth:48,flexShrink:0,lineHeight:1.4}}>
                    <div>{date}</div><div>{time}</div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:10,color:isViewing?A:G,letterSpacing:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {entry.question||"(no question)"}
                    </div>
                    <div style={{fontSize:8,color:"#0c8",marginTop:2,display:"flex",gap:8,flexWrap:"wrap"}}>
                      <span style={{color:G}}>{entry.hexagram?.n}. {entry.hexagram?.name}</span>
                      <span style={{color:C}}>{entry.tetragram?.n}. {entry.tetragram?.name}</span>
                      {entry.decagram?.primaryDemon&&<span style={{color:A}}>{entry.decagram.primaryDemon.demon.name}</span>}
                    </div>
                  </div>
                  <div style={{fontSize:10,color:"#0c8",flexShrink:0}}>→</div>
                </button>
              })}
            </div>
            <div style={{fontSize:8,color:"#0c8",textAlign:"center",marginTop:6,letterSpacing:2}}>TAP TO REVISIT ⌁ SESSION HISTORY</div>
          </div>}
        </div>}

        {/* QUESTION */}
        {phase==="question"&&<div style={{textAlign:"center",padding:"16px 0",animation:"fadeIn .6s ease-out"}}>
          <div style={{fontSize:9,color:"#0a5",letterSpacing:4,marginBottom:12}}>FORMULATE YOUR INQUIRY</div>
          <div style={{fontSize:12,color:"#0a8",lineHeight:1.8,marginBottom:14,maxWidth:440,margin:"0 auto 14px",textAlign:"left",padding:"0 8px"}}>The Decagram casts both the I Ching and the T'ai Hsüan Ching, then maps both readings onto the Numogram. Ask what you need to understand.</div>
          <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="What do I need to understand about..." style={{width:"100%",maxWidth:440,height:72,background:"rgba(0,255,51,.03)",border:`1px solid ${G}40`,borderRadius:2,color:G,fontFamily:"monospace",fontSize:13,padding:12,resize:"none",outline:"none"}} onFocus={e=>e.target.style.borderColor=A} onBlur={e=>e.target.style.borderColor=G+"40"}/>
          <div style={{marginTop:14}}><button onClick={castAll} style={{padding:"14px 36px",background:"transparent",border:`1px solid ${A}`,color:A,fontFamily:"monospace",fontSize:12,letterSpacing:5,cursor:"pointer",borderRadius:2,boxShadow:`0 0 15px ${A}18`}}>CAST THE DECAGRAM</button></div>
          <div style={{fontSize:9,color:"#0c8",marginTop:10,letterSpacing:2}}>6 I CHING + 4 THC THROWS ⌁ FULLY AUTOMATED</div>
        </div>}

        {/* CASTING I CHING */}
        {phase==="casting_iching"&&<div style={{textAlign:"center",padding:"10px 0",animation:"fadeIn .3s ease-out"}}>
          {question&&<div style={{fontSize:10,color:"#0c8",padding:"6px 12px",border:`1px solid ${G}15`,borderRadius:2,background:"rgba(0,255,51,.02)",maxWidth:440,margin:"0 auto 12px"}}>"{question.length>60?question.slice(0,60)+"...":question}"</div>}
          <div style={{fontSize:9,color:G,letterSpacing:4,marginBottom:6}}>易經 I CHING — LINE {hexThrow+1} OF 6</div>
          <div style={{display:"flex",justifyContent:"center",gap:8,margin:"10px 0"}}>
            {[0,1,2].map(i=><Coin3D key={i} result={hexCoins[hexThrow]?.coins[i]} spinning={hexSpinning} delay={i*120} size={52}/>)}
          </div>
          {hexCoins.length>0&&<div style={{fontSize:10,color:hexCoins[hexCoins.length-1]?.changing?P:G,letterSpacing:2,margin:"4px 0 8px"}}>{lineLabels[hexCoins.length-1]} → {lineTypes[hexCoins[hexCoins.length-1]?.lineType]}{hexCoins[hexCoins.length-1]?.changing?" ⚡":"" }</div>}
          <div style={{margin:"8px auto",padding:"10px 0",border:`1px solid ${G}15`,borderRadius:2,background:"rgba(0,0,0,.4)",width:"fit-content"}}>
            <div style={{fontSize:8,color:"#0a5",letterSpacing:4,marginBottom:8,textAlign:"center"}}>HEXAGRAM</div>
            <div style={{display:"flex",flexDirection:"column-reverse",gap:3,alignItems:"center",padding:"0 20px"}}>
              {[0,1,2,3,4,5].map(i=><div key={i} style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:7,color:"#0c8",width:10,textAlign:"right"}}>{i+1}</span><HexLine yang={hexLines[i]?.yang} changing={hexLines[i]?.changing} revealed={i<hexLines.length} delay={0}/></div>)}
            </div>
          </div>
        </div>}

        {/* CASTING THC */}
        {phase==="casting_thc"&&<div style={{textAlign:"center",padding:"10px 0",animation:"fadeIn .3s ease-out"}}>
          <div style={{fontSize:9,color:C,letterSpacing:4,marginBottom:6}}>太玄經 T'AI HSÜAN CHING — LINE {tetThrow+1} OF 4</div>
          <div style={{display:"flex",justifyContent:"center",gap:8,margin:"10px 0"}}>
            {[0,1,2,3].map(i=><Coin3D key={i} result={tetCoins[tetThrow]?1:null} spinning={tetSpinning} delay={i*100} size={44}/>)}
          </div>
          {tetCoins.length>0&&<div style={{fontSize:10,color:C,letterSpacing:2,margin:"4px 0 8px"}}>{tetCoins[tetCoins.length-1]?.label}</div>}
          <div style={{display:"flex",gap:16,justifyContent:"center",margin:"8px auto"}}>
            {/* Show completed hexagram */}
            <div style={{padding:"10px 0",border:`1px solid ${G}15`,borderRadius:2,background:"rgba(0,0,0,.4)",width:"fit-content"}}>
              <div style={{fontSize:7,color:"#0a5",letterSpacing:3,marginBottom:6,textAlign:"center"}}>易經</div>
              <div style={{display:"flex",flexDirection:"column-reverse",gap:2,alignItems:"center",padding:"0 16px"}}>
                {[0,1,2,3,4,5].map(i=><HexLine key={i} yang={hexLines[i]?.yang} changing={hexLines[i]?.changing} revealed={true} delay={0}/>)}
              </div>
            </div>
            {/* Tetragram forming */}
            <div style={{padding:"10px 0",border:`1px solid ${C}15`,borderRadius:2,background:"rgba(0,0,0,.4)",width:"fit-content"}}>
              <div style={{fontSize:7,color:C+"88",letterSpacing:3,marginBottom:6,textAlign:"center"}}>太玄經</div>
              <div style={{display:"flex",flexDirection:"column",gap:2,alignItems:"center",padding:"0 16px"}}>
                {[0,1,2,3].map(i=><TetLine key={i} value={tetLines[i]?.value} revealed={i<tetLines.length} delay={0}/>)}
              </div>
            </div>
          </div>
        </div>}

        {/* READING */}
        {phase==="reading"&&<div style={{padding:"8px 0 40px",animation:"fadeIn .8s ease-out"}}>
          {question&&<div style={{textAlign:"center",fontSize:"clamp(12px,3.2vw,14px)",color:"#0a8",marginBottom:16,padding:"8px 14px",border:`1px solid ${A}20`,borderRadius:2,background:"rgba(255,184,0,.02)",lineHeight:1.6}}>"{question}"</div>}

          {/* Decagram figure */}
          <div style={{margin:"0 auto 20px",padding:"16px 0",border:`1px solid ${A}40`,borderRadius:2,background:"rgba(255,184,0,.02)",boxShadow:`0 0 20px ${A}08`,width:"fit-content"}}>
            <div style={{fontSize:8,color:A,letterSpacing:6,textAlign:"center",marginBottom:10}}>THE DECAGRAM</div>
            <div style={{display:"flex",gap:20,justifyContent:"center",alignItems:"center",padding:"0 20px"}}>
              <div><div style={{fontSize:7,color:G+"88",letterSpacing:2,textAlign:"center",marginBottom:4}}>易經</div>
                <div style={{display:"flex",flexDirection:"column-reverse",gap:2,alignItems:"center"}}>
                  {hexLines.map((l,i)=><HexLine key={i} yang={l.yang} changing={l.changing} revealed={true} delay={i*80}/>)}
                </div>
              </div>
              <div style={{width:1,height:120,background:`${A}30`}}/>
              <div><div style={{fontSize:7,color:C+"88",letterSpacing:2,textAlign:"center",marginBottom:4}}>太玄經</div>
                <div style={{display:"flex",flexDirection:"column",gap:2,alignItems:"center"}}>
                  {tetLines.map((l,i)=><TetLine key={i} value={l.value} revealed={true} delay={i*80+500}/>)}
                </div>
              </div>
            </div>
          </div>

          {/* Tab selector */}
          {showReading&&<>
          <div style={{display:"flex",justifyContent:"center",gap:0,marginBottom:16}}>
            {[["易經 TEMPORAL",G],["太玄經 CRYPTIC",C],["十線圖 DECAGRAM",A]].map(([label,col],i)=>{
              const active=activeTab===i;
              return <button key={i} onClick={()=>setActiveTab(i)} style={{padding:"10px 16px",background:active?"rgba(0,0,0,.8)":"rgba(0,0,0,.6)",border:`1px solid ${active?col:col+"44"}`,borderRight:i<2?"none":undefined,color:active?col:col+"66",fontFamily:"monospace",fontSize:"clamp(8px,2.2vw,10px)",letterSpacing:2,cursor:"pointer",borderRadius:i===0?"2px 0 0 2px":i===2?"0 2px 2px 0":"0",transition:"all .3s",boxShadow:active?`0 0 8px ${col}22,inset 0 0 12px ${col}08`:"none"}}>{label}</button>
            })}
          </div>

          {/* TAB 0: I CHING READING */}
          {activeTab===0&&hexagram&&<div style={{animation:"fadeIn .6s ease-out"}}>
            <div style={{border:`1px solid ${G}50`,borderRadius:2,padding:"20px 16px",background:"rgba(0,255,51,.02)",marginBottom:16}}>
              <div style={{textAlign:"center",marginBottom:14}}>
                <div style={{fontSize:9,color:"#0a5",letterSpacing:6}}>THE TEMPORAL FLOW</div>
                <div style={{fontSize:"clamp(32px,8vw,48px)",margin:"6px 0",textShadow:`0 0 16px ${G},0 0 32px ${G}66`,animation:"pulseGlow 3s ease-in-out infinite"}}>{hexagram.tri[0]}<br/>{hexagram.tri[1]}</div>
                <div style={{fontSize:"clamp(18px,5vw,26px)",letterSpacing:".12em",textShadow:`0 0 10px ${G}`}}>{hexagram.n}. {hexagram.name}</div>
                <div style={{fontSize:"clamp(12px,3.2vw,15px)",color:"#0a8",letterSpacing:3,marginTop:4}}>{hexagram.eng.toUpperCase()}</div>
              </div>
              <div style={{margin:"14px 0",padding:"16px",borderLeft:`3px solid ${G}`,background:"rgba(0,255,51,.02)"}}>
                <div style={{fontSize:10,color:"#0a5",letterSpacing:4,marginBottom:8}}>WHAT THIS MEANS FOR YOU</div>
                <div style={{fontSize:"clamp(15px,4vw,18px)",lineHeight:2,color:"#ddf2df"}}>{hexagram.explain}</div>
              </div>
              <div style={{margin:"12px 0",padding:"16px",borderLeft:`3px solid ${G}80`}}>
                <div style={{fontSize:10,color:"#0a5",letterSpacing:4,marginBottom:8}}>THE JUDGMENT</div>
                <div style={{fontSize:"clamp(15px,4vw,18px)",lineHeight:2,color:"#c8e8cb",fontStyle:"italic"}}>{hexagram.judge}</div>
              </div>
              <div style={{margin:"12px 0",padding:"16px",borderLeft:"3px solid #0a5"}}>
                <div style={{fontSize:10,color:"#0a5",letterSpacing:4,marginBottom:8}}>THE IMAGE</div>
                <div style={{fontSize:"clamp(14px,3.8vw,17px)",lineHeight:2,color:"#b0d4b3",fontStyle:"italic"}}>{hexagram.image}</div>
              </div>
              {hexLines.some(l=>l.changing)&&<div style={{margin:"12px 0",padding:"16px",borderLeft:`3px solid ${P}`}}>
                <div style={{fontSize:10,color:PD,letterSpacing:4,marginBottom:8}}>CHANGING LINES</div>
                {hexLines.map((l,i)=>l.changing?<div key={i} style={{fontSize:"clamp(13px,3.5vw,15px)",color:P,marginBottom:6,lineHeight:1.7}}>⚡ <strong>{lineLabels[i]} line</strong> ({l.yang?"Yang→Yin":"Yin→Yang"}) — Position {i+1} in transition.</div>:null)}
              </div>}
            </div>
            {relHex&&<div style={{border:`1px solid ${P}44`,borderRadius:2,padding:"20px 16px",background:"rgba(180,74,255,.02)",marginBottom:16}}>
              <div style={{textAlign:"center",marginBottom:12}}>
                <div style={{fontSize:9,color:PD,letterSpacing:6}}>RELATING HEXAGRAM</div>
                <div style={{fontSize:"clamp(28px,7vw,40px)",margin:"6px 0",color:P,textShadow:`0 0 12px ${P}`}}>{relHex.tri[0]}<br/>{relHex.tri[1]}</div>
                <div style={{fontSize:"clamp(16px,4vw,22px)",color:P,letterSpacing:".12em"}}>{relHex.n}. {relHex.name}</div>
                <div style={{fontSize:"clamp(11px,3vw,14px)",color:PD,letterSpacing:3,marginTop:4}}>{relHex.eng.toUpperCase()}</div>
              </div>
              <div style={{padding:"14px",borderLeft:`3px solid ${P}60`}}>
                <div style={{fontSize:10,color:PD,letterSpacing:4,marginBottom:8}}>WHERE THIS IS HEADING</div>
                <div style={{fontSize:"clamp(14px,3.8vw,17px)",lineHeight:2,color:"#dcc8ee"}}>{relHex.explain}</div>
              </div>
            </div>}
          </div>}

          {/* TAB 1: THC READING */}
          {activeTab===1&&tetragram&&<div style={{animation:"fadeIn .6s ease-out"}}>
            <div style={{border:`1px solid ${C}50`,borderRadius:2,padding:"20px 16px",background:"rgba(0,229,255,.02)",marginBottom:16}}>
              <div style={{textAlign:"center",marginBottom:14}}>
                <div style={{fontSize:9,color:C+"88",letterSpacing:6}}>THE CRYPTIC DIMENSION</div>
                <div style={{fontSize:"clamp(18px,5vw,26px)",letterSpacing:".12em",color:C,textShadow:`0 0 10px ${C}`,margin:"8px 0"}}>{tetragram.n}. {tetragram.name}</div>
                <div style={{fontSize:"clamp(13px,3.5vw,17px)",color:C+"aa",letterSpacing:3}}>{tetragram.eng.toUpperCase()}</div>
                <div style={{fontSize:10,color:C+"77",marginTop:6,letterSpacing:2}}>{tetragram.realm==="Heaven"?"T'IEN 天 — Tetragrams 1–27":tetragram.realm==="Man"?"JEN 人 — Tetragrams 28–54":"TI 地 — Tetragrams 55–81"}</div>
              </div>
              <div style={{margin:"14px 0",padding:"16px",borderLeft:`3px solid ${C}`}}>
                <div style={{fontSize:10,color:C+"88",letterSpacing:4,marginBottom:8}}>WHAT THIS MEANS FOR YOU</div>
                <div style={{fontSize:"clamp(15px,4vw,18px)",lineHeight:2,color:"#d0f4f8"}}>{tetragram.explain}</div>
              </div>
              <div style={{margin:"12px 0",padding:"16px",borderLeft:`3px solid ${C}60`}}>
                <div style={{fontSize:10,color:C+"88",letterSpacing:4,marginBottom:8}}>ABOUT THE {tetragram.realm.toUpperCase()} REALM</div>
                <div style={{fontSize:"clamp(13px,3.5vw,16px)",lineHeight:2,color:"#a0d8e0"}}>{tetragram.realm==="Heaven"?"The Heaven realm (1–27) represents creative, initiating cosmic forces. Energies are expansive and originating — you are close to the source.":tetragram.realm==="Man"?"The Man realm (28–54) represents the human sphere — where cosmic forces translate into lived experience. Choice, effort, connection.":"The Earth realm (55–81) represents receptive, completing forces. Patience, acceptance, and the strength found in yielding."}</div>
              </div>
            </div>
          </div>}

          {/* TAB 2: DECAGRAM SYNTHESIS */}
          {activeTab===2&&decagram&&<div style={{animation:"fadeIn .6s ease-out"}}>
            <div style={{border:`1px solid ${A}50`,borderRadius:2,padding:"20px 16px",background:"rgba(255,184,0,.02)",boxShadow:`0 0 20px ${A}06`,marginBottom:16}}>
              <div style={{textAlign:"center",marginBottom:14}}>
                <div style={{fontSize:9,color:A,letterSpacing:6}}>THE DECAGRAM SPEAKS</div>
                <div style={{fontSize:11,color:AD,letterSpacing:2,marginTop:4}}>What neither oracle can see alone</div>
              </div>

              {/* Active zones */}
              <div style={{margin:"14px 0",padding:"16px",borderLeft:`3px solid ${A}`}}>
                <div style={{fontSize:10,color:A,letterSpacing:4,marginBottom:10}}>NUMOGRAM ZONES</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {decagram.hotZones.map(z=>{
                    const col=z.intensity>=4?A:z.intensity>=3?A+"cc":z.intensity>=2?G:"#0c8";
                    const bg=z.intensity>=4?`${A}18`:z.intensity>=3?`${A}0c`:z.intensity>=2?"rgba(0,255,51,.06)":"rgba(0,255,51,.02)";
                    const isTC=[1,2,4,5,7,8].includes(z.zone);
                    return<div key={z.zone} style={{padding:"6px 8px",border:`1px solid ${z.intensity>=2?col+"60":col+"20"}`,borderRadius:2,background:bg,textAlign:"center",minWidth:54}}>
                      <div style={{fontSize:15,color:col,fontWeight:"bold"}}>{z.zone}</div>
                      <div style={{fontSize:7,color:col+"88",letterSpacing:1}}>{z.region}</div>
                      <div style={{fontSize:6,color:col+"55",marginTop:1}}>{"█".repeat(z.intensity)+"░".repeat(4-z.intensity)}</div>
                    </div>})}
                </div>
                <div style={{fontSize:9,color:"#0c8",marginTop:8,display:"flex",gap:12,flexWrap:"wrap"}}>
                  <span><span style={{color:G}}>█</span> Time-Circuit ({decagram.tcIntensity})</span>
                  <span><span style={{color:C}}>█</span> Warp ({decagram.warpIntensity})</span>
                  <span><span style={{color:C}}>█</span> Plex ({decagram.plexIntensity})</span>
                  <span>Dominant: <strong style={{color:A}}>{decagram.dominantSystem}</strong></span>
                </div>
              </div>

              {/* Active syzygies */}
              {decagram.activeSyzygies.length>0&&<div style={{margin:"12px 0",padding:"16px",borderLeft:`3px solid ${A}80`}}>
                <div style={{fontSize:10,color:A,letterSpacing:4,marginBottom:10}}>ENERGIZED SYZYGIES</div>
                {decagram.activeSyzygies.map((s,i)=><div key={i} style={{fontSize:"clamp(13px,3.5vw,15px)",color:A,marginBottom:6,lineHeight:1.7}}>⟐ <strong>{s.name}</strong> ({s.pair[0]}::{s.pair[1]}) — {s.current} Current → Zone {s.tractor}</div>)}
              </div>}

              {/* Primary demon */}
              {decagram.primaryDemon&&<div style={{margin:"12px 0",padding:"16px",borderLeft:`3px solid ${A}`}}>
                <div style={{fontSize:10,color:A,letterSpacing:4,marginBottom:10}}>THE DEMON AT THE JUNCTION</div>
                <div style={{fontSize:"clamp(18px,5vw,24px)",color:A,textShadow:`0 0 8px ${A}`,marginBottom:4}}>{decagram.primaryDemon.demon.name}</div>
                <div style={{fontSize:11,color:AD,letterSpacing:2}}>Mesh-{String(decagram.primaryDemon.demon.mesh).padStart(2,"0")} ⌁ {decagram.primaryDemon.demon.ns} ⌁ {decagram.primaryDemon.demon.type}</div>
                {decagram.primaryDemon.demon.pitch&&<div style={{fontSize:10,color:"#0c8",marginTop:6}}>Pitch: {decagram.primaryDemon.demon.pitch}</div>}
                {decagram.primaryDemon.demon.door&&<div style={{fontSize:10,color:"#0c8",marginTop:2}}>{decagram.primaryDemon.demon.door}{decagram.primaryDemon.demon.planet?` ⌁ ${decagram.primaryDemon.demon.planet}`:""}{decagram.primaryDemon.demon.spine?` ⌁ ${decagram.primaryDemon.demon.spine}`:""}</div>}
                {decagram.primaryDemon.demon.decaCard&&<div style={{fontSize:10,color:"#0c8",marginTop:2}}>Decadology: {decagram.primaryDemon.demon.decaCard==="Joker"?"Joker (Syzygetic)":decagram.primaryDemon.demon.decaCard}</div>}
                {decagram.primaryDemon.demon.gates&&<div style={{fontSize:10,color:"#0c8",marginTop:2}}>{decagram.primaryDemon.demon.gates}</div>}
                <div style={{fontSize:10,color:A,marginTop:8,padding:"6px 0",borderTop:`1px solid ${A}20`}}>Route: [{decagram.primaryDemon.rite.route}] → Pth-{decagram.primaryDemon.rite.path}: {decagram.primaryDemon.rite.pathName}</div>
                <div style={{fontSize:9,color:"#0c8",marginTop:2}}>Zone path: {decagram.primaryDemon.rite.route==="X"?"∞ (syzygy null-rite — time folds back on itself)":decagram.primaryDemon.rite.route.split("").join(" → ")}{decagram.primaryDemon.isSyzygetic?"":" ⌁ "+Math.round(decagram.primaryDemon.coverage*100)+"% zone coverage"}</div>
              </div>}

              {/* Book of Paths reading */}
              {decagram.primaryDemon?.rite.path&&PATHS[decagram.primaryDemon.rite.path]&&<div style={{margin:"12px 0",padding:"16px",borderLeft:`3px solid ${A}60`,background:"rgba(255,184,0,.015)"}}>
                <div style={{fontSize:10,color:A,letterSpacing:4,marginBottom:10}}>BOOK OF PATHS — PTH-{decagram.primaryDemon.rite.path}</div>
                <div style={{fontSize:"clamp(14px,3.8vw,17px)",color:A,marginBottom:8,textShadow:`0 0 4px ${A}44`}}>{PATHS[decagram.primaryDemon.rite.path].name}</div>
                {PATHS[decagram.primaryDemon.rite.path].text.map((line,i)=><div key={i} style={{fontSize:"clamp(14px,3.8vw,16px)",lineHeight:2,color:"#e8d4b0",marginBottom:2}}>{line}</div>)}
              </div>}

              {/* Synthesis */}
              <div style={{margin:"12px 0",padding:"16px",borderLeft:`3px solid ${A}40`}}>
                <div style={{fontSize:10,color:A,letterSpacing:4,marginBottom:10}}>SYNTHESIS</div>
                <div style={{fontSize:"clamp(14px,3.8vw,17px)",lineHeight:2,color:"#e0d0b0"}}>
                  The I Ching reveals the <strong style={{color:G}}>temporal flow</strong> — {hexagram?.eng} ({hexagram?.n}). The T'ai Hsüan Ching reveals the <strong style={{color:C}}>cryptic dimension</strong> — {tetragram?.eng} ({tetragram?.n}, {tetragram?.realm} realm).
                  {" "}The dominant time-system is the <strong style={{color:A}}>{decagram.dominantSystem}</strong>
                  {decagram.dominantSystem==="Time-Circuit"?" — your situation is primarily governed by sequential, temporal forces. The I Ching reading carries the greater weight."
                    :decagram.dominantSystem==="Warp"?" — forces outside normal time are dominant. The alien patterns of the Warp (zones 3,6) are shaping your situation from beyond the visible flow."
                    :" — the abysmal depths of the Plex (zones 0,9) are active. Your situation is being shaped by forces at the absolute boundaries — origin and terminus, void and return."}
                  {decagram.crossResonance&&<><br/><br/><strong style={{color:A}}>Cross-system resonance detected.</strong> Both the Time-Circuit and the Outer zones are strongly activated. This is rare — it means the temporal flow and the cryptic dimension are in direct communication. The full Numogram is speaking. The path identified below carries exceptional significance.</>}
                  {decagram.activeSyzygies.length>0&&<><br/><br/>{decagram.activeSyzygies.length} syzyg{decagram.activeSyzygies.length>1?"ies are":"y is"} energized: {decagram.activeSyzygies.map(s=>s.name).join(", ")}. These are the junction-points where the dual oracle's readings converge — where the manifest and the hidden meet.</>}
                  {decagram.primaryDemon&&<><br/><br/>The demon <strong style={{color:A}}>{decagram.primaryDemon.demon.name}</strong> ({decagram.primaryDemon.demon.ns}) traces the path of <em>{decagram.primaryDemon.rite.pathName}</em> through the activated zones{decagram.primaryDemon.isSyzygetic?" — a syzygetic null-rite, the most potent form of path where time folds back on itself":""}.  This is the route the complete Numogram reveals for your question.</>}
                </div>
              </div>

              <div style={{margin:"8px 0 0",padding:"10px 14px",background:"rgba(255,184,0,.01)",borderRadius:2}}>
                <div style={{fontSize:9,color:AD,letterSpacing:2,lineHeight:1.8}}>Sources: I Ching (Wilhelm-Baynes), T'ai Hsüan Ching (Nylan, <em>The Elemental Changes</em>, SUNY 1993), CCRU Decimal Labyrinth (ccru.net/declab.htm), Book of Paths (Horowitz trans., Vysparov Library), Pandemonium Matrix (ccru.net/digithype/pandemonium.htm)</div>
              </div>
            </div>
          </div>}

          {/* Action buttons */}
          <div style={{textAlign:"center",marginTop:20}}>
            <button onClick={()=>{reset();setPhase("question")}} style={{padding:"12px 32px",background:"transparent",border:`1px solid ${A}`,color:A,fontFamily:"monospace",fontSize:11,letterSpacing:5,cursor:"pointer",borderRadius:2,boxShadow:`0 0 12px ${A}18`}}>NEW CONSULTATION</button>
            <button onClick={reset} style={{padding:"12px 20px",background:"transparent",border:"1px solid #44444440",color:"#0c8",fontFamily:"monospace",fontSize:10,letterSpacing:3,cursor:"pointer",borderRadius:2,marginLeft:10}}>RETURN</button>
          </div>
          </>}
        </div>}

        <footer style={{textAlign:"center",padding:"32px 0 16px",borderTop:"1px solid #0f320",marginTop:32}}>
          <div style={{fontSize:8,color:"#0c8",letterSpacing:4,lineHeight:2.2}}>DECAGRAM 十線圖 ⌁ DUAL ORACLE ENGINE<br/>I CHING + T'AI HSÜAN CHING + NUMOGRAM<br/>BOOK OF PATHS ⌁ PANDEMONIUM MATRIX</div>
        </footer>
      </div>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes lineReveal{from{opacity:0;transform:scaleX(0)}to{opacity:1;transform:scaleX(1)}}
        @keyframes pulseGlow{0%,100%{text-shadow:0 0 16px ${G},0 0 32px ${G}66}50%{text-shadow:0 0 24px ${G},0 0 48px ${G}88}}
        *{box-sizing:border-box}body{margin:0;background:#000}
        textarea::placeholder{color:${G}30}button:hover{opacity:.85}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#000}::-webkit-scrollbar-thumb{background:${G}30}
      `}</style>
    </div>
  );
}
