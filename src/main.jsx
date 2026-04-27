import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Aperture,
  AudioLines,
  Bot,
  BrainCircuit,
  Captions,
  CheckCircle2,
  ChevronDown,
  Clapperboard,
  Clock3,
  Copy,
  Crop,
  Download,
  Film,
  Image,
  Layers3,
  ListVideo,
  MapPin,
  Mic2,
  MonitorPlay,
  MousePointer2,
  Music2,
  Pause,
  Play,
  Plus,
  Ratio,
  RotateCcw,
  Save,
  Scissors,
  Search,
  Settings2,
  Share2,
  SlidersHorizontal,
  Sparkles,
  SplitSquareHorizontal,
  Square,
  Stars,
  Subtitles,
  TextCursorInput,
  Trash2,
  Undo2,
  Upload,
  WandSparkles,
  Zap
} from "lucide-react";
import { isSupabaseConfigured } from "./lib/supabase";
import "./styles.css";

const STORAGE_KEY = "rovik-studio-project-v2";

const presetMap = {
  "YouTube 16:9": { ratio: "16 / 9", label: "16:9", width: 1920, height: 1080 },
  "TikTok 9:16": { ratio: "9 / 16", label: "9:16", width: 1080, height: 1920 },
  "Shorts 9:16": { ratio: "9 / 16", label: "9:16", width: 1080, height: 1920 },
  "Stream 16:9": { ratio: "16 / 9", label: "16:9", width: 1920, height: 1080 },
  "Square 1:1": { ratio: "1 / 1", label: "1:1", width: 1080, height: 1080 }
};

const demoAssets = [
  { id: "demo-video", title: "Cold open", meta: "Demo video layer", type: "video", accent: "cyan", src: "", duration: 13 },
  {
    id: "demo-image",
    title: "Product shot",
    meta: "Editable image layer",
    type: "image",
    accent: "lime",
    src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85",
    duration: 8
  },
  { id: "demo-audio", title: "Voiceover", meta: "Audio track", type: "audio", accent: "rose", src: "", duration: 20 },
  { id: "demo-caption", title: "Hook captions", meta: "Auto styled text", type: "text", accent: "amber", src: "", duration: 6 }
];

const starterProject = {
  name: "Launch Episode",
  preset: "TikTok 9:16",
  caption: "POV: your editor finds the viral moment first",
  filters: { exposure: 68, contrast: 54, saturation: 62, warmth: 42 },
  exportSettings: { format: "MP4 H.264", quality: "High", fps: 30, audio: "AAC 320kbps" },
  markers: [
    { id: "marker-1", time: 2, label: "Hook" },
    { id: "marker-2", time: 8, label: "Payoff" }
  ],
  assets: demoAssets,
  timeline: [
    { id: "clip-1", assetId: "demo-image", label: "Hook", track: "Video", start: 0, duration: 8, color: "#45d7ff" },
    { id: "clip-2", assetId: "demo-caption", label: "Captions", track: "Captions", start: 0, duration: 6, color: "#f4b860" },
    { id: "clip-3", assetId: "demo-audio", label: "Voice", track: "Audio", start: 0, duration: 20, color: "#ff6b9d" }
  ],
  notes: [
    "Repair is built around standard nonlinear editing workflows, not copied proprietary systems.",
    "Import footage, cut on a timeline, tune color/audio/captions, mark moments, then export."
  ]
};

const presets = Object.keys(presetMap);
const workspaces = ["Edit", "Color", "Audio", "Captions", "Export"];
const aiActions = ["Find viral hook", "Remove silence", "Generate captions", "Make 10 clips", "Clean audio", "Brand kit"];

function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return starterProject;
    const saved = JSON.parse(raw);
    return {
      ...starterProject,
      ...saved,
      filters: { ...starterProject.filters, ...(saved.filters || {}) },
      exportSettings: { ...starterProject.exportSettings, ...(saved.exportSettings || {}) },
      assets: saved.assets?.length ? saved.assets : starterProject.assets,
      timeline: saved.timeline?.length ? saved.timeline : starterProject.timeline,
      markers: saved.markers?.length ? saved.markers : starterProject.markers,
      notes: saved.notes?.length ? saved.notes : starterProject.notes
    };
  } catch {
    return starterProject;
  }
}

