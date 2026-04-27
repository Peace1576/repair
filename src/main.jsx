import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity, Aperture, AudioLines, Bot, BrainCircuit,
  Captions, CheckCircle2, ChevronDown, Clapperboard,
  Clock3, Copy, Download, Film, Image, Layers3,
  ListVideo, Lock, Unlock, MapPin, Mic2, MonitorPlay,
  MousePointer2, Music2, Pause, Play, Plus, Ratio,
  RotateCcw, Save, Scissors, Search, Settings2, Share2,
  Sparkles, SplitSquareHorizontal,
  Square, Stars, Subtitles, TextCursorInput, Trash2,
  Type, Undo2, Redo2, Upload, Volume2, VolumeX,
  WandSparkles, X, Zap, ZoomIn, ZoomOut, Wind, Move
} from "lucide-react";
import { isSupabaseConfigured } from "./lib/supabase";
import "./styles.css";

const STORAGE_KEY = "rovik-studio-v3";

const PRESET_MAP = {
  "YouTube 16:9":  { ratio: "16 / 9",   label: "16:9",   width: 1920, height: 1080 },
  "TikTok 9:16":   { ratio: "9 / 16",   label: "9:16",   width: 1080, height: 1920 },
  "Shorts 9:16":   { ratio: "9 / 16",   label: "9:16",   width: 1080, height: 1920 },
  "Stream 16:9":   { ratio: "16 / 9",   label: "16:9",   width: 1920, height: 1080 },
  "Square 1:1":    { ratio: "1 / 1",    label: "1:1",    width: 1080, height: 1080 },
  "Instagram 4:5": { ratio: "4 / 5",    label: "4:5",    width: 1080, height: 1350 },
  "Cinema 2.35:1": { ratio: "2.35 / 1", label: "2.35:1", width: 2560, height: 1090 },
};

const TRACK_DEFS = [
  { id: "V2",       name: "V2",       type: "video",   color: "#9d8cff", compact: false },
  { id: "V1",       name: "V1",       type: "video",   color: "#45d7ff", compact: false },
  { id: "A1",       name: "A1",       type: "audio",   color: "#ff6b9d", compact: true  },
  { id: "A2",       name: "A2",       type: "audio",   color: "#ff8c42", compact: true  },
  { id: "Music",    name: "Music",    type: "audio",   color: "#f4b860", compact: true  },
  { id: "Captions", name: "Captions", type: "caption", color: "#a3ff8f", compact: true  },
];

const TRANSITION_TYPES = ["None","Fade","Dip to Black","Cross Dissolve","Wipe Left","Slide Up"];
const FONT_FAMILIES    = ["System","Arial","Georgia","Impact","Helvetica Neue","Courier New"];
const FONT_WEIGHTS     = ["400","600","700","800","900"];
const TEXT_ANIMATIONS  = ["None","Fade In","Slide Up","Zoom In","Typewriter","Glow"];
const BLEND_MODES      = ["Normal","Multiply","Screen","Overlay","Soft Light","Color Dodge"];

const AI_ACTIONS = [
  "Find viral hook","Remove silence","Generate captions",
  "Make 10 clips","Clean audio","Brand kit",
  "Auto color grade","Detect beats","Scene detect",
];

const FILTER_PRESETS = {
  "Clean":    { exposure:  0,contrast:  5,saturation:  5,warmth:  0,highlights: -5,shadows:  5,whites:  0,blacks:  0,vibrance:  8,sharpness: 10,blur:0,vignette:  0,grain:0,glow:0,tint:0 },
  "Cinematic":{ exposure: -5,contrast: 25,saturation:-10,warmth: -8,highlights:-20,shadows: 15,whites:-10,blacks:  5,vibrance: -5,sharpness:  8,blur:0,vignette: 20,grain:5,glow:0,tint:0 },
  "Vivid":    { exposure:  5,contrast: 15,saturation: 30,warmth:  5,highlights: 10,shadows:  0,whites:  5,blacks: -5,vibrance: 25,sharpness: 15,blur:0,vignette:  5,grain:0,glow:3,tint:0 },
  "Warm":     { exposure:  5,contrast: 10,saturation: 10,warmth: 25,highlights:  0,shadows:  8,whites:  5,blacks: -2,vibrance: 10,sharpness:  5,blur:0,vignette: 10,grain:3,glow:0,tint:0 },
  "Mono":     { exposure:  0,contrast: 20,saturation:-100,warmth: 0,highlights:  5,shadows: 10,whites:  0,blacks: -5,vibrance:-100,sharpness:15,blur:0,vignette: 15,grain:8,glow:0,tint:0 },
  "Bleach":   { exposure:  8,contrast:-15,saturation:-20,warmth: 10,highlights: 20,shadows: 20,whites: 10,blacks: 10,vibrance:-15,sharpness:  0,blur:0,vignette:  0,grain:10,glow:0,tint:0},
  "Teal+Org": { exposure:  0,contrast: 20,saturation: 15,warmth: 20,highlights:-10,shadows:-20,whites:  0,blacks:-10,vibrance: 20,sharpness: 10,blur:0,vignette: 15,grain:5,glow:0,tint:0 },
  "Summer":   { exposure: 10,contrast:  5,saturation: 20,warmth: 30,highlights:  5,shadows:  0,whites: 10,blacks: -5,vibrance: 30,sharpness:  5,blur:0,vignette:  5,grain:0,glow:5,tint:0 },
};

const DEFAULT_FILTERS = {
  exposure:0,contrast:0,warmth:0,saturation:0,vibrance:0,
  highlights:0,shadows:0,whites:0,blacks:0,
  sharpness:0,blur:0,vignette:0,grain:0,glow:0,tint:0,
};

const DEFAULT_TRACK_STATE = {
  V2:       { volume:100,pan:0,muted:false,solo:false,locked:false },
  V1:       { volume:100,pan:0,muted:false,solo:false,locked:false },
  A1:       { volume: 85,pan:0,muted:false,solo:false,locked:false },
  A2:       { volume: 85,pan:0,muted:false,solo:false,locked:false },
  Music:    { volume: 65,pan:0,muted:false,solo:false,locked:false },
  Captions: { volume:100,pan:0,muted:false,solo:false,locked:false },
};

const demoAssets = [
  { id:"demo-video",   title:"Cold open",    meta:"Demo video layer", type:"video",  accent:"cyan",   src:"",                                                                                                      duration:13 },
  { id:"demo-image",   title:"Product shot", meta:"Editable image",   type:"image",  accent:"lime",   src:"https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85",         duration:8  },
  { id:"demo-audio",   title:"Voiceover",    meta:"Audio track",      type:"audio",  accent:"rose",   src:"",                                                                                                      duration:20 },
  { id:"demo-caption", title:"Hook captions",meta:"Auto styled text", type:"text",   accent:"amber",  src:"",                                                                                                      duration:6  },
  { id:"demo-music",   title:"BG Music",     meta:"Background music", type:"audio",  accent:"violet", src:"",                                                                                                      duration:30 },
];

function makeClip(id, assetId, label, track, start, duration, color) {
  return { id, assetId, label, track, start, duration, color, opacity:100, speed:1, transitionIn:"None", transitionOut:"None", transitionDuration:0.5, blendMode:"Normal", fx:[] };
}

const starterProject = {
  name:"Untitled Project",
  preset:"TikTok 9:16",
  caption:"POV: your editor finds the viral moment first",
  filters:{ ...DEFAULT_FILTERS },
  trackState:{ ...DEFAULT_TRACK_STATE },
  masterVolume:100,
  eq:{ low:0,mid:0,high:0 },
  overlays:[
    { id:"ov-title",type:"text", text:"VIRAL MOMENT",x:50,y:15,size:10,color:"#ffffff",background:"rgba(7,9,13,0.58)",fontFamily:"System",fontWeight:"900",textAlign:"center",animation:"None" },
    { id:"ov-tag",  type:"badge",text:"Subscribe",   x:12,y:86,size:4, color:"#071016",background:"#a3ff8f",           fontFamily:"System",fontWeight:"800",textAlign:"center",animation:"None" },
  ],
  exportSettings:{ format:"MP4 H.264",quality:"High",fps:30,audio:"AAC 320kbps",resolution:"1080p",bitrate:"8000" },
  markers:[
    { id:"m1",time:2,label:"Hook",  color:"#a3ff8f" },
    { id:"m2",time:8,label:"Payoff",color:"#f4b860" },
  ],
  assets:demoAssets,
  timeline:[
    makeClip("c1","demo-image",  "Hook",    "V1",      0, 8, "#45d7ff"),
    makeClip("c2","demo-caption","Captions","Captions",0, 6, "#a3ff8f"),
    makeClip("c3","demo-audio",  "Voice",   "A1",      0,20, "#ff6b9d"),
    makeClip("c4","demo-music",  "BG Music","Music",   0,30, "#9d8cff"),
  ],
  notes:[
    "Rovik Studio — professional multi-track editor.",
    "V1/V2 for video layers · A1/A2/Music for audio · Captions track for text.",
    "Color workspace: full Lumetri grading. Audio workspace: per-track mixer.",
  ],
};
starterProject.timeline[0].transitionIn  = "Fade";
starterProject.timeline[3].transitionIn  = "Fade";
starterProject.timeline[3].transitionOut = "Fade";
starterProject.timeline[3].transitionDuration = 1;

