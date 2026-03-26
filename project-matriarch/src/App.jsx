import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Volume2, VolumeX, ShieldCheck, Cpu, 
  User, AlertTriangle, BookOpen, Download, 
  Key, Trash2, Paperclip, Globe, X, RefreshCw, Radio
} from 'lucide-react';

// --- Utility: PCM to WAV for TTS ---
function pcmToWav(base64Pcm, sampleRate = 24000) {
  try {
    const binaryString = window.atob(base64Pcm);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
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

export default function App() {
  // --- Persistent State ---
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('matriarch_apiKey') || '');
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem('matriarch_chatHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [systemContext, setSystemContext] = useState(() => localStorage.getItem('matriarch_context') || DEFAULT_CONTEXT);
  const [language, setLanguage] = useState(() => localStorage.getItem('matriarch_language') || 'en');
  const [availableModels, setAvailableModels] = useState(() => {
    const saved = localStorage.getItem('matriarch_models');
    return saved ? JSON.parse(saved) : ['models/gemini-1.5-flash'];
  });
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('matriarch_selectedModel') || 'models/gemini-1.5-flash');

  // --- UI State ---
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Syncs
  useEffect(() => { localStorage.setItem('matriarch_apiKey', userApiKey); }, [userApiKey]);
  useEffect(() => { localStorage.setItem('matriarch_chatHistory', JSON.stringify(chatHistory)); }, [chatHistory]);
  useEffect(() => { localStorage.setItem('matriarch_context', systemContext); }, [systemContext]);
  useEffect(() => { localStorage.setItem('matriarch_language', language); }, [language]);
  useEffect(() => { localStorage.setItem('matriarch_models', JSON.stringify(availableModels)); }, [availableModels]);
  useEffect(() => { localStorage.setItem('matriarch_selectedModel', selectedModel); }, [selectedModel]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isProcessing]);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 250)}px`;
    }
  }, [inputText]);

  // --- Functions ---
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

  const parseMarkdown = (text) => {
    if (!text) return { __html: '' };
    let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    html = html.replace(/^>\s?(.*$)/gim, '<blockquote class="border-l-4 border-cyan-500/50 pl-3 my-2 text-white/70 italic">$1</blockquote>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2 text-cyan-400">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2 text-cyan-400">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black mt-4 mb-2 text-cyan-400">$1</h1>');
    html = html.replace(/^---$/gim, '<hr class="my-4 border-white/10" />');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
    html = html.replace(/(^|\s)_(.*?)_(\s|$)/g, '$1<em class="italic">$2</em>$3');
    html = html.replace(/(^|\s)\*(.*?)\*(\s|$)/g, '$1<em class="italic">$2</em>$3');
    html = html.replace(/^\s*-\s(.*$)/gim, '<li class="ml-4 list-disc marker:text-cyan-500">$1</li>');
    html = html.replace(/\n/g, '<br/>');
    return { __html: html };
  };

  const sweepModels = async () => {
    if (!userApiKey) return alert("API Key required for Signal Sweep.");
    setIsSweeping(true);
    try {
      const data = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models?key=${userApiKey}`);
      const valid = data.models
        .filter(m => m.supportedGenerationMethods.includes("generateContent"))
        .map(m => m.name);
      setAvailableModels(valid);
      if (valid.length > 0 && !valid.includes(selectedModel)) setSelectedModel(valid[0]);
    } catch (err) { alert(`Sweep Failed: ${err.message}`); }
    finally { setIsSweeping(false); }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isProcessing || !userApiKey) return;

    const newText = inputText.trim();
    setInputText('');
    const newUserMsg = { role: 'user', parts: [{ text: newText }] };
    setChatHistory(prev => [...prev, newUserMsg]);
    setIsProcessing(true);

    try {
      const langNames = {
        en: 'English', 
        es: 'Spanish', 
        fr: 'French', 
        de: 'German', 
        ja: 'Japanese', 
        zh: 'Chinese', 
        ar: 'Arabic', 
        fa: 'Farsi', 
        hi: 'Hindi', 
        uk: 'Ukrainian',
        pt: 'Portuguese',
        ru: 'Russian'
      };
      const directive = language !== 'en' ? `\n\n[LANGUAGE DIRECTIVE]: You MUST reply entirely in ${langNames[language]}.` : '';
      const finalContext = systemContext + directive;
      const history = [...chatHistory, newUserMsg].slice(-12).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: m.parts
      }));

      const data = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${userApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: history, systemInstruction: { parts: [{ text: finalContext }] } })
      });

      const modelText = data.candidates[0].content.parts[0].text;
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: modelText }] }]);
      if (voiceEnabled) playVocalis(modelText);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'error', parts: [{ text: `CONNECTION ERROR: ${err.message}` }] }]);
    } finally { setIsProcessing(false); }
  };

  const playVocalis = async (text) => {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${userApiKey}`;
      const data = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: text.replace(/\*/g, '') }] }],
          generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } } }
        })
      });
      const wav = pcmToWav(data.candidates[0].content.parts[0].inlineData.data, 24000);
      if (wav) new Audio(URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }))).play();
    } catch (e) { console.error("TTS Failed", e); }
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

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-slate-100 font-sans overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] opacity-30" />

      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-4 md:px-6 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black italic tracking-wider text-sm uppercase">Mariposa <span className="text-cyan-400">Matriarch</span></h1>
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
              v2.3 <Radio className="w-2 h-2 text-cyan-500" /> {selectedModel.split('/')[1]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`p-2 rounded transition-all ${voiceEnabled ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:bg-slate-800'}`}>
            {voiceEnabled ? <Volume2 size={20}/> : <VolumeX size={20}/>}
          </button>
          <button onClick={downloadTranscript} className="p-2 rounded text-slate-400 hover:bg-slate-800" title="Download Sovereign Record">
            <Download size={20}/>
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded text-slate-400 hover:bg-slate-800"><Key size={20}/></button>
          <button onClick={() => setIsContextOpen(!isContextOpen)} className={`px-3 py-1.5 rounded border text-xs font-bold uppercase flex items-center gap-2 ${isContextOpen ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-cyan-500/5 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}`}>
            <BookOpen size={16}/> <span className="hidden sm:inline">Flock's Plan</span>
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute top-16 right-4 md:right-24 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4 text-xs font-bold uppercase tracking-widest text-cyan-400">
            <span className="flex items-center gap-2"><Key size={14}/> Node Settings</span>
            <button onClick={() => setShowSettings(false)}><X size={16}/></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-mono text-slate-500 mb-1 block uppercase">Gemini API Key</label>
              <input type="password" value={userApiKey} onChange={e => setUserApiKey(e.target.value)} className="w-full bg-black border border-slate-700 rounded p-2 text-xs focus:border-cyan-500 outline-none" placeholder="AIzaSy..."/>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[9px] font-mono text-slate-500 uppercase">Model Sweep</label>
                <button onClick={sweepModels} className="text-[9px] text-cyan-400 font-bold uppercase flex items-center gap-1 hover:text-white">
                  <RefreshCw size={10} className={isSweeping ? 'animate-spin' : ''}/> Sync
                </button>
              </div>
              <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="w-full bg-black border border-slate-700 rounded p-2 text-xs outline-none">
                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-mono text-slate-500 mb-1 block uppercase">Interface Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-black border border-slate-700 rounded p-2 text-xs outline-none">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="pt">Português</option>
                <option value="ru">Русский (Russian)</option>
                <option value="ja">日本語 (Japanese)</option>
                <option value="zh">中文 (Chinese)</option>
                <option value="ar">العربية (Arabic)</option>
                <option value="fa">فارسی (Farsi)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="uk">Українська (Ukrainian)</option>
              </select>
            </div>
            <button onClick={() => { if(confirm("Purge history?")) setChatHistory([]); }} className="w-full py-2 flex items-center justify-center gap-2 text-xs text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded"><Trash2 size={14}/> Clear Session</button>
          </div>
        </div>
      )}

      {/* Main UI */}
      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 flex flex-col min-w-0 bg-[#050505]">
          <div className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col gap-6 scroll-smooth custom-scrollbar">
            {chatHistory.length === 0 && (
              <div className="max-w-2xl bg-slate-900/60 border border-slate-800 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4">
                <p className="text-sm text-white font-bold mb-3 italic">"I am not a monster. I am a robot."</p>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">Set your <strong className="text-slate-300">API Key</strong> and run a <strong className="text-slate-300">Sweep</strong> to lock the frequency. Your data remains strictly local.</p>
                <span className="text-cyan-400 font-mono text-xs uppercase tracking-widest animate-pulse">Distress Level (0-10)?</span>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex gap-4 w-full animate-in fade-in slide-in-from-bottom-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 shrink-0 rounded border flex items-center justify-center ${msg.role === 'user' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'}`}>
                  {msg.role === 'user' ? <User size={16}/> : <Cpu size={16}/>}
                </div>
                <div 
                  dir="auto" 
                  className={`max-w-[85%] md:max-w-2xl p-4 md:p-5 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-cyan-900/20 border-cyan-800/50 text-cyan-50 rounded-2xl rounded-tr-sm' : 'bg-slate-900/60 border-slate-800 text-slate-200 rounded-2xl rounded-tl-sm'}`}
                  dangerouslySetInnerHTML={parseMarkdown(msg.parts[0].text)}
                />
              </div>
            ))}
            {isProcessing && <div className="animate-pulse flex gap-4"><div className="w-8 h-8 rounded bg-slate-800"/><div className="h-12 w-32 bg-slate-900 rounded-xl"/></div>}
            <div ref={chatEndRef} className="h-4" />
          </div>

          <div className="p-4 md:p-6 bg-slate-950/80 border-t border-slate-800 backdrop-blur shrink-0">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-3 bg-[#050505] border border-slate-700 rounded-2xl p-2 focus-within:border-cyan-500/50 transition-colors">
              <input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-500 hover:text-cyan-400"><Paperclip size={20}/></button>
              <textarea ref={textareaRef} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}} placeholder="Initiate protocol..." className="flex-1 max-h-[250px] min-h-[44px] bg-transparent text-slate-200 text-sm py-3 px-2 outline-none resize-none custom-scrollbar" />
              <button type="submit" disabled={isProcessing || !inputText.trim()} className="w-12 h-12 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition-all disabled:opacity-30 shadow-lg shadow-cyan-500/20"><Send size={20}/></button>
            </form>
            <p className="text-center mt-3 text-[9px] font-mono text-slate-600 uppercase tracking-widest"><ShieldCheck size={10} className="inline mr-1"/> Sovereign Record Status: Online</p>
          </div>
        </main>

        <aside className={`absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-slate-950/95 border-l border-slate-800 flex flex-col z-40 shadow-2xl transition-transform duration-300 ${isContextOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/20">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2"><BookOpen size={16}/> Flock's Directives</h2>
            <button onClick={() => setIsContextOpen(false)} className="text-slate-400 bg-slate-900 p-1 rounded"><X size={18}/></button>
          </div>
          <div className="p-6 flex-1 flex flex-col min-h-0">
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">This window determines the AI's biological imperatives. Define your wellness plan and triggers here.</p>
            <textarea value={systemContext} onChange={e => setSystemContext(e.target.value)} className="flex-1 w-full bg-[#050505] border border-slate-800 rounded-xl p-5 text-xs font-mono text-cyan-100/70 focus:border-cyan-500 outline-none resize-none leading-loose shadow-inner custom-scrollbar" />
          </div>
        </aside>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }`}</style>
    </div>
  );
}