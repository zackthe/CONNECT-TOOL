import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Settings, 
  Database, 
  Hash, 
  Layers, 
  Copy, 
  Download, 
  Trash2, 
  Check, 
  ChevronRight,
  Monitor,
  Shield,
  Activity,
  Plus,
  Save,
  History,
  Search,
  FileText,
  X,
  Edit3,
  Layout,
  ShieldAlert,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants & Types ---

interface SessionConfig {
  name: string;
  size: number;
}

interface EntityConfig {
  id: string;
  name: string;
  defaultSize: number;
  sessions: SessionConfig[];
}

const DEFAULT_ENTITIES: EntityConfig[] = [
  { 
    id: 'ECM4', 
    name: 'ECM4', 
    defaultSize: 488,
    sessions: [
      { name: "ECM4_connect_4", size: 488 },
      { name: "ECM4_connect_5", size: 488 },
      { name: "ECM4_Connect_7", size: 488 },
      { name: "ECM4_Connect_8", size: 488 }
    ] 
  },
  { 
    id: 'ECM7', 
    name: 'ECM7', 
    defaultSize: 500,
    sessions: [
      { name: "ECM7_connect_4", size: 500 },
      { name: "ECM7_connect_5", size: 500 },
      { name: "ECM7_connect_6", size: 500 },
      { name: "ECM7_connect_7", size: 500 }
    ] 
  },
  { 
    id: 'ECM10', 
    name: 'ECM10', 
    defaultSize: 488,
    sessions: [
      { name: "ECM10_connect_4", size: 488 },
      { name: "ECM10_connect_5", size: 488 },
      { name: "ECM10_Connect_7", size: 488 },
      { name: "ECM10_Connect_8", size: 488 }
    ] 
  }
];

interface Preset {
  id: string;
  name: string;
  entityId: string;
  session: string;
  blockSize: number;
  mode: Mode;
  rangeMode: RangeMode;
  template: string;
}

interface ReportItem {
  id: string;
  profileName: string;
  tag: string;
  status: string;
  log: string;
  cnxProblems: string;
  sessionName: string;
  proxy: string;
  raw: string;
}

type Mode = 'ua' | 'proxy';
type RangeMode = 'continuous' | 'fixed';
type View = 'connect' | 'reporting';

// --- Components ---

const Card = ({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    {...props}
    className={`bg-card border border-white/10 rounded-2xl p-6 shadow-2xl ${className}`}
  >
    {children}
  </div>
);

const Label = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <label className={`text-[11px] uppercase tracking-wider text-accent font-bold mb-2 block ${className}`}>
    {children}
  </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props}
    className={`w-full bg-[#0c1428] border border-white/10 text-[#eaf1ff] px-4 py-3 rounded-xl outline-none focus:border-accent/50 transition-colors font-mono ${props.className || ''}`}
  />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select 
    {...props}
    className="w-full bg-[#0c1428] border border-white/10 text-[#eaf1ff] px-4 py-3 rounded-xl outline-none focus:border-accent/50 transition-colors appearance-none cursor-pointer"
  />
);

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea 
    {...props}
    className="w-full bg-[#0c1428] border border-white/10 text-[#eaf1ff] px-4 py-3 rounded-xl outline-none focus:border-accent/50 transition-colors font-mono text-xs leading-relaxed min-h-[200px] resize-y"
  />
);