function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return starterProject;
    const saved = JSON.parse(raw);
    return {
      ...starterProject, ...saved,
      filters:        { ...DEFAULT_FILTERS,             ...(saved.filters        || {}) },
      trackState:     { ...DEFAULT_TRACK_STATE,         ...(saved.trackState     || {}) },
      overlays:       saved.overlays?.length     ? saved.overlays     : starterProject.overlays,
      exportSettings: { ...starterProject.exportSettings, ...(saved.exportSettings || {}) },
      assets:         saved.assets?.length       ? saved.assets       : starterProject.assets,
      timeline:       saved.timeline?.length     ? saved.timeline     : starterProject.timeline,
      markers:        saved.markers?.length      ? saved.markers      : starterProject.markers,
      notes:          saved.notes?.length        ? saved.notes        : starterProject.notes,
      eq:             { ...starterProject.eq,    ...(saved.eq         || {}) },
    };
  } catch { return starterProject; }
}

function buildFilterStyle(f) {
  const brightness = (1+(f.exposure/100)*0.8)*(1+(f.whites/200)*0.3)*(1+(f.shadows/300)*0.35);
  const contrast   = 1+(f.contrast/100)*1.2;
  const saturation = Math.max(0,1+(f.saturation/100)*1.5+(f.vibrance/200)*0.8);
  const hueShift   = -(f.warmth/100)*12;
  const sepia      = Math.max(0,(f.warmth/100)*0.25);
  const blurVal    = f.blur>0 ? `blur(${(f.blur*0.12).toFixed(1)}px)` : "";
  const parts = [
    `brightness(${brightness.toFixed(3)})`,
    `contrast(${contrast.toFixed(3)})`,
    `saturate(${saturation.toFixed(3)})`,
    sepia>0.001  ? `sepia(${sepia.toFixed(3)})`             : "",
    hueShift!==0 ? `hue-rotate(${hueShift.toFixed(1)}deg)`  : "",
    blurVal,
  ].filter(Boolean).join(" ");
  return { filter: parts };
}

