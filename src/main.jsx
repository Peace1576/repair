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
  Upload,
  WandSparkles,
  Zap
} from "lucide-react";
import { isSupabaseConfigured } from "./lib/supabase";
import "./styles.css";

const STORAGE_KEY = "rovik-studio-project-v1";

const presetMap = {
  "YouTube 16:9": { ratio: "16 / 9", label: "16:9", width: 1920, height: 1080 },
  "TikTok 9:16": { ratio: "9 / 16", label: "9:16", width: 1080, height: 1920 },
  "Shorts 9:16": { ratio: "9 / 16", label: "9:16", width: 1080, height: 1920 },
  "Stream 16:9": { ratio: "16 / 9", label: "16:9", width: 1920, height: 1080 },
  "Square 1:1": { ratio: "1 / 1", label: "1:1", width: 1080, height: 1080 }
};

const demoAssets = [
  {
    id: "demo-video",
    title: "Cold open",
    meta: "Demo video layer",
    type: "video",
    accent: "cyan",
    src: "",
    duration: 13
  },
  {
    id: "demo-image",
    title: "Product shot",
    meta: "Editable image layer",
    type: "image",
    accent: "lime",
    src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85",
    duration: 8
  },
  {
    id: "demo-audio",
    title: "Voiceover",
    meta: "Audio track",
    type: "audio",
    accent: "rose",
    src: "",
    duration: 20
  },
  {
    id: "demo-caption",
    title: "Hook captions",
    meta: "Auto styled text",
    type: "text",
    accent: "amber",
    src: "",
    duration: 6
  }
];

const starterProject = {
  name: "Launch Episode",
  preset: "TikTok 9:16",
  caption: "POV: your editor finds the viral moment first",
  filters: {
    exposure: 68,
    contrast: 54,
    saturation: 62,
    warmth: 42
  },
  assets: demoAssets,
  timeline: [
    { id: "clip-1", assetId: "demo-image", label: "Hook", track: "Video", start: 0, duration: 8, color: "#45d7ff" },
    { id: "clip-2", assetId: "demo-caption", label: "Captions", track: "Captions", start: 0, duration: 6, color: "#f4b860" },
    { id: "clip-3", assetId: "demo-audio", label: "Voice", track: "Audio", start: 0, duration: 20, color: "#ff6b9d" }
  ],
  notes: [
    "AI Producer is ready.",
    "Import creator footage, add it to the timeline, tune the look, then export."
  ]
};