function App() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const [project, setProject] = useState(loadProject);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState(project.assets[1]?.id);
  const [selectedClipId, setSelectedClipId] = useState(project.timeline[0]?.id);
  const [activeTool, setActiveTool] = useState("Select");
  const [workspaceMode, setWorkspaceMode] = useState("Edit");
  const [activeView, setActiveView] = useState("Preview");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("Project loaded");

  const selectedAsset = useMemo(() => project.assets.find((asset) => asset.id === selectedAssetId) || project.assets[0], [project.assets, selectedAssetId]);
  const selectedClip = useMemo(() => project.timeline.find((clip) => clip.id === selectedClipId), [project.timeline, selectedClipId]);
  const filteredAssets = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    if (!lowered) return project.assets;
    return project.assets.filter((asset) => `${asset.title} ${asset.meta} ${asset.type}`.toLowerCase().includes(lowered));
  }, [project.assets, query]);
  const preset = presetMap[project.preset] || presetMap["TikTok 9:16"];
  const duration = Math.max(30, ...project.timeline.map((clip) => clip.start + clip.duration));
  const activeClip = useMemo(() => project.timeline.find((clip) => clip.track === "Video" && playhead >= clip.start && playhead < clip.start + clip.duration), [project.timeline, playhead]);
  const previewAsset = useMemo(() => project.assets.find((asset) => asset.id === activeClip?.assetId) || selectedAsset, [activeClip, project.assets, selectedAsset]);
  const filterStyle = {
    filter: `brightness(${project.filters.exposure + 35}%) contrast(${project.filters.contrast + 55}%) saturate(${project.filters.saturation + 45}%) sepia(${Math.max(0, project.filters.warmth - 50) * 0.7}%)`
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setToast("Autosaved locally");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [project]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = window.setInterval(() => {
      setPlayhead((current) => {
        const next = current + 0.1;
        return next >= duration ? 0 : Number(next.toFixed(1));
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [duration, isPlaying]);

  useEffect(() => {
    function handleKeys(event) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === "Space") {
        event.preventDefault();
        togglePlayback();
      }
      if (event.key.toLowerCase() === "s") splitSelectedClip();
      if (event.key.toLowerCase() === "m") addMarker();
      if ((event.key === "Delete" || event.key === "Backspace") && selectedClipId) removeClip(selectedClipId);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
    }
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  });

  function commitProject(recipe, message = "Updated project") {
    setProject((current) => {
      const next = typeof recipe === "function" ? recipe(current) : { ...current, ...recipe };
      setHistory((items) => [...items.slice(-24), current]);
      setFuture([]);
      setToast(message);
      return next;
    });
  }

  function updateProject(patch) {
    commitProject(patch);
  }

  function updateFilters(key, value) {
    commitProject((current) => ({ ...current, filters: { ...current.filters, [key]: Number(value) } }), "Color adjusted");
  }

  function handleImport(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const nextAssets = files.map((file) => {
      const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : "file";
      return {
        id: `${Date.now()}-${file.name}`,
        title: file.name.replace(/\.[^.]+$/, ""),
        meta: `${type.toUpperCase()} - ${formatBytes(file.size)}`,
        type,
        accent: type === "image" ? "lime" : type === "audio" ? "rose" : "cyan",
        src: URL.createObjectURL(file),
        duration: type === "image" ? 6 : 12
      };
    });
    commitProject((current) => ({ ...current, assets: [...nextAssets, ...current.assets] }), `Imported ${nextAssets.length} asset${nextAssets.length > 1 ? "s" : ""}`);
    setSelectedAssetId(nextAssets[0].id);
    event.target.value = "";
  }

  function addToTimeline(asset = selectedAsset) {
    if (!asset) return;
    const track = asset.type === "audio" ? "Audio" : asset.type === "text" ? "Captions" : "Video";
    const start = Math.max(0, ...project.timeline.filter((clip) => clip.track === track).map((clip) => clip.start + clip.duration));
    const clip = {
      id: `clip-${Date.now()}`,
      assetId: asset.id,
      label: asset.title.slice(0, 18),
      track,
      start,
      duration: asset.duration || 8,
      color: asset.type === "audio" ? "#ff6b9d" : asset.type === "text" ? "#f4b860" : "#45d7ff"
    };
    commitProject((current) => ({ ...current, timeline: [...current.timeline, clip] }), `Added ${asset.title} to ${track}`);
    setSelectedClipId(clip.id);
  }

  function removeClip(clipId) {
    commitProject((current) => ({ ...current, timeline: current.timeline.filter((clip) => clip.id !== clipId) }), "Clip removed");
    if (selectedClipId === clipId) setSelectedClipId(undefined);
  }

  function updateClip(clipId, patch) {
    commitProject((current) => ({ ...current, timeline: current.timeline.map((clip) => clip.id === clipId ? { ...clip, ...patch } : clip) }), "Clip updated");
  }

  function splitSelectedClip() {
    if (!selectedClip || selectedClip.duration <= 1) return;
    const relative = playhead > selectedClip.start && playhead < selectedClip.start + selectedClip.duration ? playhead - selectedClip.start : selectedClip.duration / 2;
    const firstDuration = Math.max(0.5, Number(relative.toFixed(1)));
    const secondDuration = Math.max(0.5, Number((selectedClip.duration - firstDuration).toFixed(1)));
    const secondClip = { ...selectedClip, id: `clip-${Date.now()}`, label: `${selectedClip.label} B`, start: Number((selectedClip.start + firstDuration).toFixed(1)), duration: secondDuration };
    commitProject((current) => ({
      ...current,
      timeline: [
        ...current.timeline.map((clip) => clip.id === selectedClip.id ? { ...clip, label: `${selectedClip.label} A`, duration: firstDuration } : clip),
        secondClip
      ]
    }), "Clip split");
    setSelectedClipId(secondClip.id);
  }

  function duplicateSelectedClip() {
    if (!selectedClip) return;
    const copy = { ...selectedClip, id: `clip-${Date.now()}`, label: `${selectedClip.label} copy`, start: Number((selectedClip.start + selectedClip.duration).toFixed(1)) };
    commitProject((current) => ({ ...current, timeline: [...current.timeline, copy] }), "Clip duplicated");
    setSelectedClipId(copy.id);
  }

  function rippleDeleteSelectedClip() {
    if (!selectedClip) return;
    const deletedStart = selectedClip.start;
    const deletedDuration = selectedClip.duration;
    const deletedTrack = selectedClip.track;
    commitProject((current) => ({
      ...current,
      timeline: current.timeline
        .filter((clip) => clip.id !== selectedClip.id)
        .map((clip) => clip.track === deletedTrack && clip.start > deletedStart ? { ...clip, start: Math.max(0, Number((clip.start - deletedDuration).toFixed(1))) } : clip)
    }), "Ripple deleted clip");
    setSelectedClipId(undefined);
  }

  function nudgeSelectedClip(amount) {
    if (!selectedClip) return;
    updateClip(selectedClip.id, { start: Math.max(0, Number((selectedClip.start + amount).toFixed(1))) });
  }

  function addMarker() {
    const marker = { id: `marker-${Date.now()}`, time: Number(playhead.toFixed(1)), label: `Marker ${project.markers.length + 1}` };
    commitProject((current) => ({ ...current, markers: [...current.markers, marker] }), "Marker added");
  }

  function removeMarker(markerId) {
    commitProject((current) => ({ ...current, markers: current.markers.filter((marker) => marker.id !== markerId) }), "Marker removed");
  }

  function updateExportSetting(key, value) {
    commitProject((current) => ({ ...current, exportSettings: { ...current.exportSettings, [key]: value } }), "Export preset updated");
  }

  function undo() {
    setHistory((items) => {
      if (!items.length) return items;
      const previous = items[items.length - 1];
      setFuture((redoItems) => [project, ...redoItems.slice(0, 24)]);
      setProject(previous);
      setToast("Undo");
      return items.slice(0, -1);
    });
  }

  function redo() {
    setFuture((items) => {
      if (!items.length) return items;
      const next = items[0];
      setHistory((undoItems) => [...undoItems.slice(-24), project]);
      setProject(next);
      setToast("Redo");
      return items.slice(1);
    });
  }

  function applyAiAction(action) {
    if (action === "Generate captions") updateProject({ caption: "This is the moment viewers stop scrolling" });
    if (action === "Find viral hook") commitProject((current) => ({ ...current, notes: ["Strongest hook found between 00:02 and 00:08.", ...current.notes.slice(0, 4)] }), `${action} applied`);
    if (action === "Remove silence") {
      commitProject((current) => ({
        ...current,
        timeline: current.timeline.map((clip) => clip.track === "Audio" ? { ...clip, duration: Math.max(4, clip.duration - 3) } : clip),
        notes: ["Trimmed silence from audio tracks.", ...current.notes.slice(0, 4)]
      }), `${action} applied`);
    }
    if (action === "Make 10 clips") {
      const source = selectedAsset || project.assets.find((asset) => asset.type !== "audio");
      if (source) {
        const clips = Array.from({ length: 10 }, (_, index) => ({
          id: `clip-ai-${Date.now()}-${index}`,
          assetId: source.id,
          label: `Short ${index + 1}`,
          track: "Video",
          start: index * 3,
          duration: 3,
          color: index % 2 ? "#9d8cff" : "#45d7ff"
        }));
        commitProject((current) => ({ ...current, timeline: [...current.timeline, ...clips] }), `${action} applied`);
      }
    }
    if (action === "Clean audio") commitProject((current) => ({ ...current, notes: ["Noise reduction, EQ, and loudness normalization queued.", ...current.notes.slice(0, 4)] }), `${action} applied`);
    if (action === "Brand kit") {
      commitProject((current) => ({
        ...current,
        filters: { exposure: 74, contrast: 66, saturation: 58, warmth: 38 },
        notes: ["Applied Repair high-contrast creator grade.", ...current.notes.slice(0, 4)]
      }), `${action} applied`);
    }
  }

  function togglePlayback() {
    const media = previewAsset?.type === "video" ? videoRef.current : previewAsset?.type === "audio" ? videoRef.current : null;
    if (media) {
      if (media.paused) {
        media.play();
        setIsPlaying(true);
      } else {
        media.pause();
        setIsPlaying(false);
      }
      return;
    }
    setIsPlaying((value) => !value);
  }

  function saveProject() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    setToast("Project saved");
  }

  function resetProject() {
    localStorage.removeItem(STORAGE_KEY);
    setProject(starterProject);
    setSelectedAssetId(starterProject.assets[1].id);
    setSelectedClipId(starterProject.timeline[0].id);
    setPlayhead(0);
    setToast("Project reset");
  }

  function exportManifest() {
    const blob = new Blob([JSON.stringify({ ...project, exportedAt: new Date().toISOString(), preset }, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${slug(project.name)}-project.json`);
    setToast("Project manifest exported");
  }

  function exportFrame() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = preset.width;
    canvas.height = preset.height;
    ctx.fillStyle = "#07090d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const image = imageRef.current;
    if (previewAsset?.type === "image" && image?.complete) drawCover(ctx, image, canvas.width, canvas.height);
    else drawCompositionFrame(ctx, canvas, project, preset, playhead);
    drawCaption(ctx, canvas, project.caption);
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${slug(project.name)}-${preset.label.replace(":", "x")}.png`);
    });
    setToast("Frame exported");
  }

  async function exportVideoPreview() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || typeof MediaRecorder === "undefined") {
      setToast("Video export is not supported in this browser");
      return;
    }
    canvas.width = Math.min(1280, preset.width);
    canvas.height = Math.round(canvas.width * (preset.height / preset.width));
    const stream = canvas.captureStream(project.exportSettings.fps);
    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    recorder.onstop = () => {
      downloadBlob(new Blob(chunks, { type: "video/webm" }), `${slug(project.name)}-preview.webm`);
      setToast("Preview video exported");
    };
    recorder.start();
    setToast("Rendering preview video...");
    const renderLength = Math.min(10, duration);
    const started = performance.now();
    await new Promise((resolve) => {
      function drawFrame(now) {
        const seconds = ((now - started) / 1000) % renderLength;
        drawCompositionFrame(ctx, canvas, project, preset, seconds);
        drawCaption(ctx, canvas, project.caption);
        if ((now - started) / 1000 < renderLength) requestAnimationFrame(drawFrame);
        else resolve();
      }
      requestAnimationFrame(drawFrame);
    });
    recorder.stop();
  }

  return (
    <main className="app-shell">
      <aside className="rail" aria-label="Primary tools">
        <div className="brand-mark">R</div>
        {[[MousePointer2, "Select"], [Scissors, "Cut"], [Captions, "Captions"], [WandSparkles, "AI tools"], [Crop, "Crop"], [Aperture, "Color"], [Music2, "Music"], [Settings2, "Settings"]].map(([Icon, label]) => (
          <IconButton key={label} icon={Icon} label={label} active={activeTool === label} onClick={() => setActiveTool(label)} />
        ))}
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Repair Studio</p>
            <input className="project-title" value={project.name} onChange={(event) => updateProject({ name: event.target.value })} aria-label="Project name" />
          </div>
          <div className="topbar-actions">
            <label className="search-button">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search media, effects, templates" />
            </label>
            <button className="ghost-button" onClick={saveProject}><Save size={17} /> Save</button>
            <button className="ghost-button" onClick={undo} disabled={!history.length}><Undo2 size={17} /> Undo</button>
            <button className="ghost-button" onClick={exportManifest}><Share2 size={17} /> Manifest</button>
            <button className="primary-button" onClick={exportFrame}><Download size={17} /> Export Frame</button>
          </div>
        </header>

        <nav className="workspace-tabs" aria-label="Editor workspaces">
          {workspaces.map((workspace) => (
            <button key={workspace} className={workspaceMode === workspace ? "active" : ""} onClick={() => setWorkspaceMode(workspace)}>
              {workspace}
            </button>
          ))}
          <span><ListVideo size={14} /> Space play/pause · S split · M marker · Delete remove</span>
        </nav>

        <section className="editor-grid">
          <aside className="library-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Media Bin</p>
                <h2>{project.assets.length} assets</h2>
              </div>
              <button className="small-button" onClick={() => fileInputRef.current?.click()}><Upload size={16} /> Import</button>
              <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*,video/*,audio/*" multiple onChange={handleImport} />
            </div>
            <div className="preset-row">
              {presets.map((item) => <button key={item} className={project.preset === item ? "chip active" : "chip"} onClick={() => updateProject({ preset: item })}>{item}</button>)}
            </div>
            <div className="media-list">
              {filteredAssets.map((asset) => (
                <article className={`asset-card ${asset.id === selectedAssetId ? "selected" : ""}`} key={asset.id} onClick={() => setSelectedAssetId(asset.id)}>
                  <div className={`asset-thumb ${asset.accent}`}><AssetIcon type={asset.type} /></div>
                  <div><h3>{asset.title}</h3><p>{asset.meta}</p></div>
                  <button aria-label={`Add ${asset.title}`} title={`Add ${asset.title}`} onClick={(event) => { event.stopPropagation(); addToTimeline(asset); }}><Plus size={16} /></button>
                </article>
              ))}
            </div>
            <section className="ai-panel">
              <div className="ai-heading">
                <Bot size={18} />
                <div><h2>Repair AI Producer</h2><p>Creator automation that updates the actual edit state.</p></div>
              </div>
              <div className="ai-grid">{aiActions.map((action) => <button key={action} onClick={() => applyAiAction(action)}>{action}</button>)}</div>
            </section>
          </aside>

          <section className="stage-panel">
            <div className="stage-toolbar">
              <div className="segmented">
                {[[MonitorPlay, "Preview"], [Layers3, "Layers"], [BrainCircuit, "AI Notes"]].map(([Icon, label]) => (
                  <button key={label} className={activeView === label ? "active" : ""} onClick={() => setActiveView(label)}><Icon size={16} /> {label}</button>
                ))}
              </div>
              <div className="stage-meta"><span><Ratio size={15} /> {preset.label}</span><span><Clock3 size={15} /> {formatTime(duration)}</span></div>
            </div>

            <div className="preview-stage">
              <div className="monitor-row">
                <section className="source-monitor">
                  <div className="monitor-label">Source</div>
                  <div className="source-frame"><PreviewMedia asset={selectedAsset} imageRef={{ current: null }} videoRef={{ current: null }} onEnded={() => {}} /></div>
                  <div className="source-meta"><strong>{selectedAsset?.title || "No asset"}</strong><span>{selectedAsset?.type || "empty"}</span></div>
                </section>
                <section className="program-monitor">
                  <div className="monitor-label">Program</div>
                  <div className="phone-frame" style={{ aspectRatio: preset.ratio }}>
                    {activeView === "Preview" && (
                      <div className="video-scene editable-scene" style={filterStyle}>
                        <PreviewMedia asset={previewAsset} imageRef={imageRef} videoRef={videoRef} onEnded={() => setIsPlaying(false)} />
                        <div className="creator-card"><span>{activeTool.toUpperCase()} · {workspaceMode.toUpperCase()}</span><strong>{previewAsset?.title || "No media selected"}</strong></div>
                        <div className="caption-bubble" contentEditable suppressContentEditableWarning onBlur={(event) => updateProject({ caption: event.currentTarget.textContent || "" })}>{project.caption}</div>
                        <div className="metric-card"><Sparkles size={16} /><span>Creator Score {creatorScore(project)}</span></div>
                      </div>
                    )}
                    {activeView === "Layers" && <LayerList clips={project.timeline} onSelect={(clip) => { setSelectedClipId(clip.id); setSelectedAssetId(clip.assetId); }} />}
                    {activeView === "AI Notes" && <div className="stage-list notes">{project.notes.map((note, index) => <p key={`${note}-${index}`}><CheckCircle2 size={16} /> {note}</p>)}</div>}
                  </div>
                </section>
              </div>
            </div>

            <div className="marker-strip">
              {project.markers.map((marker) => (
                <button key={marker.id} style={{ left: `${Math.min(96, (marker.time / duration) * 100)}%` }} onClick={() => setPlayhead(marker.time)}><MapPin size={13} />{marker.label}</button>
              ))}
            </div>

            <div className="transport">
              <button onClick={splitSelectedClip} title="Split selected clip"><SplitSquareHorizontal size={18} /></button>
              <button onClick={() => { videoRef.current?.pause(); setIsPlaying(false); }} title="Stop"><Square size={18} /></button>
              <button className="play" onClick={togglePlayback} title="Play or pause">{isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}</button>
              <button onClick={addMarker} title="Add marker"><MapPin size={18} /></button>
              <button onClick={() => applyAiAction("Find viral hook")} title="AI action"><Zap size={18} /></button>
            </div>
          </section>

          <Inspector
            project={project}
            preset={preset}
            selectedAsset={selectedAsset}
            selectedClip={selectedClip}
            workspaceMode={workspaceMode}
            history={history}
            future={future}
            onFilter={updateFilters}
            onProject={updateProject}
            onClip={updateClip}
            onSplit={splitSelectedClip}
            onCopy={duplicateSelectedClip}
            onRipple={rippleDeleteSelectedClip}
            onNudge={nudgeSelectedClip}
            onRedo={redo}
            onAi={applyAiAction}
            onExport={exportVideoPreview}
            onExportSetting={updateExportSetting}
            onAddMarker={addMarker}
            onRemoveMarker={removeMarker}
            onSeek={setPlayhead}
          />
        </section>

        <section className="timeline-panel">
          <div className="timeline-top">
            <div><p className="eyebrow">Timeline</p><h2>Multi-platform master edit</h2></div>
            <div className="timeline-stats">
              <span>{project.timeline.filter((clip) => clip.track === "Video").length} video</span>
              <span>{project.timeline.filter((clip) => clip.track === "Audio").length} audio</span>
              <span>{project.timeline.filter((clip) => clip.track === "Captions").length} captions</span>
              <span>{toast}</span>
            </div>
          </div>
          <div className="ruler">{Array.from({ length: 6 }, (_, index) => <span key={index}>{formatTime(index * Math.ceil(duration / 5))}</span>)}</div>
          <div className="tracks">
            {["Video", "Captions", "Audio"].map((track) => (
              <Track
                key={track}
                name={track}
                duration={duration}
                playhead={playhead}
                items={project.timeline.filter((clip) => clip.track === track)}
                compact={track !== "Video"}
                selectedClipId={selectedClipId}
                onSelect={(clip) => { setSelectedClipId(clip.id); setSelectedAssetId(clip.assetId); setPlayhead(clip.start); }}
                onRemove={removeClip}
              />
            ))}
          </div>
        </section>
      </section>
      <canvas ref={canvasRef} className="visually-hidden" />
    </main>
  );
}

function Inspector({ project, selectedAsset, selectedClip, workspaceMode, future, onFilter, onProject, onClip, onSplit, onCopy, onRipple, onNudge, onRedo, onAi, onExport, onExportSetting, onAddMarker, onRemoveMarker, onSeek }) {
  return (
    <aside className="inspector-panel">
      <div className="panel-header"><div><p className="eyebrow">Inspector</p><h2>{selectedAsset?.title || "Selected Clip"}</h2></div><ChevronDown size={18} /></div>
      <div className="score-card"><Stars size={20} /><div><strong>Creator Score {creatorScore(project)}</strong><p>{workspaceMode === "Export" ? "Export settings are ready for creator delivery." : "Edit, color, audio, captions, and export are connected."}</p></div></div>
      <div className="connection-card"><span className={isSupabaseConfigured ? "status-dot online" : "status-dot"} /><div><strong>Supabase {isSupabaseConfigured ? "configured" : "not configured"}</strong><p>Client config is loaded. Server-only keys remain outside browser code.</p></div></div>

      {workspaceMode === "Export" ? (
        <div className="export-editor">
          <h3>Export Settings</h3>
          <SelectField label="Format" value={project.exportSettings.format} values={["MP4 H.264", "WebM VP9", "ProRes Proxy"]} onChange={(value) => onExportSetting("format", value)} />
          <SelectField label="Quality" value={project.exportSettings.quality} values={["Draft", "High", "Master"]} onChange={(value) => onExportSetting("quality", value)} />
          <label><span>FPS</span><input type="number" min="24" max="60" value={project.exportSettings.fps} onChange={(event) => onExportSetting("fps", Number(event.target.value))} /></label>
          <SelectField label="Audio" value={project.exportSettings.audio} values={["AAC 192kbps", "AAC 320kbps", "WAV 48kHz"]} onChange={(value) => onExportSetting("audio", value)} />
          <button className="wide-primary" onClick={onExport}><Download size={17} /> Render WebM Preview</button>
        </div>
      ) : (
        <>
          <Control label="Exposure" value={project.filters.exposure} onChange={(value) => onFilter("exposure", value)} />
          <Control label="Contrast" value={project.filters.contrast} onChange={(value) => onFilter("contrast", value)} />
          <Control label="Saturation" value={project.filters.saturation} onChange={(value) => onFilter("saturation", value)} />
          <Control label="Warmth" value={project.filters.warmth} onChange={(value) => onFilter("warmth", value)} />
          <label className="caption-editor"><span>Caption</span><textarea aria-label="Caption" value={project.caption} onChange={(event) => onProject({ caption: event.target.value })} /></label>
          <div className="clip-editor">
            <div className="clip-editor-top"><h3>Clip Edit</h3><span>{selectedClip ? selectedClip.track : "No clip"}</span></div>
            <label><span>Name</span><input disabled={!selectedClip} value={selectedClip?.label || ""} onChange={(event) => onClip(selectedClip.id, { label: event.target.value })} /></label>
            <label><span>Start</span><input disabled={!selectedClip} type="number" min="0" step="0.1" value={selectedClip?.start ?? 0} onChange={(event) => onClip(selectedClip.id, { start: Number(event.target.value) })} /></label>
            <label><span>Duration</span><input disabled={!selectedClip} type="number" min="0.5" step="0.1" value={selectedClip?.duration ?? 0} onChange={(event) => onClip(selectedClip.id, { duration: Number(event.target.value) })} /></label>
            <div className="clip-actions">
              <button onClick={onSplit} disabled={!selectedClip}><Scissors size={15} /> Split</button>
              <button onClick={onCopy} disabled={!selectedClip}><Copy size={15} /> Copy</button>
              <button onClick={() => onNudge(-0.5)} disabled={!selectedClip}>-0.5s</button>
              <button onClick={() => onNudge(0.5)} disabled={!selectedClip}>+0.5s</button>
              <button onClick={onRipple} disabled={!selectedClip} className="danger-action"><Trash2 size={15} /> Ripple</button>
              <button onClick={onRedo} disabled={!future.length}>Redo</button>
            </div>
          </div>
          <div className="tool-section">
            <h3>Smart Effects</h3>
            <button onClick={() => onAi("Generate captions")}><Subtitles size={17} /> Kinetic captions</button>
            <button onClick={() => onAi("Clean audio")}><Mic2 size={17} /> Studio voice clean</button>
            <button onClick={() => onAi("Make 10 clips")}><Clapperboard size={17} /> Auto b-roll finder</button>
            <button onClick={() => onAi("Brand kit")}><SlidersHorizontal size={17} /> Brand color grade</button>
            <button onClick={onExport}><Download size={17} /> Export WebM preview</button>
          </div>
        </>
      )}

      <div className="marker-list">
        <div className="clip-editor-top"><h3>Markers</h3><button onClick={onAddMarker}><Plus size={13} /> Add</button></div>
        {project.markers.map((marker) => (
          <button key={marker.id} onClick={() => onSeek(marker.time)}><MapPin size={14} /><span>{formatTime(marker.time)}</span><strong>{marker.label}</strong><Trash2 size={13} onClick={(event) => { event.stopPropagation(); onRemoveMarker(marker.id); }} /></button>
        ))}
      </div>
    </aside>
  );
}

function SelectField({ label, value, values, onChange }) {
  return <label><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{values.map((item) => <option key={item}>{item}</option>)}</select></label>;
}

function IconButton({ icon: Icon, label, active, onClick }) {
  return <button className={`icon-button ${active ? "is-active" : ""}`} aria-label={label} title={label} onClick={onClick}><Icon size={18} strokeWidth={2.2} /></button>;
}

function AssetIcon({ type }) {
  if (type === "image") return <Image size={18} />;
  if (type === "audio") return <AudioLines size={18} />;
  if (type === "text") return <TextCursorInput size={18} />;
  return <Film size={18} />;
}

function PreviewMedia({ asset, imageRef, videoRef, onEnded }) {
  if (!asset) return <div className="empty-stage">Import media to start editing</div>;
  if (asset.type === "image" && asset.src) return <img ref={imageRef} className="preview-media" src={asset.src} alt={asset.title} crossOrigin="anonymous" />;
  if (asset.type === "video" && asset.src) return <video ref={videoRef} className="preview-media" src={asset.src} controls={false} playsInline onEnded={onEnded} />;
  if (asset.type === "audio" && asset.src) return <div className="audio-preview"><AudioLines size={48} /><strong>{asset.title}</strong><audio ref={videoRef} src={asset.src} onEnded={onEnded} /></div>;
  return <div className="generated-preview"><div className="scene-orbit one" /><div className="scene-orbit two" /><Film size={54} /><strong>{asset.title}</strong><p>{asset.meta}</p></div>;
}

function LayerList({ clips, onSelect }) {
  return <div className="stage-list">{clips.map((clip) => <button key={clip.id} onClick={() => onSelect(clip)}><Layers3 size={16} /><span>{clip.track}</span><strong>{clip.label}</strong></button>)}</div>;
}

function Control({ label, value, onChange }) {
  return <label className="control"><span>{label}</span><input type="range" min="0" max="100" value={value} onChange={(event) => onChange(event.target.value)} /><b>{value}</b></label>;
}

function Track({ name, items, compact, duration, playhead, selectedClipId, onSelect, onRemove }) {
  return (
    <div className={`track ${compact ? "compact" : ""}`}>
      <span className="track-name">{name}</span>
      <div className="track-lane">
        {name === "Video" && <span className="playhead" style={{ left: `${Math.min(100, (playhead / duration) * 100)}%` }} />}
        {items.length === 0 && <span className="empty-track">Drop or add {name.toLowerCase()} clips</span>}
        {items.map((item) => (
          <div className={`clip ${selectedClipId === item.id ? "selected" : ""}`} style={{ marginLeft: `${(item.start / duration) * 6}%`, width: `${Math.max(8, (item.duration / duration) * 100)}%`, "--clip-color": item.color }} key={`${name}-${item.id}`} title={`${item.label} - ${formatTime(item.duration)}`} onClick={() => onSelect(item)}>
            <span>{item.label}</span>
            <button onClick={(event) => { event.stopPropagation(); onRemove(item.id); }} aria-label={`Remove ${item.label}`} title={`Remove ${item.label}`}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60).toString().padStart(2, "0");
  const rest = (safe % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function creatorScore(project) {
  return Math.min(99, 58 + Math.min(18, project.assets.length * 3) + Math.min(16, project.timeline.length * 2) + (project.caption.length > 20 ? 8 : 2));
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "repair-studio";
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function drawCover(ctx, image, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const x = (width - image.naturalWidth * scale) / 2;
  const y = (height - image.naturalHeight * scale) / 2;
  ctx.drawImage(image, x, y, image.naturalWidth * scale, image.naturalHeight * scale);
}

function drawCaption(ctx, canvas, caption) {
  ctx.fillStyle = "rgba(7, 9, 13, 0.72)";
  roundRect(ctx, canvas.width * 0.08, canvas.height * 0.72, canvas.width * 0.84, canvas.height * 0.13, 28);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.max(26, canvas.width * 0.04)}px system-ui`;
  ctx.textAlign = "center";
  wrapText(ctx, caption, canvas.width / 2, canvas.height * 0.79, canvas.width * 0.76, Math.max(36, canvas.width * 0.052));
}

function drawCompositionFrame(ctx, canvas, project, preset, seconds) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#06131a");
  gradient.addColorStop(0.5, "#11141a");
  gradient.addColorStop(1, "#20381f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(canvas.width * 0.08, canvas.height * 0.12, canvas.width * 0.84, canvas.height * 0.5);
  ctx.fillStyle = "#f6f8fb";
  ctx.font = `900 ${Math.max(32, canvas.width * 0.055)}px system-ui`;
  ctx.textAlign = "center";
  ctx.fillText(project.name, canvas.width / 2, canvas.height * 0.34);
  ctx.fillStyle = "#a3ff8f";
  ctx.font = `800 ${Math.max(18, canvas.width * 0.024)}px system-ui`;
  ctx.fillText(`${preset.label} - ${formatTime(seconds)}`, canvas.width / 2, canvas.height * 0.93);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let offset = 0;
  words.forEach((word, index) => {
    const testLine = `${line}${word} `;
    if (ctx.measureText(testLine).width > maxWidth && index > 0) {
      ctx.fillText(line, x, y + offset);
      line = `${word} `;
      offset += lineHeight;
    } else {
      line = testLine;
    }
  });
  ctx.fillText(line, x, y + offset);
}

createRoot(document.getElementById("root")).render(<App />);
