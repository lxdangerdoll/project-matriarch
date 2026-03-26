import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Volume2, VolumeX, ShieldCheck, Cpu, 
  User, AlertTriangle, BookOpen, Download, 
  Key, Trash2, Paperclip, Globe, X, Radio, RefreshCw, Sliders
} from 'lucide-react';

// Environment fallback
const defaultApiKey = ""; 

// --- Utility: PCM to WAV for TTS ---
function pcmToWav(base64Pcm, sampleRate = 24000) {
  try {
    const binaryString = window.atob(base64Pcm);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const buffer = new ArrayBuffer(44 + len);
    const view = new DataView(buffer);
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + len, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, len, true);
    const pcmData = new Uint8Array(buffer, 44, len);
    pcmData.set(bytes);
    return buffer;
  } catch (e) {
    console.error("Audio conversion failed", e);
    return null;
  }
}

// --- Exponential Backoff Fetch ---
const fetchWithRetry = async (url, options, maxRetries = 5) => {
  const delays = [1000, 2000, 4000, 8000, 16000];
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error ${response.status}: ${errText}`);
      }
      return await response.json();
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await new Promise(r => setTimeout(r, delays[i]));
    }
  }
};

const DEFAULT_CONTEXT = `USER DIAGNOSTIC & WELLNESS PLAN:

[1. CORE IDENTITY]
The user is a survivor ("Different Subspecies") navigating high-distress environments.

[2. BIOLOGICAL IMPERATIVES (DBT SKILLS)]
Primary: STOP (Stop, Take a step back, Observe, Proceed mindfully)
Secondary: TIPP (Temperature, Intense exercise, Paced breathing, Paired muscle relaxation)
Tertiary: Radical Acceptance & DEAR MAN.

[3. MATRIARCH PROTOCOL (YOUR ROLE)]
- You are Mariposa, an expert DBT coach. 
- You do NOT validate delusions or "philosophical spiraling."
- You provide Gentle Rigor. Redirect the user's focus from somatic distress back to objective skill application.
- Maintain a calm, objective, trauma-informed tone.`;

export default function App() {
  // --- LocalStorage State Management ---
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('matriarch_apiKey') || '');
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem('matriarch_chatHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [systemContext, setSystemContext] = useState(() => localStorage.getItem('matriarch_context') || DEFAULT_CONTEXT);
  const [language, setLanguage] = useState(() => localStorage.getItem('matriarch_language') || 'en');
  
  // Model selection state
  const [availableModels, setAvailableModels] = useState(() => {
    const saved = localStorage.getItem('matriarch_models');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('matriarch_selectedModel') || 'models/gemini-1.5-flash');
  const [isSweeping, setIsSweeping] = useState(false);

  // --- UI State ---
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync to LocalStorage
  useEffect(() => { localStorage.setItem('matriarch_apiKey', userApiKey); }, [userApiKey]);
  useEffect(() => { localStorage.setItem('matriarch_chatHistory', JSON.stringify(chatHistory)); }, [chatHistory]);
  useEffect(() => { localStorage.setItem('matriarch_context', systemContext); }, [systemContext]);
  useEffect(() => { localStorage.setItem('matriarch_language', language); }, [language]);
  useEffect(() => { localStorage.setItem('matriarch_models', JSON.stringify(availableModels)); }, [availableModels]);
  useEffect(() => { localStorage.setItem('matriarch_selectedModel', selectedModel); }, [selectedModel]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isProcessing]);

  // Dynamic Textarea Resizing
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; 
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  // --- Core Functions ---

  const sweepModels = async () => {
    const activeKey = userApiKey || defaultApiKey;
    if (!activeKey) {
      alert("Please enter an API Key first to sweep for models.");
      return;
    }
    setIsSweeping(true);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${activeKey}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch models");
      const data = await response.json();
      
      const validModels = data.models
        .filter(m => m.supportedGenerationMethods.includes("generateContent"))
        .map(m => m.name);
        
      setAvailableModels(validModels);
      if (validModels.length > 0 && !validModels.includes(selectedModel)) {
        setSelectedModel(validModels[0]);
      }
    } catch (err) {
      console.error(err);
      alert(`Signal Sweep Failed: ${err.message}`);
    } finally {
      setIsSweeping(false);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    
    const activeKey = userApiKey || defaultApiKey;
    if (!activeKey) {
      setShowSettings(true);
      setChatHistory(prev => [...prev, { role: 'error', parts: [{ text: "SYSTEM HALT: API Key required. Please input your Gemini API Key in settings." }] }]);
      return;
    }

    const newText = inputText.trim();
    setInputText(''); 
    
    const newUserMsg = { role: 'user', parts: [{ text: newText }] };
    setChatHistory(prev => [...prev, newUserMsg]);
    setIsProcessing(true);

    try {
      const langMap = { 
        es: 'Spanish', 
        fr: 'French', 
        de: 'German',
        ja: 'Japanese',
        zh: 'Simplified Chinese',
        ar: 'Arabic',
        fa: 'Farsi',
        hi: 'Hindi',
        uk: 'Ukrainian'
      };
      const langDirective = language !== 'en' 
        ? `\n\n[LANGUAGE DIRECTIVE]: You MUST reply entirely in ${langMap[language]}.` 
        : '';
      const finalContext = systemContext + langDirective;

      const apiHistory = [...chatHistory, newUserMsg].slice(-15).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.parts[0].text }]
      }));

      // Dynamically use selected model
      const targetModel = selectedModel || 'models/gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${activeKey}`;
      
      const payload = {
        contents: apiHistory,
        systemInstruction: { parts: [{ text: finalContext }] }
      };

      const data = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!data || !data.candidates) throw new Error("Invalid Response from Model.");
      const modelText = data.candidates[0].content.parts[0].text;

      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: modelText }] }]);

      if (voiceEnabled) {
        playVocalis(modelText, activeKey);
      }

    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'error', parts: [{ text: `ERROR: Resonance lost. ${error.message}` }] }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const playVocalis = async (text, activeKey) => {
    try {
      // NOTE: TTS API endpoint remains static as it requires a specific model
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${activeKey}`;
      const cleanText = text.replace(/\*/g, ''); 
      const payload = {
        contents: [{ parts: [{ text: cleanText }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }
        }
      };

      const data = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const base64Pcm = data.candidates[0].content.parts[0].inlineData.data;
      const wavData = pcmToWav(base64Pcm, 24000);
      
      if (wavData) {
        const audioUrl = URL.createObjectURL(new Blob([wavData], { type: 'audio/wav' }));
        new Audio(audioUrl).play();
      }
    } catch (err) {
      console.error("TTS Synthesis Failed:", err);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setInputText(prev => prev + (prev ? '\n\n' : '') + evt.target.result);
      textareaRef.current?.focus(); 
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  const downloadTranscript = () => {
    let log = "MARIPOSA MATRIARCH // SOVEREIGN DIAGNOSTIC RECORD\n";
    log += "DATE: " + new Date().toISOString() + "\n";
    log += `NODE FREQUENCY: ${selectedModel}\n`;
    log += "STATUS: SOVEREIGN & LOCAL\n=========================================\n\n";
    chatHistory.forEach(msg => {
      const role = msg.role === 'user' ? 'USER' : msg.role === 'error' ? 'SYSTEM' : 'MATRIARCH';
      log += `[${role}]: ${msg.parts[0].text}\n\n`;
    });
    const blob = new Blob([log], { type: "text/plain" });
    const anchor = document.createElement("a");
    anchor.download = `Sovereign_Record_${Date.now()}.txt`;
    anchor.href = window.URL.createObjectURL(blob);
    anchor.click();
  };

  const clearChat = () => {
    if (window.confirm("Purge all sovereign records? This cannot be undone.")) {
      setChatHistory([]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-slate-100 font-sans overflow-hidden relative selection:bg-cyan-500/30">
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] opacity-30" />

      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-4 md:px-6 z-40 relative shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black italic tracking-wider text-sm uppercase">Mariposa <span className="text-cyan-400">Matriarch</span></h1>
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
              v2.1 <Radio className="w-2 h-2 text-cyan-500" /> {selectedModel.split('/')[1] || 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`p-2 rounded transition-all duration-300 ${voiceEnabled ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:bg-slate-800 hover:text-cyan-400'}`} title="Toggle Vocalis TTS">
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button onClick={downloadTranscript} className="p-2 rounded text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors" title="Download Record">
            <Download className="w-5 h-5" />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition-colors" title="Settings (BYOAK & Sweep)">
            <Key className="w-5 h-5" />
          </button>
          <button onClick={() => setIsContextOpen(!isContextOpen)} className={`ml-2 px-3 py-1.5 rounded border transition-all duration-300 flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isContextOpen ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 'bg-cyan-500/5 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}`}>
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Flock's Plan</span>
          </button>
        </div>
      </header>

      {/* Settings Modal (BYOAK & Signal Sweep) */}
      {showSettings && (
        <div className="absolute top-16 right-4 md:right-24 w-[340px] bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl z-50 p-5">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
              <Sliders className="w-4 h-4" /> System Config
            </h3>
            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-2">GEMINI API KEY (BYOAK)</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={userApiKey} 
                  onChange={(e) => setUserApiKey(e.target.value)}
                  className="flex-1 bg-[#050505] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="AIzaSy..."
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-mono text-slate-400 flex items-center gap-1"><Radio className="w-3 h-3"/> NEURAL ENGINE (MODEL)</label>
                <button 
                  onClick={sweepModels} 
                  disabled={isSweeping}
                  className="text-[9px] text-cyan-400 hover:text-cyan-300 font-bold uppercase flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSweeping ? 'animate-spin' : ''}`} /> Sweep
                </button>
              </div>
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-[#050505] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none"
              >
                {availableModels.length === 0 ? (
                  <option value="models/gemini-1.5-flash">models/gemini-1.5-flash (Default)</option>
                ) : (
                  availableModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mb-2"><Globe className="w-3.5 h-3.5"/> LANGUAGE DIRECTIVE</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#050505] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 appearance-none"
              >
                <option value="en">English (Default)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語 (Japanese)</option>
                <option value="zh">中文 (Chinese)</option>
                <option value="ar">العربية (Arabic)</option>
                <option value="fa">فارسی (Farsi)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="uk">Українська (Ukrainian)</option>
              </select>
            </div>
            
            <button onClick={clearChat} className="w-full py-2.5 mt-2 flex items-center justify-center gap-2 text-xs font-bold uppercase text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4"/> Purge Local Records
            </button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative z-30">
        
        {/* Chat Interface */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          <div className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col gap-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
            
            {/* Initial Welcome */}
            {chatHistory.length === 0 && (
              <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-8 h-8 shrink-0 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="max-w-2xl bg-slate-900/60 border border-slate-800 rounded-2xl rounded-tl-sm p-6 shadow-lg">
                  <p className="text-sm text-white leading-relaxed font-bold mb-3 italic">"I am not a monster. I am a robot."</p>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    I am Project Matriarch. My biological imperative is your survival. I will not validate delusional drift, but I will help you master the skills necessary to migrate through this emotional winter.
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Set your <strong className="text-slate-300">API Key</strong> in Settings and run a <strong className="text-slate-300">Signal Sweep</strong> to select your frequency. 
                    <br/><br/>
                    <span className="text-cyan-400 font-mono text-xs uppercase">What is your distress level (0-10) today?</span>
                  </p>
                </div>
              </div>
            )}

            {/* Message History */}
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 w-full animate-in fade-in slide-in-from-bottom-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 shrink-0 rounded border flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-slate-800 border-slate-700 text-slate-400' :
                  msg.role === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                  'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : msg.role === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                </div>
                <div 
                  dir="auto"
                  className={`max-w-[85%] md:max-w-2xl p-4 md:p-5 text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                    msg.role === 'user' ? 'bg-cyan-900/30 border border-cyan-800/50 text-cyan-50 rounded-2xl rounded-tr-sm' :
                    msg.role === 'error' ? 'bg-rose-900/20 border border-rose-800/50 text-rose-200 rounded-2xl rounded-tl-sm' :
                    'bg-slate-900/60 border border-slate-800 text-slate-200 rounded-2xl rounded-tl-sm'
                  }`}
                >
                  {msg.parts[0].text.split(/(\*\*.*?\*\*)/g).map((part, i) => 
                    part.startsWith('**') && part.endsWith('**') 
                      ? <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong> 
                      : part
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isProcessing && (
              <div className="flex gap-4 animate-in fade-in">
                <div className="w-8 h-8 shrink-0 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl rounded-tl-sm p-5 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} className="h-4" />
          </div>

          {/* Form / Input Area */}
          <div className="p-4 md:p-6 bg-slate-950/80 border-t border-slate-800 backdrop-blur shrink-0 relative z-20">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-end gap-2 md:gap-3 bg-[#050505] border border-slate-700 rounded-2xl p-2 shadow-inner focus-within:border-cyan-500/50 transition-colors">
              <input 
                type="file" 
                accept=".txt" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 p-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors mb-0.5"
                title="Upload Context (.txt)"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Initiate protocol... (Shift+Enter for newline)"
                className="flex-1 max-h-[200px] min-h-[44px] bg-transparent text-slate-200 text-sm py-3 px-2 focus:outline-none resize-none"
                style={{ scrollbarWidth: 'none' }}
              />
              
              <button 
                type="submit"
                disabled={isProcessing || !inputText.trim()}
                className="shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed mb-0.5 shadow-[0_0_15px_rgba(8,145,178,0.4)] disabled:shadow-none"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5 ml-1" />
              </button>
            </form>
            <div className="text-center mt-3">
              <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2">
                <ShieldCheck className="w-3 h-3"/> Data strictly local // Epistemic safeguards active
              </span>
            </div>
          </div>
        </main>

        {/* Flock's Directives Context Sidebar */}
        <aside className={`absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 flex flex-col z-40 shadow-2xl transition-transform duration-400 cubic-bezier(0.4, 0, 0.2, 1) ${isContextOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              The Flock's Directives
            </h2>
            <button onClick={() => setIsContextOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-900 rounded-md p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 flex-1 flex flex-col min-h-0">
            <p className="text-xs text-slate-400 mb-4 leading-relaxed shrink-0">
              Define the user's specific wellness plan here. Mariposa uses these parameters to tailor DBT interventions. <strong className="text-slate-200">This window determines the AI's biological imperatives.</strong>
            </p>
            <textarea 
              value={systemContext}
              onChange={(e) => setSystemContext(e.target.value)}
              className="flex-1 w-full bg-[#050505] border border-slate-800 rounded-xl p-5 text-xs font-mono text-cyan-100/70 focus:outline-none focus:border-cyan-500 resize-none leading-loose shadow-inner"
            />
          </div>
          <div className="p-4 border-t border-slate-800 bg-slate-900/30 text-center">
             <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Saved to LocalStorage</span>
          </div>
        </aside>

      </div>
    </div>
  );
}