const presets = Object.keys(presetMap);
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
      assets: saved.assets?.length ? saved.assets : starterProject.assets,
      timeline: saved.timeline?.length ? saved.timeline : starterProject.timeline,
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
  const [selectedAssetId, setSelectedAssetId] = useState(project.assets[1]?.id);
  const [selectedClipId, setSelectedClipId] = useState(project.timeline[0]?.id);
  const [activeTool, setActiveTool] = useState("Select");
  const [activeView, setActiveView] = useState("Preview");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("Project loaded");

  const selectedAsset = useMemo(
    () => project.assets.find((asset) => asset.id === selectedAssetId) || project.assets[0],
    [project.assets, selectedAssetId]
  );
  const selectedClip = useMemo(
    () => project.timeline.find((clip) => clip.id === selectedClipId),
    [project.timeline, selectedClipId]
  );

  const filteredAssets = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    if (!lowered) return project.assets;
    return project.assets.filter((asset) => `${asset.title} ${asset.meta} ${asset.type}`.toLowerCase().includes(lowered));
  }, [project.assets, query]);

  const preset = presetMap[project.preset] || presetMap["TikTok 9:16"];
  const duration = Math.max(30, ...project.timeline.map((clip) => clip.start + clip.duration));
  const activeClip = useMemo(
    () => project.timeline.find((clip) => clip.track === "Video" && playhead >= clip.start && playhead < clip.start + clip.duration),
    [project.timeline, playhead]
  );
  const previewAsset = useMemo(
    () => project.assets.find((asset) => asset.id === activeClip?.assetId) || selectedAsset,
    [activeClip, project.assets, selectedAsset]
  );
  const filterStyle = {
    filter: `brightness(${project.filters.exposure + 35}%) contrast(${project.filters.contrast + 55}%) saturate(${project.filters.saturation + 45}%) sepia(${Math.max(0, project.filters.warmth - 50) * 0.7}%)`
  };

  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setToast("Autosaved locally");
    }, 500);
    return () => window.clearTimeout(saveTimer);
  }, [project]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = window.setInterval(() => {
      setPlayhead((current) => {
        const next = current + 0.1;
        return next >= duration ? 0 : next;
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [duration, isPlaying]);

  useEffect(() => {
    return () => {
      project.assets.forEach((asset) => {
        if (asset.src?.startsWith("blob:")) URL.revokeObjectURL(asset.src);
      });
    };
  }, []);

  function updateProject(patch) {
    setProject((current) => ({ ...current, ...patch }));
  }

  function updateFilters(key, value) {
    setProject((current) => ({
      ...current,
      filters: { ...current.filters, [key]: Number(value) }
    }));
  }

  function handleImport(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const nextAssets = files.map((file) => {
      const type = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("audio/")
          ? "audio"
          : file.type.startsWith("video/")
            ? "video"
            : "file";
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

    setProject((current) => ({ ...current, assets: [...nextAssets, ...current.assets] }));
    setSelectedAssetId(nextAssets[0].id);
    setToast(`Imported ${nextAssets.length} asset${nextAssets.length > 1 ? "s" : ""}`);
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
    setProject((current) => ({ ...current, timeline: [...current.timeline, clip] }));
    setSelectedClipId(clip.id);
    setToast(`Added ${asset.title} to ${track}`);
  }

  function removeClip(clipId) {
    setProject((current) => ({ ...current, timeline: current.timeline.filter((clip) => clip.id !== clipId) }));
    if (selectedClipId === clipId) setSelectedClipId(undefined);
    setToast("Clip removed");
  }

  function updateClip(clipId, patch) {
    setProject((current) => ({
      ...current,
      timeline: current.timeline.map((clip) => clip.id === clipId ? { ...clip, ...patch } : clip)
    }));
  }

  function splitSelectedClip() {
    if (!selectedClip || selectedClip.duration <= 1) return;
    const relative = playhead > selectedClip.start && playhead < selectedClip.start + selectedClip.duration
      ? playhead - selectedClip.start
      : selectedClip.duration / 2;
    const firstDuration = Math.max(0.5, Number(relative.toFixed(1)));
    const secondDuration = Math.max(0.5, Number((selectedClip.duration - firstDuration).toFixed(1)));
    const secondClip = {
      ...selectedClip,
      id: `clip-${Date.now()}`,
      label: `${selectedClip.label} B`,
      start: Number((selectedClip.start + firstDuration).toFixed(1)),
      duration: secondDuration
    };
    setProject((current) => ({
      ...current,
      timeline: [
        ...current.timeline.map((clip) => clip.id === selectedClip.id ? { ...clip, label: `${selectedClip.label} A`, duration: firstDuration } : clip),
        secondClip
      ]
    }));
    setSelectedClipId(secondClip.id);
    setToast("Clip split");
  }

  function duplicateSelectedClip() {
    if (!selectedClip) return;
    const copy = {
      ...selectedClip,
      id: `clip-${Date.now()}`,
      label: `${selectedClip.label} copy`,
      start: Number((selectedClip.start + selectedClip.duration).toFixed(1))
    };
    setProject((current) => ({ ...current, timeline: [...current.timeline, copy] }));
    setSelectedClipId(copy.id);
    setToast("Clip duplicated");
  }

  function applyAiAction(action) {
    if (action === "Generate captions") {
      updateProject({ caption: "This is the moment viewers stop scrolling" });
    }

    if (action === "Find viral hook") {
      setProject((current) => ({
        ...current,
        notes: ["Strongest hook found between 00:02 and 00:08.", ...current.notes.slice(0, 4)]
      }));
    }

    if (action === "Remove silence") {
      setProject((current) => ({
        ...current,
        timeline: current.timeline.map((clip) => clip.track === "Audio" ? { ...clip, duration: Math.max(4, clip.duration - 3) } : clip),
        notes: ["Trimmed silence from audio tracks.", ...current.notes.slice(0, 4)]
      }));
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
        setProject((current) => ({ ...current, timeline: [...current.timeline, ...clips] }));
      }
    }

    if (action === "Clean audio") {
      setProject((current) => ({ ...current, notes: ["Noise reduction, EQ, and loudness normalization queued.", ...current.notes.slice(0, 4)] }));
    }

    if (action === "Brand kit") {
      setProject((current) => ({
        ...current,
        filters: { exposure: 74, contrast: 66, saturation: 58, warmth: 38 },
        notes: ["Applied Rovik high-contrast creator grade.", ...current.notes.slice(0, 4)]
      }));
    }

    setToast(`${action} applied`);
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
    setToast("Project reset");
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
    const stream = canvas.captureStream(30);
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
        if ((now - started) / 1000 < renderLength) {
          requestAnimationFrame(drawFrame);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(drawFrame);
    });

    recorder.stop();
  }

  function exportManifest() {
    const blob = new Blob([JSON.stringify({ ...project, exportedAt: new Date().toISOString(), preset }, null, 2)], {
      type: "application/json"
    });
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
    if (selectedAsset?.type === "image" && image?.complete) {
      drawCover(ctx, image, canvas.width, canvas.height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#45d7ff");
      gradient.addColorStop(0.48, "#11141a");
      gradient.addColorStop(1, "#a3ff8f");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = "rgba(7, 9, 13, 0.62)";
    roundRect(ctx, canvas.width * 0.08, canvas.height * 0.72, canvas.width * 0.84, canvas.height * 0.12, 28);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${Math.max(36, canvas.width * 0.045)}px system-ui`;
    ctx.textAlign = "center";
    wrapText(ctx, project.caption, canvas.width / 2, canvas.height * 0.79, canvas.width * 0.76, Math.max(44, canvas.width * 0.055));

    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${slug(project.name)}-${preset.label.replace(":", "x")}.png`);
    });
    setToast("Frame exported");
  }

  return (
    <main className="app-shell">
      <aside className="rail" aria-label="Primary tools">
        <div className="brand-mark">R</div>
        {[
          [MousePointer2, "Select"],
          [Scissors, "Cut"],
          [Captions, "Captions"],
          [WandSparkles, "AI tools"],
          [Crop, "Crop"],
          [Aperture, "Color"],
          [Music2, "Music"],
          [Settings2, "Settings"]
        ].map(([Icon, label]) => (
          <IconButton key={label} icon={Icon} label={label} active={activeTool === label} onClick={() => setActiveTool(label)} />
        ))}
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Rovik Studio</p>
            <input
              className="project-title"
              value={project.name}
              onChange={(event) => updateProject({ name: event.target.value })}
              aria-label="Project name"
            />
          </div>
          <div className="topbar-actions">
            <label className="search-button">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search media, effects, templates" />
            </label>
            <button className="ghost-button" onClick={saveProject}><Save size={17} /> Save</button>
            <button className="ghost-button" onClick={exportManifest}><Share2 size={17} /> Manifest</button>
            <button className="primary-button" onClick={exportFrame}><Download size={17} /> Export Frame</button>
          </div>
        </header>

        <section className="editor-grid">
          <aside className="library-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Project</p>
                <h2>{project.assets.length} assets</h2>
              </div>
              <button className="small-button" onClick={() => fileInputRef.current?.click()}><Upload size={16} /> Import</button>
              <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*,video/*,audio/*" multiple onChange={handleImport} />
            </div>

            <div className="preset-row">
              {presets.map((item) => (
                <button key={item} className={project.preset === item ? "chip active" : "chip"} onClick={() => updateProject({ preset: item })}>
                  {item}
                </button>
              ))}
            </div>

            <div className="media-list">
              {filteredAssets.map((asset) => (
                <article className={`asset-card ${asset.id === selectedAssetId ? "selected" : ""}`} key={asset.id} onClick={() => setSelectedAssetId(asset.id)}>
                  <div className={`asset-thumb ${asset.accent}`}>
                    <AssetIcon type={asset.type} />
                  </div>
                  <div>
                    <h3>{asset.title}</h3>
                    <p>{asset.meta}</p>
                  </div>
                  <button aria-label={`Add ${asset.title}`} title={`Add ${asset.title}`} onClick={(event) => { event.stopPropagation(); addToTimeline(asset); }}>
                    <Plus size={16} />
                  </button>
                </article>
              ))}
            </div>

            <section className="ai-panel">
              <div className="ai-heading">
                <Bot size={18} />
                <div>
                  <h2>Rovik AI Producer</h2>
                  <p>Automation actions operate on the current project state.</p>
                </div>
              </div>
              <div className="ai-grid">
                {aiActions.map((action) => <button key={action} onClick={() => applyAiAction(action)}>{action}</button>)}
              </div>
            </section>
          </aside>

          <section className="stage-panel">
            <div className="stage-toolbar">
              <div className="segmented">
                {[
                  [MonitorPlay, "Preview"],
                  [Layers3, "Layers"],
                  [BrainCircuit, "AI Notes"]
                ].map(([Icon, label]) => (
                  <button key={label} className={activeView === label ? "active" : ""} onClick={() => setActiveView(label)}>
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </div>
              <div className="stage-meta">
                <span><Ratio size={15} /> {preset.label}</span>
                <span><Clock3 size={15} /> {formatTime(duration)}</span>
              </div>
            </div>

            <div className="preview-stage">
              <div className="phone-frame" style={{ aspectRatio: preset.ratio }}>
                {activeView === "Preview" && (
                  <div className="video-scene editable-scene" style={filterStyle}>
                    <PreviewMedia asset={previewAsset} imageRef={imageRef} videoRef={videoRef} onEnded={() => setIsPlaying(false)} />
                    <div className="creator-card">
                      <span>{activeTool.toUpperCase()}</span>
                      <strong>{previewAsset?.title || "No media selected"}</strong>
                    </div>
                    <div className="caption-bubble" contentEditable suppressContentEditableWarning onBlur={(event) => updateProject({ caption: event.currentTarget.textContent || "" })}>
                      {project.caption}
                    </div>
                    <div className="metric-card">
                      <Sparkles size={16} />
                      <span>Creator Score {creatorScore(project)}</span>
                    </div>
                  </div>
                )}

                {activeView === "Layers" && (
                  <div className="stage-list">
                    {project.timeline.map((clip) => (
                      <button key={clip.id} onClick={() => setSelectedAssetId(clip.assetId)}>
                        <Layers3 size={16} />
                        <span>{clip.track}</span>
                        <strong>{clip.label}</strong>
                      </button>
                    ))}
                  </div>
                )}

                {activeView === "AI Notes" && (
                  <div className="stage-list notes">
                    {project.notes.map((note, index) => (
                      <p key={`${note}-${index}`}><CheckCircle2 size={16} /> {note}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="transport">
              <button onClick={splitSelectedClip} title="Split selected clip"><SplitSquareHorizontal size={18} /></button>
              <button onClick={() => { videoRef.current?.pause(); setIsPlaying(false); }} title="Stop"><Square size={18} /></button>
              <button className="play" onClick={togglePlayback} title="Play or pause">
                {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
              </button>
              <button onClick={resetProject} title="Reset"><RotateCcw size={18} /></button>
              <button onClick={() => applyAiAction("Find viral hook")} title="AI action"><Zap size={18} /></button>
            </div>
          </section>

          <aside className="inspector-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Inspector</p>
                <h2>{selectedAsset?.title || "Selected Clip"}</h2>
              </div>
              <ChevronDown size={18} />
            </div>

            <div className="score-card">
              <Stars size={20} />
              <div>
                <strong>Creator Score {creatorScore(project)}</strong>
                <p>{selectedAsset?.type === "image" ? "Image filters and export frame are active." : "Timeline, captions, and export state are ready."}</p>
              </div>
            </div>

            <div className="connection-card">
              <span className={isSupabaseConfigured ? "status-dot online" : "status-dot"} />
              <div>
                <strong>Supabase {isSupabaseConfigured ? "configured" : "not configured"}</strong>
                <p>Client config is loaded. Server-only keys remain outside browser code.</p>
              </div>
            </div>

            <Control label="Exposure" value={project.filters.exposure} onChange={(value) => updateFilters("exposure", value)} />
            <Control label="Contrast" value={project.filters.contrast} onChange={(value) => updateFilters("contrast", value)} />
            <Control label="Saturation" value={project.filters.saturation} onChange={(value) => updateFilters("saturation", value)} />
            <Control label="Warmth" value={project.filters.warmth} onChange={(value) => updateFilters("warmth", value)} />

            <label className="caption-editor">
              <span>Caption</span>
              <textarea aria-label="Caption" value={project.caption} onChange={(event) => updateProject({ caption: event.target.value })} />
            </label>

            <div className="clip-editor">
              <div className="clip-editor-top">
                <h3>Clip Edit</h3>
                <span>{selectedClip ? selectedClip.track : "No clip"}</span>
              </div>
              <label>
                <span>Name</span>
                <input disabled={!selectedClip} value={selectedClip?.label || ""} onChange={(event) => updateClip(selectedClip.id, { label: event.target.value })} />
              </label>
              <label>
                <span>Start</span>
                <input disabled={!selectedClip} type="number" min="0" step="0.1" value={selectedClip?.start ?? 0} onChange={(event) => updateClip(selectedClip.id, { start: Number(event.target.value) })} />
              </label>
              <label>
                <span>Duration</span>
                <input disabled={!selectedClip} type="number" min="0.5" step="0.1" value={selectedClip?.duration ?? 0} onChange={(event) => updateClip(selectedClip.id, { duration: Number(event.target.value) })} />
              </label>
              <div className="clip-actions">
                <button onClick={splitSelectedClip} disabled={!selectedClip}><Scissors size={15} /> Split</button>
                <button onClick={duplicateSelectedClip} disabled={!selectedClip}><Copy size={15} /> Copy</button>
              </div>
            </div>

            <div className="tool-section">
              <h3>Smart Effects</h3>
              <button onClick={() => applyAiAction("Generate captions")}><Subtitles size={17} /> Kinetic captions</button>
              <button onClick={() => applyAiAction("Clean audio")}><Mic2 size={17} /> Studio voice clean</button>
              <button onClick={() => applyAiAction("Make 10 clips")}><Clapperboard size={17} /> Auto b-roll finder</button>
              <button onClick={() => applyAiAction("Brand kit")}><SlidersHorizontal size={17} /> Brand color grade</button>
              <button onClick={exportVideoPreview}><Download size={17} /> Export WebM preview</button>
            </div>
          </aside>
        </section>

        <section className="timeline-panel">
          <div className="timeline-top">
            <div>
              <p className="eyebrow">Timeline</p>
              <h2>Multi-platform master edit</h2>
            </div>
            <div className="timeline-stats">
              <span>{project.timeline.filter((clip) => clip.track === "Video").length} video</span>
              <span>{project.timeline.filter((clip) => clip.track === "Audio").length} audio</span>
              <span>{project.timeline.filter((clip) => clip.track === "Captions").length} captions</span>
              <span>{toast}</span>
            </div>
          </div>
          <div className="ruler">
            {Array.from({ length: 6 }, (_, index) => <span key={index}>{formatTime(index * Math.ceil(duration / 5))}</span>)}
          </div>
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
                onSelect={(clip) => {
                  setSelectedClipId(clip.id);
                  setSelectedAssetId(clip.assetId);
                  setPlayhead(clip.start);
                }}
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

function IconButton({ icon: Icon, label, active, onClick }) {
  return (
    <button className={`icon-button ${active ? "is-active" : ""}`} aria-label={label} title={label} onClick={onClick}>
      <Icon size={18} strokeWidth={2.2} />
    </button>
  );
}

function AssetIcon({ type }) {
  if (type === "image") return <Image size={18} />;
  if (type === "audio") return <AudioLines size={18} />;
  if (type === "text") return <TextCursorInput size={18} />;
  return <Film size={18} />;
}

function PreviewMedia({ asset, imageRef, videoRef, onEnded }) {
  if (!asset) return <div className="empty-stage">Import media to start editing</div>;

  if (asset.type === "image" && asset.src) {
    return <img ref={imageRef} className="preview-media" src={asset.src} alt={asset.title} crossOrigin="anonymous" />;
  }

  if (asset.type === "video" && asset.src) {
    return <video ref={videoRef} className="preview-media" src={asset.src} controls={false} playsInline onEnded={onEnded} />;
  }

  if (asset.type === "audio" && asset.src) {
    return (
      <div className="audio-preview">
        <AudioLines size={48} />
        <strong>{asset.title}</strong>
        <audio ref={videoRef} src={asset.src} onEnded={onEnded} />
      </div>
    );
  }

  return (
    <div className="generated-preview">
      <div className="scene-orbit one" />
      <div className="scene-orbit two" />
      <Film size={54} />
      <strong>{asset.title}</strong>
      <p>{asset.meta}</p>
    </div>
  );
}

function Control({ label, value, onChange }) {
  return (
    <label className="control">
      <span>{label}</span>
      <input type="range" min="0" max="100" value={value} onChange={(event) => onChange(event.target.value)} />
      <b>{value}</b>
    </label>
  );
}

function Track({ name, items, compact, duration, playhead, selectedClipId, onSelect, onRemove }) {
  return (
    <div className={`track ${compact ? "compact" : ""}`}>
      <span className="track-name">{name}</span>
      <div className="track-lane">
        {name === "Video" && <span className="playhead" style={{ left: `${Math.min(100, (playhead / duration) * 100)}%` }} />}
        {items.length === 0 && <span className="empty-track">Drop or add {name.toLowerCase()} clips</span>}
        {items.map((item) => (
          <div
            className={`clip ${selectedClipId === item.id ? "selected" : ""}`}
            style={{
              marginLeft: `${(item.start / duration) * 6}%`,
              width: `${Math.max(8, (item.duration / duration) * 100)}%`,
              "--clip-color": item.color
            }}
            key={`${name}-${item.id}`}
            title={`${item.label} - ${formatTime(item.duration)}`}
            onClick={() => onSelect(item)}
          >
            <span>{item.label}</span>
            <button onClick={(event) => { event.stopPropagation(); onRemove(item.id); }} aria-label={`Remove ${item.label}`} title={`Remove ${item.label}`}>
              <Trash2 size={13} />
            </button>
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
  const base = 58;
  const assetScore = Math.min(18, project.assets.length * 3);
  const timelineScore = Math.min(16, project.timeline.length * 2);
  const captionScore = project.caption.length > 20 ? 8 : 2;
  return Math.min(99, base + assetScore + timelineScore + captionScore);
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "rovik-studio";
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
  ctx.fillStyle = "rgba(7, 9, 13, 0.72)";
  roundRect(ctx, canvas.width * 0.08, canvas.height * 0.72, canvas.width * 0.84, canvas.height * 0.13, 28);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.max(26, canvas.width * 0.04)}px system-ui`;
  wrapText(ctx, project.caption, canvas.width / 2, canvas.height * 0.79, canvas.width * 0.76, Math.max(36, canvas.width * 0.052));
  ctx.fillStyle = "#a3ff8f";
  ctx.font = `800 ${Math.max(18, canvas.width * 0.024)}px system-ui`;
  ctx.fillText(`${preset.label} - ${formatTime(seconds)}`, canvas.width / 2, canvas.height * 0.93);
}

createRoot(document.getElementById("root")).render(<App />);