/* ═══════════════════════════════════════════════════════════════ APP */
function App() {
  const fileInputRef  = useRef(null);
  const videoRef      = useRef(null);
  const imageRef      = useRef(null);
  const canvasRef     = useRef(null);
  const objectUrlsRef = useRef([]);

  const [project,          setProject]          = useState(loadProject);
  const [history,          setHistory]          = useState([]);
  const [future,           setFuture]           = useState([]);
  const [selectedAssetId,  setSelectedAssetId]  = useState(project.assets[1]?.id);
  const [selectedClipId,   setSelectedClipId]   = useState(project.timeline[0]?.id);
  const [selectedOverlayId,setSelectedOverlayId]= useState(project.overlays[0]?.id);
  const [activeTool,       setActiveTool]       = useState("Select");
  const [workspaceMode,    setWorkspaceMode]     = useState("Edit");
  const [activeView,       setActiveView]        = useState("Preview");
  const [isPlaying,        setIsPlaying]         = useState(false);
  const [playhead,         setPlayhead]          = useState(0);
  const [query,            setQuery]             = useState("");
  const [toast,            setToast]             = useState("Rovik Studio ready");
  const [timelineZoom,     setTimelineZoom]      = useState(1);
  const [snapEnabled,      setSnapEnabled]       = useState(true);
  const [showShortcuts,    setShowShortcuts]     = useState(false);
  const [libraryTab,       setLibraryTab]        = useState("media");
  const [scopesVisible,    setScopesVisible]     = useState(false);

  const selectedAsset   = useMemo(() => project.assets.find(a=>a.id===selectedAssetId)||project.assets[0], [project.assets,selectedAssetId]);
  const selectedClip    = useMemo(() => project.timeline.find(c=>c.id===selectedClipId),                   [project.timeline,selectedClipId]);
  const selectedOverlay = useMemo(() => project.overlays.find(o=>o.id===selectedOverlayId),                [project.overlays,selectedOverlayId]);
  const filteredAssets  = useMemo(() => {
    const q=query.trim().toLowerCase();
    return q ? project.assets.filter(a=>`${a.title} ${a.meta} ${a.type}`.toLowerCase().includes(q)) : project.assets;
  },[project.assets,query]);
  const preset       = PRESET_MAP[project.preset]||PRESET_MAP["TikTok 9:16"];
  const duration     = Math.max(30,...project.timeline.map(c=>c.start+c.duration));
  const activeClip   = useMemo(()=>project.timeline.find(c=>c.track==="V1"&&playhead>=c.start&&playhead<c.start+c.duration),[project.timeline,playhead]);
  const previewAsset = useMemo(()=>project.assets.find(a=>a.id===activeClip?.assetId)||selectedAsset,[activeClip,project.assets,selectedAsset]);
  const filterStyle  = useMemo(()=>buildFilterStyle(project.filters),[project.filters]);

  useEffect(()=>{
    const t=window.setTimeout(()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(project));setToast("Autosaved");},800);
    return()=>window.clearTimeout(t);
  },[project]);

  useEffect(()=>{
    if(!isPlaying)return;
    const t=window.setInterval(()=>{setPlayhead(cur=>{const n=cur+0.1;return n>=duration?0:Number(n.toFixed(1));});},100);
    return()=>window.clearInterval(t);
  },[duration,isPlaying]);

  useEffect(()=>{
    function onKey(e){
      if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
      if(e.key==="?"||( e.key==="/"&&e.shiftKey)){setShowShortcuts(v=>!v);return;}
      if((e.ctrlKey||e.metaKey)&&e.key==="z"){e.preventDefault();undo();return;}
      if((e.ctrlKey||e.metaKey)&&e.key==="y"){e.preventDefault();redo();return;}
      if((e.ctrlKey||e.metaKey)&&e.key==="s"){e.preventDefault();saveProject();return;}
      if(e.code==="Space"){e.preventDefault();togglePlayback();return;}
      if(e.key==="s"){splitSelectedClip();return;}
      if(e.key==="m"){addMarker();return;}
      if(e.key==="+"||e.key==="="){setTimelineZoom(z=>Math.min(8,+(z+0.5).toFixed(1)));return;}
      if(e.key==="-"){setTimelineZoom(z=>Math.max(0.25,+(z-0.5).toFixed(1)));return;}
      if((e.key==="Delete"||e.key==="Backspace")&&selectedClipId)removeClip(selectedClipId);
    }
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  });
  useEffect(()=>()=>objectUrlsRef.current.forEach(u=>URL.revokeObjectURL(u)),[]);

  function commitProject(recipe,msg="Updated"){
    setProject(cur=>{
      const next=typeof recipe==="function"?recipe(cur):{...cur,...recipe};
      setHistory(h=>[...h.slice(-24),cur]);setFuture([]);setToast(msg);return next;
    });
  }
  function updateProject(patch){commitProject(patch);}
  function updateFilters(key,value){commitProject(cur=>({...cur,filters:{...cur.filters,[key]:Number(value)}}),"Color adjusted");}
  function updateTrackState(trackId,patch){commitProject(cur=>({...cur,trackState:{...cur.trackState,[trackId]:{...cur.trackState[trackId],...patch}}}),"Track updated");}

  function handleImport(e){
    const files=Array.from(e.target.files||[]);if(!files.length)return;
    const next=files.map(f=>{
      const type=f.type.startsWith("image/")?"image":f.type.startsWith("audio/")?"audio":f.type.startsWith("video/")?"video":"file";
      return{id:`${Date.now()}-${f.name}`,title:f.name.replace(/\.[^.]+$/,""),meta:`${type.toUpperCase()} · ${formatBytes(f.size)}`,type,accent:type==="image"?"lime":type==="audio"?"rose":"cyan",src:URL.createObjectURL(f),duration:type==="image"?6:12};
    });
    objectUrlsRef.current.push(...next.map(a=>a.src).filter(Boolean));
    commitProject(cur=>({...cur,assets:[...next,...cur.assets]}),`Imported ${next.length} file(s)`);
    setSelectedAssetId(next[0].id);e.target.value="";
  }

  function trackForAsset(asset){return asset.type==="audio"?"A1":asset.type==="text"?"Captions":"V1";}
  function colorForTrack(track){return track.startsWith("A")||track==="Music"?"#ff6b9d":track==="Captions"?"#a3ff8f":"#45d7ff";}

  function addToTimeline(asset=selectedAsset){
    if(!asset)return;
    const track=trackForAsset(asset);
    const start=Math.max(0,...project.timeline.filter(c=>c.track===track).map(c=>c.start+c.duration));
    const clip={...makeClip(`clip-${Date.now()}`,asset.id,asset.title.slice(0,18),track,start,asset.duration||8,colorForTrack(track))};
    commitProject(cur=>({...cur,timeline:[...cur.timeline,clip]}),`Added to ${track}`);setSelectedClipId(clip.id);
  }

  function addAssetToTimelineAt(assetId,track,start){
    const asset=project.assets.find(a=>a.id===assetId);if(!asset)return;
    const t=track||(trackForAsset(asset));
    const clip={...makeClip(`clip-${Date.now()}`,asset.id,asset.title.slice(0,18),t,Math.max(0,Number(start.toFixed(1))),asset.duration||8,colorForTrack(t))};
    commitProject(cur=>({...cur,timeline:[...cur.timeline,clip]}),`Dropped on ${t}`);setSelectedClipId(clip.id);setSelectedAssetId(asset.id);
  }

  function removeClip(id){commitProject(cur=>({...cur,timeline:cur.timeline.filter(c=>c.id!==id)}),"Clip removed");if(selectedClipId===id)setSelectedClipId(undefined);}
  function updateClip(id,patch){commitProject(cur=>({...cur,timeline:cur.timeline.map(c=>c.id===id?{...c,...patch}:c)}),"Clip updated");}
  function moveClipTo(id,track,start){commitProject(cur=>({...cur,timeline:cur.timeline.map(c=>c.id===id?{...c,track,start:Math.max(0,Number(start.toFixed(1)))}:c)}),"Clip moved");setSelectedClipId(id);}

  function addOverlay(type="text"){
    const ov={id:`ov-${Date.now()}`,type,text:type==="badge"?"NEW":"Add your text",x:50,y:type==="badge"?84:50,size:type==="badge"?4:7,color:type==="shape"?"#45d7ff":"#ffffff",background:type==="shape"?"rgba(69,215,255,0.36)":"rgba(7,9,13,0.62)",fontFamily:"System",fontWeight:"900",textAlign:"center",animation:"None"};
    commitProject(cur=>({...cur,overlays:[...cur.overlays,ov]}),"Overlay added");setSelectedOverlayId(ov.id);
  }
  function updateOverlay(id,patch){commitProject(cur=>({...cur,overlays:cur.overlays.map(o=>o.id===id?{...o,...patch}:o)}),"Overlay updated");}
  function removeOverlay(id){commitProject(cur=>({...cur,overlays:cur.overlays.filter(o=>o.id!==id)}),"Overlay removed");if(selectedOverlayId===id)setSelectedOverlayId(undefined);}

  function applyFilterPreset(name){const p=FILTER_PRESETS[name];if(p)commitProject(cur=>({...cur,filters:{...DEFAULT_FILTERS,...p}}),`${name} applied`);}

  function splitSelectedClip(){
    if(!selectedClip||selectedClip.duration<=1)return;
    const rel=playhead>selectedClip.start&&playhead<selectedClip.start+selectedClip.duration?playhead-selectedClip.start:selectedClip.duration/2;
    const first=Math.max(0.5,Number(rel.toFixed(1)));const second=Math.max(0.5,Number((selectedClip.duration-first).toFixed(1)));
    const nc={...selectedClip,id:`clip-${Date.now()}`,label:`${selectedClip.label} B`,start:Number((selectedClip.start+first).toFixed(1)),duration:second};
    commitProject(cur=>({...cur,timeline:[...cur.timeline.map(c=>c.id===selectedClip.id?{...c,label:`${c.label} A`,duration:first}:c),nc]}),"Clip split");setSelectedClipId(nc.id);
  }
  function duplicateSelectedClip(){if(!selectedClip)return;const copy={...selectedClip,id:`clip-${Date.now()}`,label:`${selectedClip.label} copy`,start:Number((selectedClip.start+selectedClip.duration).toFixed(1))};commitProject(cur=>({...cur,timeline:[...cur.timeline,copy]}),"Duplicated");setSelectedClipId(copy.id);}
  function rippleDeleteSelectedClip(){if(!selectedClip)return;const{start,duration:dur,track}=selectedClip;commitProject(cur=>({...cur,timeline:cur.timeline.filter(c=>c.id!==selectedClip.id).map(c=>c.track===track&&c.start>start?{...c,start:Math.max(0,Number((c.start-dur).toFixed(1)))}:c)}),"Ripple deleted");setSelectedClipId(undefined);}
  function nudgeSelectedClip(amount){if(!selectedClip)return;updateClip(selectedClip.id,{start:Math.max(0,Number((selectedClip.start+amount).toFixed(1)))});}
  function addMarker(){const m={id:`m-${Date.now()}`,time:Number(playhead.toFixed(1)),label:`M${project.markers.length+1}`,color:"#f4b860"};commitProject(cur=>({...cur,markers:[...cur.markers,m]}),"Marker added");}
  function removeMarker(id){commitProject(cur=>({...cur,markers:cur.markers.filter(m=>m.id!==id)}),"Marker removed");}
  function updateExportSetting(key,value){commitProject(cur=>({...cur,exportSettings:{...cur.exportSettings,[key]:value}}),"Export updated");}

  function undo(){setHistory(items=>{if(!items.length)return items;const prev=items[items.length-1];setFuture(f=>[project,...f.slice(0,24)]);setProject(prev);setToast("Undo");return items.slice(0,-1);});}
  function redo(){setFuture(items=>{if(!items.length)return items;const next=items[0];setHistory(h=>[...h.slice(-24),project]);setProject(next);setToast("Redo");return items.slice(1);});}

  function applyAiAction(action){
    switch(action){
      case"Generate captions":{
        const lines=["Stop scrolling — watch this","The reveal you didn't expect","Cut the dead air","End strong"];
        const asset={id:`asset-cap-${Date.now()}`,title:"AI Captions",meta:`${lines.length} beats`,type:"text",accent:"amber",src:"",duration:12};
        const clips=lines.map((ln,i)=>({...makeClip(`cap-${Date.now()}-${i}`,asset.id,ln,"Captions",i*3,3,"#a3ff8f"),transitionIn:"Fade"}));
        commitProject(cur=>({...cur,caption:lines[0],assets:[asset,...cur.assets],timeline:[...cur.timeline.filter(c=>c.track!=="Captions"),...clips],notes:["AI captions generated.",...cur.notes.slice(0,4)]}),"Captions generated");break;
      }
      case"Auto color grade":applyFilterPreset("Cinematic");break;
      case"Find viral hook":commitProject(cur=>({...cur,notes:["Strongest hook: 00:02–00:08.",...cur.notes.slice(0,4)]}),"Hook found");break;
      case"Remove silence":commitProject(cur=>({...cur,timeline:cur.timeline.map(c=>c.track==="A1"||c.track==="A2"?{...c,duration:Math.max(4,c.duration-3)}:c),notes:["Silence trimmed.",...cur.notes.slice(0,4)]}),"Silence removed");break;
      case"Make 10 clips":{const src=selectedAsset||project.assets.find(a=>a.type!=="audio");if(src){const clips=Array.from({length:10},(_,i)=>({...makeClip(`ai-${Date.now()}-${i}`,src.id,`Short ${i+1}`,"V1",i*3,3,i%2?"#9d8cff":"#45d7ff")}));commitProject(cur=>({...cur,timeline:[...cur.timeline,...clips]}),"10 clips created");}break;}
      case"Clean audio":commitProject(cur=>({...cur,notes:["Noise reduction + EQ + normalization queued.",...cur.notes.slice(0,4)]}),"Audio cleaned");break;
      case"Brand kit":applyFilterPreset("Teal+Org");break;
      case"Detect beats":commitProject(cur=>({...cur,markers:[...cur.markers,...Array.from({length:8},(_,i)=>({id:`beat-${Date.now()}-${i}`,time:i*2.5+1,label:"Beat",color:"#9d8cff"}))]}),"Beats detected");break;
      case"Scene detect":commitProject(cur=>({...cur,notes:["3 scene cuts detected at 00:04, 00:09, 00:15.",...cur.notes.slice(0,4)]}),"Scenes detected");break;
      default:break;
    }
  }

  function togglePlayback(){const media=videoRef.current;if(media){if(media.paused){media.play();setIsPlaying(true);}else{media.pause();setIsPlaying(false);}return;}setIsPlaying(v=>!v);}
  function saveProject(){localStorage.setItem(STORAGE_KEY,JSON.stringify(project));setToast("Project saved");}
  function exportManifest(){const b=new Blob([JSON.stringify({...project,exportedAt:new Date().toISOString(),preset},null,2)],{type:"application/json"});downloadBlob(b,`${slug(project.name)}-project.json`);setToast("Manifest exported");}

  function exportFrame(){
    const canvas=canvasRef.current;const ctx=canvas?.getContext("2d");if(!canvas||!ctx)return;
    canvas.width=preset.width;canvas.height=preset.height;ctx.fillStyle="#07090d";ctx.fillRect(0,0,canvas.width,canvas.height);
    const img=imageRef.current;
    if(previewAsset?.type==="image"&&img?.complete)drawCover(ctx,img,canvas.width,canvas.height);else drawCompositionFrame(ctx,canvas,project,preset,playhead);
    drawCaption(ctx,canvas,project.caption);canvas.toBlob(blob=>{if(blob)downloadBlob(blob,`${slug(project.name)}-frame.png`);});setToast("Frame exported");
  }

  async function exportVideoPreview(){
    const canvas=canvasRef.current;const ctx=canvas?.getContext("2d");
    if(!canvas||!ctx||typeof MediaRecorder==="undefined"){setToast("Video export not supported");return;}
    canvas.width=Math.min(1280,preset.width);canvas.height=Math.round(canvas.width*(preset.height/preset.width));
    const stream=canvas.captureStream(project.exportSettings.fps);const chunks=[];
    const mimeType=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm";
    const recorder=new MediaRecorder(stream,{mimeType});
    recorder.ondataavailable=e=>e.data.size&&chunks.push(e.data);
    recorder.onstop=()=>{downloadBlob(new Blob(chunks,{type:"video/webm"}),`${slug(project.name)}-preview.webm`);setToast("Preview exported");};
    recorder.start();setToast("Rendering…");
    const len=Math.min(10,duration);const started=performance.now();
    await new Promise(resolve=>{function frame(now){const s=((now-started)/1000)%len;drawCompositionFrame(ctx,canvas,project,preset,s);drawCaption(ctx,canvas,project.caption);if((now-started)/1000<len)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
    recorder.stop();
  }

  const frameClass=preset.label==="16:9"||preset.label==="2.35:1"?"is-landscape":preset.label==="1:1"?"is-square":"is-vertical";

  return (
    <main className="app-shell">
      {/* RAIL */}
      <aside className="rail">
        <div className="brand-mark">R</div>
        {[[MousePointer2,"Select"],[Scissors,"Cut"],[Captions,"Captions"],[WandSparkles,"AI"],[Aperture,"Color"],[Music2,"Audio"],[Type,"Text"],[Settings2,"Settings"]].map(([Icon,label])=>(
          <IconButton key={label} icon={Icon} label={label} active={activeTool===label} onClick={()=>{setActiveTool(label);if(label==="Color")setWorkspaceMode("Color");if(label==="Audio")setWorkspaceMode("Audio");}} />
        ))}
        <div style={{flex:1}}/>
        <IconButton icon={Zap} label="Shortcuts (?)" active={false} onClick={()=>setShowShortcuts(true)} />
      </aside>

      {/* WORKSPACE */}
      <section className="workspace">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-brand">
            <p className="eyebrow">Rovik Studio</p>
            <input className="project-title" value={project.name} onChange={e=>updateProject({name:e.target.value})} aria-label="Project name" />
          </div>
          <div className="topbar-actions">
            <label className="search-button"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search media, effects, templates…"/></label>
            <button className="ghost-button" onClick={undo}  disabled={!history.length} title="Undo Ctrl+Z"><Undo2  size={15}/></button>
            <button className="ghost-button" onClick={redo}  disabled={!future.length}  title="Redo Ctrl+Y"><Redo2  size={15}/></button>
            <button className="ghost-button" onClick={saveProject}><Save size={15}/> Save</button>
            <button className="ghost-button" onClick={exportManifest}><Share2 size={15}/> Share</button>
            <button className="primary-button" onClick={exportFrame}><Download size={15}/> Export</button>
          </div>
        </header>

        {/* WORKSPACE TABS */}
        <nav className="workspace-tabs">
          {["Edit","Color","Audio","Captions","Export"].map(ws=>(
            <button key={ws} className={workspaceMode===ws?"active":""} onClick={()=>setWorkspaceMode(ws)}>{ws}</button>
          ))}
          <span className="ws-hint"><ListVideo size={12}/> Space · S split · M marker · +/- zoom · ? shortcuts</span>
        </nav>

        {/* EDITOR GRID */}
        <section className="editor-grid">

          {/* LIBRARY PANEL */}
          <aside className="library-panel">
            <div className="panel-header">
              <div><p className="eyebrow">Project</p><h2>{project.assets.length} assets</h2></div>
              <button className="small-button" onClick={()=>fileInputRef.current?.click()}><Upload size={13}/> Import</button>
              <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*,video/*,audio/*" multiple onChange={handleImport}/>
            </div>

            <div className="lib-tabs">
              {[["media","Media"],["effects","FX"],["transitions","Trans."],["audio","Audio FX"]].map(([id,label])=>(
                <button key={id} className={libraryTab===id?"active":""} onClick={()=>setLibraryTab(id)}>{label}</button>
              ))}
            </div>

            {libraryTab==="media"&&(<>
              <div className="preset-row">{Object.keys(PRESET_MAP).map(p=><button key={p} className={project.preset===p?"chip active":"chip"} onClick={()=>updateProject({preset:p})}>{p}</button>)}</div>
              <div className="media-list">{filteredAssets.map(asset=>(
                <article className={`asset-card ${asset.id===selectedAssetId?"selected":""}`} key={asset.id} draggable onDragStart={e=>{e.dataTransfer.setData("asset-id",asset.id);e.dataTransfer.effectAllowed="copy";}} onClick={()=>setSelectedAssetId(asset.id)}>
                  <div className={`asset-thumb ${asset.accent}`}><AssetIcon type={asset.type}/></div>
                  <div><h3>{asset.title}</h3><p>{asset.meta}</p></div>
                  <button title={`Add ${asset.title}`} onClick={ev=>{ev.stopPropagation();addToTimeline(asset);}}><Plus size={13}/></button>
                </article>
              ))}</div>
            </>)}

            {libraryTab==="effects"&&(
              <div className="fx-catalog">
                <p className="eyebrow fx-head">Video Effects</p>
                {[["Gaussian Blur","blur"],["Sharpen","sharp"],["Vignette","vig"],["Glow / Bloom","glow"],["Film Grain","grain"],["Color Grade","lut"],["Lens Flare","lens"],["Chromatic Ab.","ca"]].map(([name,id])=>(
                  <div key={id} className="fx-item"><Aperture size={12}/><span>{name}</span><button onClick={()=>{if(selectedClip)updateClip(selectedClip.id,{fx:[...(selectedClip.fx||[]),{type:id,intensity:50}]});setToast(`${name} applied`);}}>Apply</button></div>
                ))}
              </div>
            )}

            {libraryTab==="transitions"&&(
              <div className="fx-catalog">
                <p className="eyebrow fx-head">Transitions</p>
                {TRANSITION_TYPES.filter(t=>t!=="None").map(t=>(
                  <div key={t} className="fx-item"><Wind size={12}/><span>{t}</span>
                    <button onClick={()=>{if(selectedClip)updateClip(selectedClip.id,{transitionIn:t});}}>In</button>
                    <button onClick={()=>{if(selectedClip)updateClip(selectedClip.id,{transitionOut:t});}}>Out</button>
                  </div>
                ))}
              </div>
            )}

            {libraryTab==="audio"&&(
              <div className="fx-catalog">
                <p className="eyebrow fx-head">Audio Effects</p>
                {[["Noise Reduction","denoise"],["Equalizer","eq"],["Compressor","comp"],["Reverb","reverb"],["DeEsser","dees"],["Stereo Widener","wide"]].map(([name,id])=>(
                  <div key={id} className="fx-item"><Mic2 size={12}/><span>{name}</span><button onClick={()=>setToast(`${name} queued`)}>Apply</button></div>
                ))}
              </div>
            )}

            <section className="ai-panel">
              <div className="ai-heading"><Bot size={15}/><div><h2>Rovik AI</h2><p>Smart automation for every edit.</p></div></div>
              <div className="ai-grid">{AI_ACTIONS.map(a=><button key={a} onClick={()=>applyAiAction(a)}>{a}</button>)}</div>
            </section>
          </aside>

          {/* STAGE PANEL */}
          <section className="stage-panel">
            <div className="stage-toolbar">
              <div className="segmented">
                {[[MonitorPlay,"Preview"],[Layers3,"Layers"],[BrainCircuit,"AI Notes"]].map(([Icon,label])=>(
                  <button key={label} className={activeView===label?"active":""} onClick={()=>setActiveView(label)}><Icon size={13}/> {label}</button>
                ))}
              </div>
              <div className="stage-meta">
                <span><Ratio size={13}/> {preset.label}</span>
                <span><Clock3 size={13}/> {formatTime(duration)}</span>
                <button className={`scope-btn${scopesVisible?" active":""}`} onClick={()=>setScopesVisible(v=>!v)} title="Scopes"><Activity size={13}/></button>
              </div>
            </div>

            <div className="preview-stage">
              <div className="monitor-row">
                <section className="source-monitor">
                  <div className="monitor-label">Source</div>
                  <div className="source-frame"><PreviewMedia asset={selectedAsset} imageRef={{current:null}} videoRef={{current:null}} onEnded={()=>{}}/></div>
                  <div className="source-meta"><strong>{selectedAsset?.title||"No asset"}</strong><span>{selectedAsset?.type||"—"}</span></div>
                </section>
                <section className="program-monitor">
                  <div className="monitor-label">Program</div>
                  <div className={`phone-frame program-frame ${frameClass}`} style={{aspectRatio:preset.ratio}}>
                    {activeView==="Preview"&&(
                      <div className="video-scene editable-scene" style={filterStyle}>
                        <PreviewMedia asset={previewAsset} imageRef={imageRef} videoRef={videoRef} onEnded={()=>setIsPlaying(false)}/>
                        {project.filters.vignette>0&&<div className="vignette-overlay" style={{boxShadow:`inset 0 0 ${project.filters.vignette*2}px rgba(0,0,0,${(project.filters.vignette/100*0.85).toFixed(2)})`}}/>}
                        {project.filters.glow>0&&<div className="glow-overlay" style={{opacity:project.filters.glow/100}}/>}
                        <div className="creator-card"><span>{activeTool.toUpperCase()} · {workspaceMode.toUpperCase()}</span><strong>{previewAsset?.title||"No media"}</strong></div>
                        <div className="caption-bubble" contentEditable suppressContentEditableWarning onBlur={e=>updateProject({caption:e.currentTarget.textContent||""})}>{project.caption}</div>
                        <OverlayCanvas overlays={project.overlays} selectedOverlayId={selectedOverlayId} onSelect={setSelectedOverlayId} onChange={updateOverlay}/>
                        <div className="metric-card"><Sparkles size={12}/><span>Score {creatorScore(project)}</span></div>
                      </div>
                    )}
                    {activeView==="Layers"&&<LayerList clips={project.timeline} onSelect={c=>{setSelectedClipId(c.id);setSelectedAssetId(c.assetId);}}/>}
                    {activeView==="AI Notes"&&<div className="stage-list notes">{project.notes.map((n,i)=><p key={i}><CheckCircle2 size={12}/> {n}</p>)}</div>}
                  </div>
                  {scopesVisible&&<ScopesPanel/>}
                </section>
              </div>
            </div>

            <div className="marker-strip">
              {project.markers.map(m=>(
                <button key={m.id} style={{left:`${Math.min(96,(m.time/duration)*100)}%`,color:m.color||"#f4b860"}} onClick={()=>setPlayhead(m.time)}><MapPin size={10}/>{m.label}</button>
              ))}
            </div>

            <div className="transport">
              <button onClick={()=>setPlayhead(0)} title="Rewind"><RotateCcw size={14}/></button>
              <button onClick={splitSelectedClip} title="Split (S)"><SplitSquareHorizontal size={14}/></button>
              <button onClick={()=>{videoRef.current?.pause();setIsPlaying(false);setPlayhead(0);}} title="Stop"><Square size={14}/></button>
              <button className="play-btn" onClick={togglePlayback} title="Play/Pause">{isPlaying?<Pause size={20}/>:<Play size={20} fill="currentColor"/>}</button>
              <button onClick={addMarker} title="Add Marker (M)"><MapPin size={14}/></button>
              <button onClick={()=>applyAiAction("Find viral hook")} title="AI Hook"><Zap size={14}/></button>
              <span className="timecode">{formatTime(playhead)}</span>
            </div>
          </section>

          {/* INSPECTOR */}
          <Inspector
            project={project} preset={preset}
            selectedAsset={selectedAsset} selectedClip={selectedClip} selectedOverlay={selectedOverlay}
            workspaceMode={workspaceMode} future={future}
            onFilter={updateFilters} onProject={updateProject} onClip={updateClip}
            onSplit={splitSelectedClip} onCopy={duplicateSelectedClip}
            onRipple={rippleDeleteSelectedClip} onNudge={nudgeSelectedClip}
            onAddOverlay={addOverlay} onOverlay={updateOverlay} onRemoveOverlay={removeOverlay}
            onFilterPreset={applyFilterPreset} onRedo={redo}
            onAi={applyAiAction} onExport={exportVideoPreview}
            onExportSetting={updateExportSetting}
            onAddMarker={addMarker} onRemoveMarker={removeMarker}
            onSeek={setPlayhead} onTrackState={updateTrackState}
          />
        </section>

        {/* TIMELINE */}
        <section className="timeline-panel">
          <div className="timeline-top">
            <div>
              <p className="eyebrow">Timeline</p>
              <h2>
                {project.timeline.filter(c=>c.track==="V1"||c.track==="V2").length} video ·{" "}
                {project.timeline.filter(c=>c.track==="A1"||c.track==="A2"||c.track==="Music").length} audio ·{" "}
                {project.timeline.filter(c=>c.track==="Captions").length} captions
              </h2>
            </div>
            <div className="timeline-controls">
              <span className="toast-badge">{toast}</span>
              <button onClick={()=>setSnapEnabled(v=>!v)} className={`ghost-button snap-btn${snapEnabled?" snapping":""}`} title="Toggle snapping"><Move size={12}/> Snap</button>
              <button onClick={()=>setTimelineZoom(z=>Math.max(0.25,+(z-0.5).toFixed(1)))} className="ghost-button" title="Zoom out (-)"><ZoomOut size={13}/></button>
              <span className="zoom-label">{Math.round(timelineZoom*100)}%</span>
              <button onClick={()=>setTimelineZoom(z=>Math.min(8,+(z+0.5).toFixed(1)))} className="ghost-button" title="Zoom in (+)"><ZoomIn size={13}/></button>
            </div>
          </div>

          <div className="timeline-body">
            <div className="ruler-row">
              <div className="track-head-spacer"/>
              <div className="tl-ruler">
                {Array.from({length:9},(_,i)=>(
                  <span key={i} style={{left:`${(i/8)*100}%`}}>{formatTime(i*Math.ceil(duration/8))}</span>
                ))}
              </div>
            </div>
            <div className="tracks-container">
              {TRACK_DEFS.map(td=>(
                <Track key={td.id} trackDef={td} trackState={project.trackState[td.id]} duration={duration} zoom={timelineZoom} playhead={playhead} items={project.timeline.filter(c=>c.track===td.id)} selectedClipId={selectedClipId}
                  onSelect={c=>{setSelectedClipId(c.id);setSelectedAssetId(c.assetId);setPlayhead(c.start);}}
                  onRemove={removeClip} onTrim={(id,patch)=>updateClip(id,patch)} onDropAsset={addAssetToTimelineAt} onMoveClip={moveClipTo} onTrackState={updateTrackState} snapEnabled={snapEnabled}
                />
              ))}
            </div>
          </div>
        </section>
      </section>

      {showShortcuts&&<KeyboardShortcutsModal onClose={()=>setShowShortcuts(false)}/>}
      <canvas ref={canvasRef} className="visually-hidden"/>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════ INSPECTOR */
function Inspector({project,selectedAsset,selectedClip,selectedOverlay,workspaceMode,future,onFilter,onProject,onClip,onSplit,onCopy,onRipple,onNudge,onAddOverlay,onOverlay,onRemoveOverlay,onFilterPreset,onRedo,onAi,onExport,onExportSetting,onAddMarker,onRemoveMarker,onSeek,onTrackState}){
  const [colorTab,setColorTab]=useState("basic");
  return(
    <aside className="inspector-panel">
      <div className="panel-header"><div><p className="eyebrow">Inspector</p><h2>{selectedClip?.label||selectedAsset?.title||"Nothing selected"}</h2></div><ChevronDown size={14}/></div>
      <div className="score-card"><Stars size={15}/><div><strong>Score {creatorScore(project)}</strong><p>Edit · Color · Audio · Captions</p></div></div>
      <div className="connection-card"><span className={isSupabaseConfigured?"status-dot online":"status-dot"}/><div><strong>Supabase {isSupabaseConfigured?"live":"not configured"}</strong><p>Cloud storage for projects.</p></div></div>

      {workspaceMode==="Color"&&(
        <div className="color-workspace">
          <div className="color-tabs">
            {[["basic","Basic"],["tone","Color"],["detail","Detail"],["fx","FX"]].map(([id,label])=>(
              <button key={id} className={colorTab===id?"active":""} onClick={()=>setColorTab(id)}>{label}</button>
            ))}
          </div>
          {colorTab==="basic"&&(<><p className="section-label">Tone</p>
            <LumetriControl label="Exposure"   value={project.filters.exposure}   min={-100} max={100} onChange={v=>onFilter("exposure",  v)}/>
            <LumetriControl label="Contrast"   value={project.filters.contrast}   min={-100} max={100} onChange={v=>onFilter("contrast",  v)}/>
            <LumetriControl label="Highlights" value={project.filters.highlights} min={-100} max={100} onChange={v=>onFilter("highlights",v)}/>
            <LumetriControl label="Shadows"    value={project.filters.shadows}    min={-100} max={100} onChange={v=>onFilter("shadows",   v)}/>
            <LumetriControl label="Whites"     value={project.filters.whites}     min={-100} max={100} onChange={v=>onFilter("whites",    v)}/>
            <LumetriControl label="Blacks"     value={project.filters.blacks}     min={-100} max={100} onChange={v=>onFilter("blacks",    v)}/></>)}
          {colorTab==="tone"&&(<><p className="section-label">Color</p>
            <LumetriControl label="Temp"       value={project.filters.warmth}     min={-100} max={100} onChange={v=>onFilter("warmth",    v)} colorHint="temp"/>
            <LumetriControl label="Tint"       value={project.filters.tint||0}    min={-100} max={100} onChange={v=>onFilter("tint",      v)} colorHint="tint"/>
            <LumetriControl label="Vibrance"   value={project.filters.vibrance}   min={-100} max={100} onChange={v=>onFilter("vibrance",  v)}/>
            <LumetriControl label="Saturation" value={project.filters.saturation} min={-100} max={100} onChange={v=>onFilter("saturation",v)}/></>)}
          {colorTab==="detail"&&(<><p className="section-label">Detail</p>
            <LumetriControl label="Sharpness" value={project.filters.sharpness} min={0} max={100} onChange={v=>onFilter("sharpness",v)}/>
            <LumetriControl label="Blur"      value={project.filters.blur}      min={0} max={100} onChange={v=>onFilter("blur",     v)}/></>)}
          {colorTab==="fx"&&(<><p className="section-label">Lens / Film</p>
            <LumetriControl label="Vignette" value={project.filters.vignette} min={0} max={100} onChange={v=>onFilter("vignette",v)}/>
            <LumetriControl label="Grain"    value={project.filters.grain}    min={0} max={100} onChange={v=>onFilter("grain",   v)}/>
            <LumetriControl label="Glow"     value={project.filters.glow}     min={0} max={100} onChange={v=>onFilter("glow",    v)}/></>)}
          <div className="filter-presets-grid">{Object.keys(FILTER_PRESETS).map(name=><button key={name} className="preset-chip" onClick={()=>onFilterPreset(name)}>{name}</button>)}</div>
          <button className="wide-secondary" onClick={()=>Object.keys(DEFAULT_FILTERS).forEach(k=>onFilter(k,0))}>↺ Reset All</button>
        </div>
      )}

      {workspaceMode==="Audio"&&(
        <div className="audio-workspace">
          <p className="section-label">Master</p>
          <LumetriControl label="Master Vol" value={project.masterVolume??100} min={0} max={150} onChange={v=>onProject({masterVolume:Number(v)})}/>
          <p className="section-label" style={{marginTop:14}}>Master EQ</p>
          <LumetriControl label="Low"  value={project.eq?.low ??0} min={-20} max={20} onChange={v=>onProject({eq:{...project.eq,low: Number(v)}})}/>
          <LumetriControl label="Mid"  value={project.eq?.mid ??0} min={-20} max={20} onChange={v=>onProject({eq:{...project.eq,mid: Number(v)}})}/>
          <LumetriControl label="High" value={project.eq?.high??0} min={-20} max={20} onChange={v=>onProject({eq:{...project.eq,high:Number(v)}})}/>
          <p className="section-label" style={{marginTop:14}}>Track Mixer</p>
          <div className="mixer-tracks">
            {TRACK_DEFS.map(td=>{const ts=project.trackState[td.id]||{};return(
              <div key={td.id} className="mixer-row">
                <span className="mixer-label" style={{color:td.color}}>{td.name}</span>
                <input type="range" min="0" max="150" value={ts.volume??100} onChange={e=>onTrackState(td.id,{volume:Number(e.target.value)})} className="mixer-fader"/>
                <span className="mixer-vol">{ts.volume??100}</span>
                <button className={`mixer-btn${ts.muted?" danger":""}`} onClick={()=>onTrackState(td.id,{muted:!ts.muted})} title="Mute">{ts.muted?<VolumeX size={10}/>:<Volume2 size={10}/>}</button>
                <button className={`mixer-btn${ts.solo?" solo":""}`} onClick={()=>onTrackState(td.id,{solo:!ts.solo})} title="Solo">S</button>
              </div>
            );})}
          </div>
        </div>
      )}

      {workspaceMode==="Export"&&(
        <div className="export-editor">
          <h3>Export Settings</h3>
          <SelectField label="Format"     value={project.exportSettings.format}              values={["MP4 H.264","MP4 H.265","WebM VP9","ProRes 422","GIF"]}              onChange={v=>onExportSetting("format",    v)}/>
          <SelectField label="Quality"    value={project.exportSettings.quality}             values={["Draft","Medium","High","Master"]}                                     onChange={v=>onExportSetting("quality",   v)}/>
          <SelectField label="Resolution" value={project.exportSettings.resolution||"1080p"} values={["480p","720p","1080p","1440p","4K"]}                                  onChange={v=>onExportSetting("resolution",v)}/>
          <label><span>FPS</span><input type="number" min="24" max="120" value={project.exportSettings.fps} onChange={e=>onExportSetting("fps",Number(e.target.value))}/></label>
          <SelectField label="Audio"      value={project.exportSettings.audio}               values={["AAC 128kbps","AAC 192kbps","AAC 320kbps","WAV 48kHz","WAV 24-bit"]}  onChange={v=>onExportSetting("audio",     v)}/>
          <label><span>Bitrate</span><input type="number" min="1000" max="50000" step="500" value={project.exportSettings.bitrate||"8000"} onChange={e=>onExportSetting("bitrate",e.target.value)}/></label>
          <button className="wide-primary" onClick={onExport}><Download size={14}/> Render Preview</button>
        </div>
      )}

      {workspaceMode==="Captions"&&(
        <div className="captions-workspace">
          <label className="caption-editor"><span>Caption text</span><textarea value={project.caption} onChange={e=>onProject({caption:e.target.value})}/></label>
          <button className="wide-secondary" style={{marginTop:10}} onClick={()=>onAi("Generate captions")}><BrainCircuit size={13}/> Auto-generate captions</button>
        </div>
      )}

      {workspaceMode==="Edit"&&(<>
        {selectedClip&&(
          <div className="clip-editor">
            <div className="clip-editor-top"><h3>Clip</h3><span className="track-badge">{selectedClip.track}</span></div>
            <label><span>Name</span><input value={selectedClip.label} onChange={e=>onClip(selectedClip.id,{label:e.target.value})}/></label>
            <label><span>Start</span><input type="number" min="0" step="0.1" value={selectedClip.start} onChange={e=>onClip(selectedClip.id,{start:Number(e.target.value)})}/></label>
            <label><span>Duration</span><input type="number" min="0.1" step="0.1" value={selectedClip.duration} onChange={e=>onClip(selectedClip.id,{duration:Number(e.target.value)})}/></label>
            <div className="clip-prop-row"><span>Opacity</span><input type="range" min="0" max="100" value={selectedClip.opacity??100} onChange={e=>onClip(selectedClip.id,{opacity:Number(e.target.value)})}/><b>{selectedClip.opacity??100}%</b></div>
            <div className="clip-prop-row"><span>Speed</span><input type="range" min="10" max="400" value={Math.round((selectedClip.speed??1)*100)} onChange={e=>onClip(selectedClip.id,{speed:Number(e.target.value)/100})}/><b>{Math.round((selectedClip.speed??1)*100)}%</b></div>
            <SelectField label="Blend"     value={selectedClip.blendMode       ||"Normal"} values={BLEND_MODES}      onChange={v=>onClip(selectedClip.id,{blendMode:v})}/>
            <SelectField label="Trans In"  value={selectedClip.transitionIn    ||"None"}   values={TRANSITION_TYPES} onChange={v=>onClip(selectedClip.id,{transitionIn:v})}/>
            <SelectField label="Trans Out" value={selectedClip.transitionOut   ||"None"}   values={TRANSITION_TYPES} onChange={v=>onClip(selectedClip.id,{transitionOut:v})}/>
            <label><span>T-Dur</span><input type="number" min="0" max="3" step="0.1" value={selectedClip.transitionDuration??0.5} onChange={e=>onClip(selectedClip.id,{transitionDuration:Number(e.target.value)})}/></label>
            <div className="clip-actions">
              <button onClick={onSplit}><Scissors size={11}/> Split</button>
              <button onClick={onCopy}><Copy size={11}/> Copy</button>
              <button onClick={()=>onNudge(-0.5)}>-0.5s</button>
              <button onClick={()=>onNudge( 0.5)}>+0.5s</button>
              <button onClick={onRipple} className="danger-action"><Trash2 size={11}/> Ripple</button>
              <button onClick={onRedo} disabled={!future.length}><Redo2 size={11}/> Redo</button>
            </div>
          </div>
        )}

        <div className="overlay-editor">
          <div className="clip-editor-top"><h3>Overlays & Text</h3><button onClick={()=>onAddOverlay("text")}><Plus size={11}/> Text</button></div>
          <div className="clip-actions">
            <button onClick={()=>onAddOverlay("badge")}><Plus size={11}/> Badge</button>
            <button onClick={()=>onAddOverlay("shape")}><Plus size={11}/> Shape</button>
          </div>
          {selectedOverlay&&(<>
            <label><span>Text</span><input value={selectedOverlay.text||""} onChange={e=>onOverlay(selectedOverlay.id,{text:e.target.value})}/></label>
            <label><span>Size</span><input type="range" min="2" max="20" value={selectedOverlay.size||6} onChange={e=>onOverlay(selectedOverlay.id,{size:Number(e.target.value)})}/></label>
            <SelectField label="Font"   value={selectedOverlay.fontFamily||"System"} values={FONT_FAMILIES}   onChange={v=>onOverlay(selectedOverlay.id,{fontFamily:v})}/>
            <SelectField label="Weight" value={selectedOverlay.fontWeight||"900"}    values={FONT_WEIGHTS}    onChange={v=>onOverlay(selectedOverlay.id,{fontWeight:v})}/>
            <SelectField label="Anim"   value={selectedOverlay.animation ||"None"}   values={TEXT_ANIMATIONS} onChange={v=>onOverlay(selectedOverlay.id,{animation:v})}/>
            <div className="clip-actions">
              <label className="color-swatch-label"><span>Color</span><input type="color" value={selectedOverlay.color||"#ffffff"} onChange={e=>onOverlay(selectedOverlay.id,{color:e.target.value})}/></label>
              <button onClick={()=>onOverlay(selectedOverlay.id,{color:"#ffffff",background:"rgba(7,9,13,0.62)"})}>Dark</button>
              <button onClick={()=>onOverlay(selectedOverlay.id,{color:"#071016",background:"#a3ff8f"})}>Green</button>
              <button className="danger-action" onClick={()=>onRemoveOverlay(selectedOverlay.id)}><Trash2 size={11}/> Del</button>
            </div>
          </>)}
        </div>

        <div className="tool-section">
          <h3>Smart Effects</h3>
          <button onClick={()=>onAi("Generate captions")}><Subtitles size={13}/> Kinetic captions</button>
          <button onClick={()=>onAi("Clean audio")}><Mic2 size={13}/> Studio voice clean</button>
          <button onClick={()=>onAi("Make 10 clips")}><Clapperboard size={13}/> Auto b-roll maker</button>
          <button onClick={()=>onAi("Auto color grade")}><Aperture size={13}/> Auto color grade</button>
          <button onClick={onExport}><Download size={13}/> Export preview</button>
        </div>
      </>)}

      <div className="marker-list">
        <div className="clip-editor-top"><h3>Markers</h3><button onClick={onAddMarker}><Plus size={11}/> Add</button></div>
        {project.markers.map(m=>(
          <button key={m.id} className="marker-row" onClick={()=>onSeek(m.time)}>
            <MapPin size={11} style={{color:m.color||"#f4b860"}}/><span>{formatTime(m.time)}</span><strong>{m.label}</strong>
            <Trash2 size={10} className="marker-del" onClick={e=>{e.stopPropagation();onRemoveMarker(m.id);}}/>
          </button>
        ))}
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════ SCOPES */
function ScopesPanel(){
  const ref=useRef(null);
  useEffect(()=>{
    const canvas=ref.current;const ctx=canvas?.getContext("2d");if(!canvas||!ctx)return;
    ctx.fillStyle="#080b10";ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle="rgba(255,255,255,0.05)";ctx.lineWidth=1;
    for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(canvas.width*i/4,0);ctx.lineTo(canvas.width*i/4,canvas.height);ctx.stroke();}
    [["#4477ff",0.55],["#33cc55",0.5],["#ff4444",0.6]].forEach(([color,peak])=>{
      ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.globalAlpha=0.72;ctx.beginPath();
      for(let i=0;i<=64;i++){const x=(i/64)*canvas.width;const v=Math.exp(-((i/64-peak)**2)/0.05)*(0.75+Math.random()*0.1);const y=canvas.height-v*(canvas.height-6);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.stroke();
    });
    ctx.globalAlpha=1;ctx.fillStyle="#5a6878";ctx.font="bold 9px system-ui";ctx.fillText("Histogram  R G B",6,11);
  },[]);
  return<div className="scopes-panel"><canvas ref={ref} width={280} height={72}/></div>;
}

/* ═══════════════════════════════════════════════════════════════ SHORTCUTS MODAL */
function KeyboardShortcutsModal({onClose}){
  const shortcuts=[["Space","Play / Pause"],["S","Split clip at playhead"],["M","Add marker"],["Delete","Remove selected clip"],["Ctrl+Z","Undo"],["Ctrl+Y","Redo"],["Ctrl+S","Save"],["+ / =","Zoom in timeline"],["-","Zoom out timeline"],["?","Toggle this panel"]];
  return(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>Keyboard Shortcuts</h2><button className="modal-close" onClick={onClose}><X size={15}/></button></div>
        <div className="shortcut-list">{shortcuts.map(([key,desc])=><div key={key} className="shortcut-row"><kbd>{key}</kbd><span>{desc}</span></div>)}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ TRACK */
function Track({trackDef,trackState,items,duration,zoom,playhead,selectedClipId,onSelect,onRemove,onTrim,onDropAsset,onMoveClip,onTrackState,snapEnabled}){
  const laneRef=useRef(null);
  const ts=trackState||{};
  const visibleDuration=duration/zoom;

  function snap(s){return snapEnabled?Math.round(s*2)/2:s;}
  function secFromEvent(e){const rect=laneRef.current?.getBoundingClientRect();if(!rect)return 0;return snap(Math.max(0,((e.clientX-rect.left)/rect.width)*visibleDuration));}

  function handleDrop(e){
    e.preventDefault();const start=secFromEvent(e);
    const assetId=e.dataTransfer.getData("asset-id");const clipId=e.dataTransfer.getData("clip-id");
    if(clipId)onMoveClip(clipId,trackDef.id,start);else if(assetId)onDropAsset(assetId,trackDef.id,start);
  }

  function startTrim(e,clip,edge){
    e.preventDefault();e.stopPropagation();
    const startX=e.clientX,origStart=clip.start,origDuration=clip.duration;
    function onMove(ev){
      const rect=laneRef.current?.getBoundingClientRect();if(!rect)return;
      const dSec=((ev.clientX-startX)/rect.width)*visibleDuration;
      if(edge==="left"){const ns=snap(Math.max(0,origStart+dSec));onTrim(clip.id,{start:ns,duration:Math.max(0.2,origDuration-(ns-origStart))});}
      else{onTrim(clip.id,{duration:Math.max(0.2,snap(origDuration+dSec))});}
    }
    function onUp(){window.removeEventListener("pointermove",onMove);window.removeEventListener("pointerup",onUp);}
    window.addEventListener("pointermove",onMove);window.addEventListener("pointerup",onUp);
  }

  return(
    <div className={`track${trackDef.compact?" compact":""}${ts.muted?" track-muted":""}`}>
      <div className="track-head">
        <span className="track-name" style={{color:trackDef.color}}>{trackDef.name}</span>
        <div className="track-btns">
          <button className={`track-btn${ts.muted?" t-active":""}`}  onClick={()=>onTrackState(trackDef.id,{muted: !ts.muted})}  title="Mute" >{ts.muted?<VolumeX size={9}/>:<Volume2 size={9}/>}</button>
          <button className={`track-btn${ts.locked?" t-active":""}`} onClick={()=>onTrackState(trackDef.id,{locked:!ts.locked})} title="Lock" >{ts.locked?<Lock size={9}/>:<Unlock size={9}/>}</button>
          <button className={`track-btn${ts.solo?" t-solo":""}`}     onClick={()=>onTrackState(trackDef.id,{solo:  !ts.solo})}   title="Solo" >S</button>
        </div>
      </div>
      <div ref={laneRef} className="track-lane" onDragOver={e=>e.preventDefault()} onDrop={handleDrop}>
        {trackDef.type==="video"&&<span className="playhead" style={{left:`${Math.min(100,(playhead/visibleDuration)*100)}%`}}/>}
        {items.length===0&&<span className="empty-track">Drop {trackDef.type} clips here</span>}
        {items.map(item=>{
          const lp=Math.max(0,(item.start/visibleDuration)*100);
          const wp=Math.max(2,(item.duration/visibleDuration)*100);
          return(
            <div key={item.id} className={`clip${selectedClipId===item.id?" selected":""}${ts.muted?" clip-muted":""}`}
              style={{left:`${lp}%`,width:`${wp}%`,"--clip-color":item.color,opacity:(item.opacity??100)/100}}
              draggable={!ts.locked} title={`${item.label} · ${formatTime(item.duration)}`}
              onDragStart={e=>{if(ts.locked){e.preventDefault();return;}e.dataTransfer.setData("clip-id",item.id);e.dataTransfer.effectAllowed="move";}}
              onClick={()=>onSelect(item)}>
              <div className="trim-handle left"  onPointerDown={e=>!ts.locked&&startTrim(e,item,"left")} />
              <span className="clip-label">{item.label}</span>
              {item.transitionIn &&item.transitionIn !=="None"&&<span className="trans-badge trans-in"/>}
              {item.transitionOut&&item.transitionOut!=="None"&&<span className="trans-badge trans-out"/>}
              <button className="clip-del" onClick={e=>{e.stopPropagation();onRemove(item.id);}} title="Remove"><Trash2 size={9}/></button>
              <div className="trim-handle right" onPointerDown={e=>!ts.locked&&startTrim(e,item,"right")} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ LUMETRI CONTROL */
function LumetriControl({label,value,min=-100,max=100,onChange,colorHint}){
  return(
    <label className={`lumetri-control${colorHint?" "+colorHint:""}`}>
      <span className="lc-label">{label}</span>
      <input type="range"  min={min} max={max} value={value} onChange={e=>onChange(e.target.value)} className="lc-range"/>
      <input type="number" min={min} max={max} value={value} onChange={e=>onChange(e.target.value)} className="lc-num"/>
    </label>
  );
}

/* ═══════════════════════════════════════════════════════════════ OVERLAY CANVAS */
function OverlayCanvas({overlays,selectedOverlayId,onSelect,onChange}){
  const drag=useRef(null);
  function startDrag(e,ov){e.preventDefault();e.stopPropagation();drag.current={id:ov.id,rect:e.currentTarget.parentElement.getBoundingClientRect()};onSelect(ov.id);window.addEventListener("pointermove",move);window.addEventListener("pointerup",stop);}
  function move(e){const d=drag.current;if(!d)return;onChange(d.id,{x:+(Math.max(0,Math.min(100,((e.clientX-d.rect.left)/d.rect.width)*100)).toFixed(1)),y:+(Math.max(0,Math.min(100,((e.clientY-d.rect.top)/d.rect.height)*100)).toFixed(1))});}
  function stop(){drag.current=null;window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",stop);}
  return(
    <div className="overlay-canvas">
      {overlays.map(ov=>(
        <button key={ov.id} className={`program-overlay ${ov.type}${ov.id===selectedOverlayId?" selected":""}`}
          style={{left:`${ov.x}%`,top:`${ov.y}%`,fontSize:`${ov.size}cqw`,color:ov.color,background:ov.background,fontFamily:ov.fontFamily!=="System"?ov.fontFamily:undefined,fontWeight:ov.fontWeight||"900",textAlign:ov.textAlign||"center"}}
          onPointerDown={e=>startDrag(e,ov)} onClick={e=>{e.stopPropagation();onSelect(ov.id);}}>
          {ov.text}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ SMALL COMPONENTS */
function PreviewMedia({asset,imageRef,videoRef,onEnded}){
  if(!asset)return<div className="empty-stage">Import media to begin</div>;
  if(asset.type==="image"&&asset.src)return<img  ref={imageRef} className="preview-media" src={asset.src} alt={asset.title} crossOrigin="anonymous"/>;
  if(asset.type==="video"&&asset.src)return<video ref={videoRef} className="preview-media" src={asset.src} playsInline onEnded={onEnded}/>;
  if(asset.type==="audio"&&asset.src)return<div className="audio-preview"><AudioLines size={38}/><strong>{asset.title}</strong><audio ref={videoRef} src={asset.src} onEnded={onEnded}/></div>;
  return<div className="generated-preview"><div className="scene-orbit one"/><div className="scene-orbit two"/><Film size={42}/><strong>{asset.title}</strong><p>{asset.meta}</p></div>;
}
function LayerList({clips,onSelect}){return<div className="stage-list">{clips.map(c=><button key={c.id} onClick={()=>onSelect(c)}><Layers3 size={12}/><span>{c.track}</span><strong>{c.label}</strong></button>)}</div>;}
function SelectField({label,value,values,onChange}){return<label><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{values.map(v=><option key={v}>{v}</option>)}</select></label>;}
function IconButton({icon:Icon,label,active,onClick}){return<button className={`icon-button${active?" is-active":""}`} aria-label={label} title={label} onClick={onClick}><Icon size={16} strokeWidth={2.2}/></button>;}
function AssetIcon({type}){if(type==="image")return<Image size={14}/>;if(type==="audio")return<AudioLines size={14}/>;if(type==="text")return<TextCursorInput size={14}/>;return<Film size={14}/>;}

/* ═══════════════════════════════════════════════════════════════ UTILITIES */
function formatBytes(b){if(!b)return"0 B";const u=["B","KB","MB","GB"];const i=Math.min(Math.floor(Math.log(b)/Math.log(1024)),u.length-1);return`${(b/1024**i).toFixed(i?1:0)} ${u[i]}`;}
function formatTime(s){const safe=Math.max(0,Math.round(s));return`${Math.floor(safe/60).toString().padStart(2,"0")}:${(safe%60).toString().padStart(2,"0")}`;}
function creatorScore(p){return Math.min(99,58+Math.min(18,p.assets.length*3)+Math.min(16,p.timeline.length*2)+(p.caption?.length>20?8:2));}
function slug(v){return v.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")||"rovik-studio";}
function downloadBlob(blob,name){const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download=name;a.click();URL.revokeObjectURL(u);}
function drawCover(ctx,img,w,h){const s=Math.max(w/img.naturalWidth,h/img.naturalHeight);ctx.drawImage(img,(w-img.naturalWidth*s)/2,(h-img.naturalHeight*s)/2,img.naturalWidth*s,img.naturalHeight*s);}
function drawCaption(ctx,canvas,caption){ctx.fillStyle="rgba(7,9,13,0.72)";roundRect(ctx,canvas.width*0.08,canvas.height*0.72,canvas.width*0.84,canvas.height*0.13,28);ctx.fill();ctx.fillStyle="#ffffff";ctx.font=`800 ${Math.max(26,canvas.width*0.04)}px system-ui`;ctx.textAlign="center";wrapText(ctx,caption,canvas.width/2,canvas.height*0.79,canvas.width*0.76,Math.max(36,canvas.width*0.052));}
function drawCompositionFrame(ctx,canvas,project,preset,seconds){ctx.clearRect(0,0,canvas.width,canvas.height);const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,"#06131a");g.addColorStop(0.5,"#11141a");g.addColorStop(1,"#20381f");ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="rgba(255,255,255,0.08)";ctx.fillRect(canvas.width*0.08,canvas.height*0.12,canvas.width*0.84,canvas.height*0.5);ctx.fillStyle="#f6f8fb";ctx.font=`900 ${Math.max(32,canvas.width*0.055)}px system-ui`;ctx.textAlign="center";ctx.fillText(project.name,canvas.width/2,canvas.height*0.34);ctx.fillStyle="#a3ff8f";ctx.font=`800 ${Math.max(18,canvas.width*0.024)}px system-ui`;ctx.fillText(`${preset.label} · ${formatTime(seconds)} · Rovik Studio`,canvas.width/2,canvas.height*0.93);}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function wrapText(ctx,text,x,y,maxWidth,lineHeight){const words=text.split(" ");let line="",offset=0;words.forEach((word,i)=>{const test=`${line}${word} `;if(ctx.measureText(test).width>maxWidth&&i>0){ctx.fillText(line,x,y+offset);line=`${word} `;offset+=lineHeight;}else{line=test;}});ctx.fillText(line,x,y+offset);}

createRoot(document.getElementById("root")).render(<App/>);