const Badge = ({ children, color = 'accent' }: { children: React.ReactNode, color?: 'accent' | 'amber' | 'emerald' }) => {
  const colors = {
    accent: 'bg-accent/10 border-accent/30 text-accent',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
  };
  return (
    <div className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold flex items-center gap-1.5 ${colors[color]}`}>
      {children}
    </div>
  );
};

export default function App() {
  // --- State ---
  const [entities, setEntities] = useState<EntityConfig[]>(() => {
    const saved = localStorage.getItem('ecm_entities');
    return saved ? JSON.parse(saved) : DEFAULT_ENTITIES;
  });
  
  const [presets, setPresets] = useState<Preset[]>(() => {
    const saved = localStorage.getItem('ecm_presets');
    return saved ? JSON.parse(saved) : [];
  });

  const [entityId, setEntityId] = useState<string>(entities[0].id);
  const [session, setSession] = useState<string>('ALL');
  const [blockSize, setBlockSize] = useState<number>(entities[0].sessions[0].size);
  const [rangeMode, setRangeMode] = useState<RangeMode>('continuous');
  const [baseId, setBaseId] = useState<number>(1);
  const [view, setView] = useState<View>('connect');
  const [rawReport, setRawReport] = useState('');
  const [reportData, setReportData] = useState<ReportItem[]>([]);
  const [newProxyList, setNewProxyList] = useState('');
  const [rangeFrom, setRangeFrom] = useState<number>(1);
  const [rangeCount, setRangeCount] = useState<number>(entities[0].sessions.reduce((acc, s) => acc + s.size, 0));
  const [mode, setMode] = useState<Mode>('ua');
  const [template, setTemplate] = useState<string>('{id}#{data}#{extra}');
  
  const [history, setHistory] = useState<{id: string, timestamp: number, count: number, mode: Mode}[]>(() => {
    const saved = localStorage.getItem('ecm_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [uaList, setUaList] = useState<string>('');
  const [tagList, setTagList] = useState<string>('');
  const [proxyList, setProxyList] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);

  // --- Refs ---
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('ecm_entities', JSON.stringify(entities));
  }, [entities]);

  useEffect(() => {
    localStorage.setItem('ecm_presets', JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    localStorage.setItem('ecm_history', JSON.stringify(history));
  }, [history]);

  // --- Derived State ---
  const currentEntity = useMemo(() => 
    entities.find(e => e.id === entityId) || entities[0], 
  [entities, entityId]);

  // Update block size and ranges when entity changes
  useEffect(() => {
    setSession('ALL');
  }, [currentEntity]);

  // Update block size when session changes
  useEffect(() => {
    if (session !== 'ALL') {
      const idx = parseInt(session);
      setBlockSize(currentEntity.sessions[idx].size);
    }
  }, [session, currentEntity]);

  useEffect(() => {
    const start = baseId || 1;

    if (session === 'ALL') {
      const totalSize = currentEntity.sessions.reduce((acc, s) => acc + s.size, 0);
      setRangeCount(totalSize);
      setRangeFrom(start);
    } else {
      const idx = parseInt(session);
      const currentSessionSize = blockSize || currentEntity.sessions[idx].size;
      setRangeCount(currentSessionSize);
      
      if (rangeMode === 'continuous') {
        const previousSize = currentEntity.sessions
          .slice(0, idx)
          .reduce((acc, s) => acc + s.size, 0);
        setRangeFrom(start + previousSize);
      } else {
        setRangeFrom(start);
      }
    }
  }, [currentEntity, session, rangeMode, baseId, blockSize]);

  // --- Logic ---
  const extractVer = (ua: string) => {
    const match = ua.match(/(?:Chrome|Edg|Firefox)\/([0-9.]+)/);
    return match ? match[1] : "0.0.0.0";
  };

  const formatResult = (vars: Record<string, string>) => {
    let res = template;
    const availableVars = {
      id: vars.id || '',
      data: vars.data || '',
      extra: vars.extra || '',
      session: vars.session || '',
      entity: vars.entity || '',
      ua: vars.ua || '',
      version: vars.version || '',
      tag: vars.tag || '',
      proxy: vars.proxy || '',
    };

    Object.entries(availableVars).forEach(([key, value]) => {
      res = res.split(`{${key}}`).join(value);
    });
    return res;
  };

  const allResults = useMemo(() => {
    if (!rangeFrom || !rangeCount || rangeCount <= 0 || blockSize <= 0) return [];

    const generated: string[] = [];

    const getSessionInfo = (index: number) => {
      if (session === "ALL") {
        let accumulated = 0;
        for (let i = 0; i < currentEntity.sessions.length; i++) {
          const s = currentEntity.sessions[i];
          if (index < accumulated + s.size) {
            return {
              name: s.name,
              index: i,
              localIndex: index - accumulated,
              size: s.size,
              accumulatedBefore: accumulated
            };
          }
          accumulated += s.size;
        }
        const last = currentEntity.sessions[currentEntity.sessions.length - 1];
        return { 
          name: last.name, 
          index: currentEntity.sessions.length - 1, 
          localIndex: index - (accumulated - last.size),
          size: last.size,
          accumulatedBefore: accumulated - last.size
        };
      } else {
        const idx = parseInt(session);
        const s = currentEntity.sessions[idx];
        return {
          name: s.name,
          index: idx,
          localIndex: index,
          size: blockSize || s.size,
          accumulatedBefore: 0
        };
      }
    };

    if (mode === 'ua') {
      const uas = uaList.split('\n').map(s => s.trim()).filter(Boolean);
      if (!uas.length) return [];

      for (let i = 0; i < rangeCount; i++) {
        const profileId = rangeFrom + i;
        const sessionInfo = getSessionInfo(i);
        
        const isBulk = uas.length > sessionInfo.size;
        const dataOffset = (session !== "ALL" && isBulk) ? (sessionInfo.index * sessionInfo.size) : 0;
        
        const ua = uas[(dataOffset + i) % uas.length];
        const version = extractVer(ua);

        generated.push(formatResult({
          id: profileId.toString(),
          data: ua,
          extra: version,
          ua: ua,
          version: version,
          session: sessionInfo.name,
          entity: currentEntity.name
        }));
      }
    } else {
      const tags = tagList.split('\n').map(s => s.trim()).filter(Boolean);
      const proxies = proxyList.split('\n').map(s => s.trim()).filter(Boolean);
      if (!tags.length || !proxies.length) return [];

      for (let i = 0; i < rangeCount; i++) {
        const profileId = rangeFrom + i;
        const sessionInfo = getSessionInfo(i);

        const isBulk = proxies.length > sessionInfo.size;
        const dataOffset = (session !== "ALL" && isBulk) ? (sessionInfo.index * sessionInfo.size) : 0;

        const tag = tags[(dataOffset + i) % tags.length];
        const proxy = proxies[(dataOffset + i) % proxies.length];

        generated.push(formatResult({
          id: profileId.toString(),
          data: tag,
          extra: proxy,
          tag: tag,
          proxy: proxy,
          session: sessionInfo.name,
          entity: currentEntity.name
        }));
      }
    }

    return generated;
  }, [currentEntity, session, blockSize, rangeFrom, rangeCount, mode, uaList, tagList, proxyList, template]);

  const filteredResults = useMemo(() => {
    if (!searchQuery) return allResults;
    const lowerQuery = searchQuery.toLowerCase();
    return allResults.filter(r => r.toLowerCase().includes(lowerQuery));
  }, [allResults, searchQuery]);

  // --- Handlers ---
  const handleCopy = () => {
    if (filteredResults.length === 0) return;
    navigator.clipboard.writeText(filteredResults.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (filteredResults.length === 0) return;
    const blob = new Blob([filteredResults.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecm_export_${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    // Add to history
    const newEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      count: filteredResults.length,
      mode
    };
    setHistory(prev => [newEntry, ...prev].slice(0, 10));
  };

  const savePreset = (name: string) => {
    const newPreset: Preset = {
      id: crypto.randomUUID(),
      name,
      entityId,
      session,
      blockSize,
      mode,
      rangeMode,
      template
    };
    setPresets([...presets, newPreset]);
  };

  const loadPreset = (p: Preset) => {
    setEntityId(p.entityId);
    setSession(p.session);
    setBlockSize(p.blockSize);
    setMode(p.mode);
    setRangeMode(p.rangeMode);
    setTemplate(p.template);
  };

  const deletePreset = (id: string) => {
    setPresets(presets.filter(p => p.id !== id));
  };

  const addEntity = (newEntity: EntityConfig) => {
    setEntities([...entities, newEntity]);
    setEntityId(newEntity.id);
  };

  const updateEntity = (updated: EntityConfig) => {
    setEntities(entities.map(e => e.id === updated.id ? updated : e));
  };

  const deleteEntity = (id: string) => {
    if (entities.length <= 1) return;
    const filtered = entities.filter(e => e.id !== id);
    setEntities(filtered);
    if (entityId === id) setEntityId(filtered[0].id);
  };

  const handleClear = () => {
    setUaList('');
    setTagList('');
    setProxyList('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-header-bg border-b-2 border-ring px-8 py-4 sticky top-0 z-50 shadow-xl flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-ring/20 rounded-lg">
            <Activity className="w-6 h-6 text-accent" />
          </div>
          <div>
            <div className="text-[10px] text-muted uppercase tracking-[0.2em] font-bold">ECM Synchronized Connect</div>
            <div className="text-xl font-extrabold text-accent flex items-center gap-2">
              {view === 'connect' 
                ? (session === 'ALL' ? `${currentEntity.name} - ALL` : currentEntity.sessions[parseInt(session)]?.name)
                : 'Reporting & Analysis'
              }
            </div>
          </div>
        </div>

        <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setView('connect')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'connect' ? 'bg-accent text-white shadow-lg' : 'text-muted hover:text-white'}`}
          >
            Connect
          </button>
          <button 
            onClick={() => setView('reporting')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'reporting' ? 'bg-accent text-white shadow-lg' : 'text-muted hover:text-white'}`}
          >
            Reporting
          </button>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <div className="text-[10px] text-muted uppercase tracking-[0.2em] font-bold">Status</div>
            <div className={`text-xl font-extrabold transition-colors ${mode === 'ua' ? 'text-[#4ade80]' : 'text-accent'}`}>
              {mode === 'ua' ? 'UA MODE' : 'PROXY MODE'}
            </div>
          </div>
          <div className="h-10 w-[1px] bg-white/10 hidden md:block" />
          <button 
            onClick={() => setShowPresetModal(true)}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-muted hover:text-white group"
            title="Presets"
          >
            <History className="w-5 h-5 group-hover:rotate-[-10deg] transition-transform" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 lg:p-8">
        {view === 'connect' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Configuration */}
            <div className="lg:col-span-4 space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-accent" />
                  <h3 className="text-xs uppercase tracking-widest text-accent font-bold">1. Entity & Session</h3>
                </div>
                <button 
                  onClick={() => setShowEntityModal(true)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-muted hover:text-accent transition-colors"
                  title="Manage Entities"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <Label>Entity</Label>
                  <Select value={entityId} onChange={(e) => setEntityId(e.target.value)}>
                    {entities.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label>Session</Label>
                  <Select value={session} onChange={(e) => setSession(e.target.value)}>
                    <option value="ALL">ALL SESSIONS</option>
                    {currentEntity.sessions.map((s, idx) => (
                      <option key={idx} value={idx}>{s.name}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label>Block Size (Current Session Override)</Label>
                  <Input 
                    type="number" 
                    value={isNaN(blockSize) ? '' : blockSize} 
                    disabled={session === 'ALL'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setBlockSize(NaN);
                        return;
                      }
                      const newSize = parseInt(val);
                      setBlockSize(isNaN(newSize) ? 0 : newSize);
                    }}
                    onBlur={() => {
                      if (isNaN(blockSize)) setBlockSize(0);
                    }}
                    className={`text-center font-bold text-accent ${session === 'ALL' ? 'opacity-30' : ''}`}
                  />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-6">
                <Hash className="w-4 h-4 text-accent" />
                <h3 className="text-xs uppercase tracking-widest text-accent font-bold">2. Numbering Strategy</h3>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Base ID (Global Start)</Label>
                    <Input 
                      type="number" 
                      value={isNaN(baseId) ? '' : baseId} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setBaseId(NaN);
                          return;
                        }
                        const n = parseInt(val);
                        setBaseId(isNaN(n) ? 0 : n);
                      }}
                      onBlur={() => {
                        if (isNaN(baseId)) setBaseId(1);
                      }}
                      className="text-center font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <Label>Range Mode</Label>
                    <Select value={rangeMode} onChange={(e) => setRangeMode(e.target.value as RangeMode)}>
                      <option value="continuous">Continuous</option>
                      <option value="fixed">Fixed</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Calculated Start</Label>
                    <Input 
                      type="number" 
                      value={isNaN(rangeFrom) ? '' : rangeFrom} 
                      readOnly
                      className="text-center opacity-60 bg-black/20"
                    />
                  </div>
                  <div>
                    <Label>Total Count</Label>
                    <Input 
                      type="number" 
                      value={isNaN(rangeCount) ? '' : rangeCount} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setRangeCount(NaN);
                          return;
                        }
                        const n = parseInt(val);
                        setRangeCount(isNaN(n) ? 0 : n);
                      }}
                      onBlur={() => {
                        if (isNaN(rangeCount)) setRangeCount(0);
                      }}
                      className="text-center"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={() => setBaseId(prev => prev + rangeCount)}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] uppercase tracking-widest font-bold text-muted transition-all"
                >
                  Increment Base ID by Count
                </button>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-6">
                <Layout className="w-4 h-4 text-accent" />
                <h3 className="text-xs uppercase tracking-widest text-accent font-bold">Template & Mode</h3>
              </div>

              <div className="space-y-5">
                <div>
                  <Label>Output Template</Label>
                  <Input 
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    placeholder="{id}#{data}#{extra}"
                    className="text-sm font-mono"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['{id}', '{session}', '{entity}', '{data}', '{extra}', '{ua}', '{version}', '{tag}', '{proxy}'].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setTemplate(prev => prev + tag)}
                        className="text-[9px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10 text-muted transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Quick Delimiter</Label>
                  <div className="flex gap-2">
                    {['#', ';', ':', '|', ',', 'TAB'].map(d => (
                      <button
                        key={d}
                        onClick={() => {
                          const actualD = d === 'TAB' ? '\t' : d;
                          // Replace common delimiters with the new one
                          setTemplate(prev => prev.replace(/[#;:|,\t]/g, actualD));
                        }}
                        className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-muted hover:text-accent transition-colors"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex p-1 bg-[#0c1428] rounded-xl">
                  <button 
                    onClick={() => setMode('ua')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${mode === 'ua' ? 'bg-ring text-white shadow-lg' : 'text-muted hover:text-white'}`}
                  >
                    <Monitor className="w-3 h-3" />
                    UA Mode
                  </button>
                  <button 
                    onClick={() => setMode('proxy')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${mode === 'proxy' ? 'bg-ring text-white shadow-lg' : 'text-muted hover:text-white'}`}
                  >
                    <Shield className="w-3 h-3" />
                    Proxy Mode
                  </button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-6">
                <Layers className="w-4 h-4 text-accent" />
                <h3 className="text-xs uppercase tracking-widest text-accent font-bold">Data Input</h3>
              </div>

              <AnimatePresence mode="wait">
                {mode === 'ua' ? (
                  <motion.div 
                    key="ua"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <TextArea 
                      placeholder="Paste UAs here (one per line)..."
                      value={uaList}
                      onChange={(e) => setUaList(e.target.value)}
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="proxy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <Label>Tags</Label>
                      <TextArea 
                        placeholder="Paste Tags here..."
                        value={tagList}
                        onChange={(e) => setTagList(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <div>
                      <Label>Proxies</Label>
                      <TextArea 
                        placeholder="Paste Proxies here..."
                        value={proxyList}
                        onChange={(e) => setProxyList(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="flex flex-col h-full min-h-[700px]">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-4 h-4 text-accent" />
                    <h3 className="text-xs uppercase tracking-widest text-accent font-bold">Results</h3>
                  </div>
                  <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input 
                      type="text"
                      placeholder="Search in results..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#0c1428] border border-white/10 text-sm py-2 pl-10 pr-4 rounded-xl outline-none focus:border-accent/50 transition-all"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge>Profiles: {filteredResults.length}</Badge>
                  <Badge color="amber">Total: {allResults.length}</Badge>
                  <Badge color="emerald">
                    {mode === 'ua' ? `UAs: ${uaList.split('\n').filter(Boolean).length}` : `Proxies: ${proxyList.split('\n').filter(Boolean).length}`}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 relative">
                <div className="absolute inset-0 bg-[#0c1428] border border-white/10 rounded-xl overflow-hidden border-l-4 border-l-accent">
                  <div 
                    ref={resultsContainerRef}
                    className="h-full overflow-auto p-5 font-mono text-xs text-[#8cb4ff] whitespace-pre preview-scrollbar selection:bg-accent/30"
                  >
                    {filteredResults.length > 0 ? filteredResults.join('\n') : (
                      <div className="h-full flex flex-col items-center justify-center text-muted opacity-50 space-y-4">
                        <FileText className="w-12 h-12" />
                        <p className="text-sm font-sans italic">No results to display</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 mt-6">
                <button 
                  onClick={() => {
                    if (confirm('Clear all input data?')) handleClear();
                  }}
                  className="px-6 py-3 bg-[#1c253d] border border-white/10 rounded-xl text-xs font-bold text-muted hover:text-white hover:bg-[#253152] transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
                <button 
                  onClick={handleCopy}
                  disabled={filteredResults.length === 0}
                  className={`px-6 py-3 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-[#1c253d] text-muted hover:text-white hover:bg-[#253152]'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Results'}
                </button>
                <button 
                  onClick={handleDownload}
                  disabled={filteredResults.length === 0}
                  className="px-8 py-3 bg-gradient-to-b from-ring to-[#214bd6] rounded-xl text-xs font-bold text-white shadow-lg shadow-ring/20 hover:shadow-ring/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .txt
                </button>
              </div>
            </Card>
          </div>
        </div>
        ) : (
          <Reporting 
            rawInput={rawReport}
            setRawInput={setRawReport}
            reportData={reportData}
            setReportData={setReportData}
            newProxyList={newProxyList}
            setNewProxyList={setNewProxyList}
          />
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showEntityModal && (
          <Modal title="Manage Entities" onClose={() => setShowEntityModal(false)}>
            <EntityManager 
              entities={entities} 
              onAdd={addEntity} 
              onUpdate={updateEntity}
              onDelete={deleteEntity} 
            />
          </Modal>
        )}
        {showPresetModal && (
          <Modal title="Presets & History" onClose={() => setShowPresetModal(false)}>
            <div className="space-y-10">
              <PresetManager 
                presets={presets} 
                onSave={() => {
                  const name = prompt('Enter preset name:');
                  if (name) savePreset(name);
                }}
                onLoad={(p) => {
                  loadPreset(p);
                  setShowPresetModal(false);
                }}
                onDelete={deletePreset}
              />
              
              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-accent" />
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted">Recent Exports</h4>
                </div>
                <div className="space-y-2">
                  {history.length === 0 ? (
                    <div className="text-center py-4 text-muted italic text-xs">No history yet</div>
                  ) : (
                    history.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 text-[10px]">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${item.mode === 'ua' ? 'bg-emerald-500' : 'bg-accent'}`} />
                          <span className="text-white font-medium">{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                        <span className="text-muted">{item.count} profiles</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <footer className="py-8 text-center text-[10px] text-muted uppercase tracking-[0.3em] font-medium opacity-50">
        ECM Synchronized Connect &bull; v2.0 &bull; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

// --- Sub-components ---

const Reporting = ({ 
  rawInput, 
  setRawInput, 
  reportData, 
  setReportData,
  newProxyList,
  setNewProxyList
}: { 
  rawInput: string, 
  setRawInput: (val: string) => void, 
  reportData: ReportItem[], 
  setReportData: (val: ReportItem[]) => void,
  newProxyList: string,
  setNewProxyList: (val: string) => void
}) => {
  const [filter, setFilter] = useState<'all' | 'closed' | 'proxy_down' | 'failed' | 'disconnected'>('all');
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [replacementOutput, setReplacementOutput] = useState('');
  const [replacementTemplate, setReplacementTemplate] = useState('profile#session#proxy');
  const [targetProxyClass, setTargetProxyClass] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showCopyFeedback = (key: string) => {
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setRawInput(content);
      // Auto-parse on upload
      setTimeout(() => parseReport(content), 100);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const parseCSVLine = (line: string, delimiter: string) => {
    const result = [];
    let curValue = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(curValue.trim());
        curValue = '';
      } else {
        curValue += char;
      }
    }
    result.push(curValue.trim());
    // Remove surrounding quotes from values
    return result.map(v => v.replace(/^"|"$/g, '').trim());
  };

  const parseReport = (inputOverride?: string) => {
    const input = inputOverride || rawInput;
    if (!input.trim()) return;
    
    const lines = input.trim().split('\n');
    if (lines.length < 2) return;

    // Detect delimiter (usually ; or ,)
    const headerLine = lines[0];
    const delimiter = headerLine.includes(';') ? ';' : ',';
    
    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
    
    const items: ReportItem[] = lines.slice(1).map(line => {
      const parts = parseCSVLine(line, delimiter);
      const item: any = {};
      
      // Map parts to headers
      headers.forEach((h, i) => {
        if (h === 'process_log_id') item.id = parts[i];
        else if (h === 'profile_name') item.profileName = parts[i];
        else if (h === 'tag') item.tag = parts[i];
        else if (h === 'status_name') item.status = parts[i];
        else if (h === 'log') item.log = parts[i];
        else if (h === 'cnx_problems') item.cnxProblems = parts[i];
        else if (h === 'details') item.details = parts[i];
        else if (h === 'script_name') item.scriptName = parts[i];
        else if (h === 'session_name') item.sessionName = parts[i];
        else if (h === 'created') item.created = parts[i];
        else if (h === 'finished') item.finished = parts[i];
        else if (h === 'proxy') item.proxy = parts[i];
      });
      
      return item as ReportItem;
    }).filter(item => item.profileName);

    setReportData(items);
  };

  const uniqueSessions = useMemo(() => {
    const sessions = reportData
      .map(i => i.sessionName?.split('(')[0].trim())
      .filter(Boolean);
    return Array.from(new Set(sessions)).sort();
  }, [reportData]);

  const filteredData = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return reportData.filter(item => {
      const matchesSearch = 
        !search || 
        (item.profileName?.toLowerCase() || '').includes(lowerSearch) ||
        (item.tag?.toLowerCase() || '').includes(lowerSearch) ||
        (item.sessionName?.toLowerCase() || '').includes(lowerSearch) ||
        (item.proxy?.toLowerCase() || '').includes(lowerSearch) ||
        (item.status?.toLowerCase() || '').includes(lowerSearch);
      
      if (!matchesSearch) return false;
      
      const cleanSession = item.sessionName?.split('(')[0].trim();
      if (sessionFilter !== 'all' && cleanSession !== sessionFilter) return false;
      
      if (filter === 'closed') return item.status?.toLowerCase() === 'closed';
      if (filter === 'proxy_down') return item.cnxProblems?.toLowerCase().includes('proxy down');
      if (filter === 'failed') return item.status?.toLowerCase() === 'failed';
      if (filter === 'disconnected') return item.status?.toLowerCase() === 'completed' && item.log?.toLowerCase().includes('disconnected profile');
      return true;
    });
  }, [reportData, filter, sessionFilter, search]);

  const stats = useMemo(() => {
    return {
      total: reportData.length,
      closed: reportData.filter(i => i.status?.toLowerCase() === 'closed').length,
      proxyDown: reportData.filter(i => i.cnxProblems?.toLowerCase().includes('proxy down')).length,
      failed: reportData.filter(i => i.status?.toLowerCase() === 'failed').length,
      disconnected: reportData.filter(i => i.status?.toLowerCase() === 'completed' && i.log?.toLowerCase().includes('disconnected profile')).length
    };
  }, [reportData]);

  const copyProxies = () => {
    const proxies = filteredData.map(i => i.proxy).filter(Boolean).join('\n');
    navigator.clipboard.writeText(proxies);
    showCopyFeedback('proxies');
  };

  const copyProxyDownProfiles = () => {
    const profiles = filteredData
      .filter(i => i.cnxProblems?.toLowerCase().includes('proxy down'))
      .map(i => i.profileName)
      .filter(Boolean)
      .join('\n');
    
    if (!profiles) return;
    
    navigator.clipboard.writeText(profiles);
    showCopyFeedback('down_ids');
  };

  const copyFailedProfiles = () => {
    const profiles = filteredData
      .filter(i => i.status?.toLowerCase() === 'failed')
      .map(i => i.profileName)
      .filter(Boolean)
      .join('\n');
    
    if (!profiles) return;
    
    navigator.clipboard.writeText(profiles);
    showCopyFeedback('failed_ids');
  };

  const copyDisconnectedProfiles = () => {
    const profiles = filteredData
      .filter(i => i.status?.toLowerCase() === 'completed' && i.log?.toLowerCase().includes('disconnected profile'))
      .map(i => i.profileName)
      .filter(Boolean)
      .join('\n');
    
    if (!profiles) return;
    
    navigator.clipboard.writeText(profiles);
    showCopyFeedback('disconnected_ids');
  };

  const copySessionNames = () => {
    const sessions = Array.from(new Set(
      filteredData
        .map(i => i.sessionName?.split('(')[0].trim())
        .filter(Boolean)
    )).join('\n');
    
    if (!sessions) return;
    
    navigator.clipboard.writeText(sessions);
    showCopyFeedback('sessions');
  };

  const generateReplacement = () => {
    const newProxies = newProxyList.split('\n').map(p => p.trim()).filter(Boolean);
    if (newProxies.length === 0) {
      alert('Please provide new proxies first.');
      return;
    }

    let targetData = filteredData;
    
    if (targetProxyClass.trim()) {
      targetData = reportData.filter(item => {
        const proxyIp = item.proxy?.split(':')[0] || '';
        return proxyIp.startsWith(targetProxyClass.trim());
      });
    }

    if (targetData.length === 0) {
      alert('No profiles found for the selected target.');
      return;
    }

    const output = targetData.map((item, idx) => {
      if (idx >= newProxies.length) return null;
      // Clean session name: remove IP part like (51.159.137.95)
      const cleanSession = item.sessionName.split('(')[0].trim();
      
      return replacementTemplate
        .replace(/profile/gi, item.profileName)
        .replace(/session/gi, cleanSession)
        .replace(/proxy/gi, newProxies[idx]);
    }).filter(Boolean).join('\n');

    setReplacementOutput(output);
  };

  const copyReplacement = () => {
    navigator.clipboard.writeText(replacementOutput);
    showCopyFeedback('replacement');
  };

  const CopyButton = ({ 
    onClick, 
    id, 
    label, 
    icon: Icon, 
    colorClass = 'text-muted hover:text-white border-white/10 bg-white/5 hover:bg-white/10' 
  }: { 
    onClick: () => void, 
    id: string, 
    label: string, 
    icon: any,
    colorClass?: string
  }) => (
    <motion.button 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={filteredData.length === 0}
      className={`px-3 py-1.5 border rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-30 whitespace-nowrap relative overflow-hidden ${
        copiedKey === id
          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
          : colorClass
      }`}
    >
      <AnimatePresence mode="wait">
        {copiedKey === id ? (
          <motion.div
            key="copied"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Check className="w-3 h-3" /> Copied!
          </motion.div>
        ) : (
          <motion.div
            key="label"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Icon className="w-3 h-3" /> {label}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input & Replacement */}
        <div className="lg:col-span-4 space-y-6">
          {/* Input Area */}
          <Card 
            className={`flex flex-col gap-6 transition-all duration-300 ${isDragging ? 'border-accent bg-accent/5 scale-[1.02]' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                <h3 className="text-xs uppercase tracking-widest text-accent font-bold">Report Input</h3>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 hover:bg-white/5 rounded-lg text-muted hover:text-accent transition-colors flex items-center gap-2 text-[10px] uppercase font-bold tracking-tighter"
              >
                <Download className="w-3 h-3 rotate-180" /> Upload File
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".csv,.txt,.log"
              />
            </div>

            <div className="relative flex-1 flex flex-col gap-4">
              <TextArea 
                placeholder="Paste report data here or drag & drop a file..."
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                className="flex-1 min-h-[300px]"
              />
              {isDragging && (
                <div className="absolute inset-0 bg-accent/10 backdrop-blur-[2px] border-2 border-dashed border-accent rounded-xl flex flex-col items-center justify-center text-accent animate-pulse">
                  <Download className="w-12 h-12 mb-4 rotate-180" />
                  <p className="font-bold uppercase tracking-widest text-sm">Drop file to upload</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => parseReport()}
              className="w-full py-4 bg-accent text-white rounded-xl font-bold hover:bg-accent/80 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
            >
              <Activity className="w-4 h-4" /> Analyze Report
            </button>
          </Card>

          {/* Replacement Tool */}
          <Card id="replacement-tool" className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Proxy Replacement</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Target Proxy Class (IP Prefix)</Label>
                <div className="relative group">
                  <ShieldAlert className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted group-focus-within:text-emerald-400 transition-colors" />
                  <input 
                    type="text"
                    placeholder="e.g. 192.73.17"
                    value={targetProxyClass}
                    onChange={e => setTargetProxyClass(e.target.value)}
                    className="w-full bg-black/20 border border-white/5 rounded-lg pl-8 pr-10 py-2 text-xs outline-none focus:border-emerald-500/30 transition-all font-mono"
                  />
                  {targetProxyClass && (
                    <button 
                      onClick={() => setTargetProxyClass('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/5 rounded text-muted hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-[9px] text-muted italic">
                  {targetProxyClass.trim() 
                    ? `Targeting ${reportData.filter(i => i.proxy?.split(':')[0].startsWith(targetProxyClass.trim())).length} profiles matching class "${targetProxyClass}".`
                    : `Targeting all ${filteredData.length} currently filtered profiles.`}
                </p>
                <p className="text-[8px] text-muted/50 mt-1 uppercase tracking-tighter font-bold">Tip: Click a proxy in the table to auto-fill its class.</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="mb-0">Replacement Template</Label>
                <div className="flex gap-2">
                  {['profile#proxy', 'profile#session#proxy'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setReplacementTemplate(t)}
                      className="text-[9px] px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-muted hover:text-white transition-all uppercase font-bold"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <input 
                type="text"
                value={replacementTemplate}
                onChange={e => setReplacementTemplate(e.target.value)}
                placeholder="e.g. profile#proxy"
                className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500/30 transition-all font-mono"
              />
              <p className="mt-1.5 text-[9px] text-muted italic">Available placeholders: <span className="text-emerald-400 font-bold">profile</span>, <span className="text-emerald-400 font-bold">session</span>, <span className="text-emerald-400 font-bold">proxy</span></p>
            </div>
          </div>

          <div>
              <Label>New Proxies (One per line)</Label>
              <TextArea 
                placeholder="Paste new proxies here..."
                value={newProxyList}
                onChange={e => setNewProxyList(e.target.value)}
                className="min-h-[150px]"
              />
              <div className="flex justify-between items-center px-1 py-1 mt-1 border-b border-white/5">
                <span className="text-[9px] text-muted uppercase font-bold tracking-widest">Proxies Provided</span>
                <span className="text-xs font-black text-accent">{newProxyList.split('\n').filter(p => p.trim()).length}</span>
              </div>
              <p className="text-[9px] text-muted mt-2 italic">These will be mapped to the filtered profiles below.</p>
            </div>

            <button 
              onClick={generateReplacement}
              disabled={filteredData.length === 0}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
            >
              <Plus className="w-4 h-4" /> Generate Replacement Output
            </button>

            {replacementOutput && (
              <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] text-emerald-400 whitespace-pre max-h-[200px] overflow-auto">
                  {replacementOutput}
                </div>
                
                <div className="flex justify-between items-center px-1 py-1 border-b border-white/5">
                  <span className="text-[9px] text-muted uppercase font-bold tracking-widest">Profiles Affected</span>
                  <span className="text-xs font-black text-emerald-400">{replacementOutput.split('\n').filter(Boolean).length}</span>
                </div>

                <button 
                  onClick={copyReplacement}
                  className={`w-full py-2 border rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    copiedKey === 'replacement' 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                  }`}
                >
                  {copiedKey === 'replacement' ? (
                    <><Check className="w-3 h-3" /> Copied!</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy Output</>
                  )}
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Analysis Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-5 gap-4">
            <Card className="p-4 flex flex-col items-center justify-center text-center border-l-4 border-l-accent">
              <div className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Total</div>
              <div className="text-2xl font-black text-white">{stats.total}</div>
            </Card>
            <Card className="p-4 flex flex-col items-center justify-center text-center border-l-4 border-l-amber-500">
              <div className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Closed</div>
              <div className="text-2xl font-black text-amber-500">{stats.closed}</div>
            </Card>
            <Card className="p-4 flex flex-col items-center justify-center text-center border-l-4 border-l-red-500">
              <div className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Proxy Down</div>
              <div className="text-2xl font-black text-red-500">{stats.proxyDown}</div>
            </Card>
            <Card className="p-4 flex flex-col items-center justify-center text-center border-l-4 border-l-rose-600">
              <div className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Failed</div>
              <div className="text-2xl font-black text-rose-600">{stats.failed}</div>
            </Card>
            <Card className="p-4 flex flex-col items-center justify-center text-center border-l-4 border-l-indigo-500">
              <div className="text-[10px] text-muted uppercase tracking-widest font-bold mb-1">Disconnected</div>
              <div className="text-2xl font-black text-indigo-500">{stats.disconnected}</div>
            </Card>
          </div>

          {/* Table Card */}
          <Card className="flex flex-col min-h-[600px]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                  {(['all', 'closed', 'proxy_down', 'failed', 'disconnected'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-white/10 text-white' : 'text-muted hover:text-white'}`}
                    >
                      {f.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                <div className="relative group">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted group-focus-within:text-accent transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search profiles, tags, proxies..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-black/20 border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-accent/30 focus:bg-black/40 transition-all w-64"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
                <div className="flex items-center gap-1.5 pr-2 border-r border-white/10">
                  <CopyButton 
                    onClick={copyDisconnectedProfiles} 
                    id="disconnected_ids" 
                    label="Disconnected" 
                    icon={Monitor}
                    colorClass="text-indigo-400 hover:text-indigo-300 border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10"
                  />
                  <CopyButton 
                    onClick={copyFailedProfiles} 
                    id="failed_ids" 
                    label="Failed" 
                    icon={X}
                    colorClass="text-rose-400 hover:text-rose-300 border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10"
                  />
                  <CopyButton 
                    onClick={copyProxyDownProfiles} 
                    id="down_ids" 
                    label="Down" 
                    icon={ShieldAlert}
                    colorClass="text-red-400 hover:text-red-300 border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                  />
                </div>
                
                <div className="flex items-center gap-1.5 pl-0.5">
                  <CopyButton 
                    onClick={copySessionNames} 
                    id="sessions" 
                    label="Sessions" 
                    icon={List}
                  />
                  <CopyButton 
                    onClick={copyProxies} 
                    id="proxies" 
                    label="Proxies" 
                    icon={Copy}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-white/5 bg-black/10">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#141b2d] z-10">
                  <tr className="border-b border-white/10">
                    <th className="p-4 text-[10px] uppercase tracking-widest text-muted font-bold">Profile</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-muted font-bold">
                      <div className="flex items-center gap-2">
                        Session
                        <select 
                          value={sessionFilter}
                          onChange={e => setSessionFilter(e.target.value)}
                          className="bg-[#0c1428] border border-white/20 rounded px-2 py-0.5 text-[10px] font-bold text-white outline-none cursor-pointer hover:border-accent/50 transition-colors"
                        >
                          <option value="all" className="bg-[#0c1428] text-white">ALL SESSIONS</option>
                          {uniqueSessions.map(s => (
                            <option key={s} value={s} className="bg-[#0c1428] text-white">{s}</option>
                          ))}
                        </select>
                      </div>
                    </th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-muted font-bold">Status</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-muted font-bold">Problems</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-muted font-bold">Proxy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredData.length > 0 ? filteredData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4">
                        <div className="text-xs font-bold text-white group-hover:text-accent transition-colors">{item.profileName}</div>
                        <div className="text-[9px] text-muted font-mono">{item.tag}</div>
                      </td>
                      <td className="p-4 text-[10px] text-muted">{item.sessionName}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          item.status?.toLowerCase() === 'closed' 
                            ? 'bg-amber-500/20 text-amber-500' 
                            : item.status?.toLowerCase() === 'failed'
                            ? 'bg-rose-600/20 text-rose-600'
                            : item.status?.toLowerCase() === 'completed' && item.log?.toLowerCase().includes('disconnected profile')
                            ? 'bg-indigo-500/20 text-indigo-400'
                            : 'bg-emerald-500/20 text-emerald-500'
                        }`}>
                          {item.status?.toLowerCase() === 'completed' && item.log?.toLowerCase().includes('disconnected profile') ? 'Disconnected' : item.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {item.status?.toLowerCase() === 'completed' && item.log?.toLowerCase().includes('disconnected profile') ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-500/20 text-indigo-400">
                            Disconnected Profile
                          </span>
                        ) : item.status?.toLowerCase() === 'failed' ? (
                          <div className="text-[9px] text-rose-400 font-medium max-w-[250px] break-words" title={item.log}>
                            {item.log}
                          </div>
                        ) : item.cnxProblems ? (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.cnxProblems.toLowerCase().includes('proxy down') ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-muted'}`}>
                            {item.cnxProblems}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted/30 italic">None</span>
                        )}
                      </td>
                      <td 
                        className="p-4 text-[10px] font-mono text-muted group-hover:text-white transition-colors cursor-pointer hover:text-accent"
                        onClick={() => {
                          const ip = item.proxy?.split(':')[0] || '';
                          const parts = ip.split('.');
                          if (parts.length >= 3) {
                            const proxyClass = `${parts[0]}.${parts[1]}.${parts[2]}`;
                            setTargetProxyClass(proxyClass);
                            document.getElementById('replacement-tool')?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        title="Click to target this proxy class"
                      >
                        {item.proxy}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-muted italic text-sm">
                        No data found. Paste a report and click Analyze.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Modal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 bg-black/80 backdrop-blur-sm"
    />
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="relative w-full max-w-2xl bg-header-bg border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
    >
      <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-muted hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-8 max-h-[70vh] overflow-auto preview-scrollbar">
        {children}
      </div>
    </motion.div>
  </div>
);

const EntityManager = ({ entities, onAdd, onUpdate, onDelete }: { entities: EntityConfig[], onAdd: (e: EntityConfig) => void, onUpdate: (e: EntityConfig) => void, onDelete: (id: string) => void }) => {
  const [name, setName] = useState('');
  const [defaultSize, setDefaultSize] = useState(500);
  const [sessionsInput, setSessionsInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sessionsInput) return;
    
    const sessionConfigs: SessionConfig[] = sessionsInput.split('\n').map(line => {
      const parts = line.split(':');
      const sName = parts[0].trim();
      const sSize = parts[1] ? parseInt(parts[1].trim()) : defaultSize;
      return { name: sName, size: isNaN(sSize) ? defaultSize : sSize };
    }).filter(s => s.name);

    if (editingId) {
      onUpdate({
        id: editingId,
        name,
        defaultSize: isNaN(defaultSize) ? 500 : defaultSize,
        sessions: sessionConfigs
      });
      setEditingId(null);
    } else {
      onAdd({
        id: name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
        name,
        defaultSize: isNaN(defaultSize) ? 500 : defaultSize,
        sessions: sessionConfigs
      });
    }
    setName('');
    setSessionsInput('');
  };

  const handleEdit = (e: EntityConfig) => {
    setEditingId(e.id);
    setName(e.name);
    setDefaultSize(e.defaultSize || 500);
    setSessionsInput(e.sessions.map(s => `${s.name}${s.size !== (e.defaultSize || 500) ? `:${s.size}` : ''}`).join('\n'));
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setSessionsInput('');
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-accent">
            {editingId ? 'Edit Entity' : 'Add New Entity'}
          </h4>
          {editingId && (
            <button 
              type="button" 
              onClick={handleCancel}
              className="text-[10px] text-muted hover:text-white uppercase tracking-wider"
            >
              Cancel Edit
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Entity Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. ECM12" />
          </div>
          <div>
            <Label>Entity Default Size</Label>
            <Input 
              type="number" 
              value={isNaN(defaultSize) ? '' : defaultSize} 
              onChange={e => {
                const val = e.target.value;
                if (val === '') {
                  setDefaultSize(NaN);
                  return;
                }
                const n = parseInt(val);
                setDefaultSize(isNaN(n) ? 0 : n);
              }}
              onBlur={() => {
                if (isNaN(defaultSize)) setDefaultSize(500);
              }}
              placeholder="Fallback for sessions"
            />
          </div>
        </div>
        <div>
          <Label>Sessions (Format: Name:Size or just Name)</Label>
          <TextArea 
            value={sessionsInput} 
            onChange={e => setSessionsInput(e.target.value)} 
            placeholder="Session_1:488&#10;Session_2:500&#10;Session_3"
            className="min-h-[120px]"
          />
          <p className="text-[9px] text-muted mt-2 italic">
            Tip: If you don't specify a size (e.g. just "Session_3"), it will use the <strong>Entity Default Size</strong> ({isNaN(defaultSize) ? '500' : defaultSize}).
          </p>
        </div>
        <button type="submit" className={`w-full py-3 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${editingId ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-accent hover:bg-accent/80'}`}>
          {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {editingId ? 'Update Entity' : 'Add Entity'}
        </button>
      </form>

      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted">Existing Entities</h4>
        {entities.map(e => (
          <div key={e.id} className={`flex items-center justify-between p-4 bg-white/5 rounded-xl border transition-colors ${editingId === e.id ? 'border-accent bg-accent/5' : 'border-white/5'}`}>
            <div className="flex-1">
              <div className="font-bold text-white flex items-center gap-2">
                {e.name}
                {editingId === e.id && <span className="text-[8px] bg-accent px-1.5 py-0.5 rounded uppercase tracking-tighter">Editing</span>}
              </div>
              <div className="text-[10px] text-muted">
                {e.sessions.length} sessions &bull; Total: {e.sessions.reduce((acc, s) => acc + s.size, 0)}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {e.sessions.slice(0, 5).map((s, i) => (
                  <span key={i} className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-muted">
                    {s.name} ({s.size})
                  </span>
                ))}
                {e.sessions.length > 5 && <span className="text-[8px] text-muted">+{e.sessions.length - 5} more</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button 
                onClick={() => handleEdit(e)}
                className="p-2 text-muted hover:text-accent transition-colors"
                title="Edit Entity"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDelete(e.id)}
                disabled={entities.length <= 1}
                className="p-2 text-muted hover:text-red-400 transition-colors disabled:opacity-20"
                title="Delete Entity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PresetManager = ({ presets, onSave, onLoad, onDelete }: { presets: Preset[], onSave: () => void, onLoad: (p: Preset) => void, onDelete: (id: string) => void }) => (
  <div className="space-y-6">
    <button 
      onClick={onSave}
      className="w-full py-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-2xl font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
    >
      <Save className="w-5 h-5" /> Save Current Configuration
    </button>

    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-widest text-muted">Saved Presets</h4>
      {presets.length === 0 ? (
        <div className="text-center py-12 text-muted italic text-sm">No presets saved yet</div>
      ) : (
        presets.map(p => (
          <div key={p.id} className="group flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-accent/30 transition-all">
            <div className="flex-1 cursor-pointer" onClick={() => onLoad(p)}>
              <div className="font-bold text-white group-hover:text-accent transition-colors">{p.name}</div>
              <div className="text-[10px] text-muted flex gap-2">
                <span>{p.entityId}</span> &bull; 
                <span>{p.mode.toUpperCase()}</span> &bull;
                <span>{p.rangeMode}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onLoad(p)}
                className="p-2 text-muted hover:text-accent transition-colors"
                title="Load"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDelete(p.id)}
                className="p-2 text-muted hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);
