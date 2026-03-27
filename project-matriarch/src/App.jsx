import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Volume2, VolumeX, ShieldCheck, Cpu, 
  User, AlertTriangle, BookOpen, Download, 
  Key, Trash2, Paperclip, Globe, X, RefreshCw, Radio, Sliders, Archive, Bookmark
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
  // --- State Management ---
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('matriarch_apiKey') || '');
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem('matriarch_chatHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [vault, setVault] = useState(() => {
    const saved = localStorage.getItem('matriarch_vault');
    return saved ? JSON.parse(saved) : [];
  });
  const [systemContext, setSystemContext] = useState(() => localStorage.getItem('matriarch_context') || DEFAULT_CONTEXT);
  const [language, setLanguage] = useState(() => localStorage.getItem('matriarch_language') || 'en');
  const [availableModels, setAvailableModels] = useState(() => {
    const saved = localStorage.getItem('matriarch_models');
    return saved ? JSON.parse(saved) : ['models/gemini-2.5-flash-preview-09-2025'];
  });
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('matriarch_selectedModel') || 'models/gemini-2.5-flash-preview-09-2025');

  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  // Panels
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Refs
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Persistence ---
  useEffect(() => { localStorage.setItem('matriarch_apiKey', userApiKey); }, [userApiKey]);
  useEffect(() => { localStorage.setItem('matriarch_chatHistory', JSON.stringify(chatHistory)); }, [chatHistory]);
  useEffect(() => { localStorage.setItem('matriarch_vault', JSON.stringify(vault)); }, [vault]);
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

  // --- Robust Markdown Parser ---
  const parseMarkdown = (text) => {
    if (!text) return { __html: '' };
    let html = text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") // Escape HTML
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="text-white font-bold italic">$1</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>')
      .replace(/_(.*?)_/g, '<em class="italic text-slate-300">$1</em>')
      .replace(/\n/g, '<br/>'); // Convert newlines
    return { __html: html };
  };

  // --- API & Logic ---
  const sweepModels = async () => {
    if (!userApiKey) return;
    setIsSweeping(true);
    try {
      const data = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models?key=${userApiKey}`);
      const valid = data.models
        .filter(m => m.supportedGenerationMethods.includes("generateContent"))
        .map(m => m.name);
      setAvailableModels(valid);
      if (valid.length > 0 && !valid.includes(selectedModel)) setSelectedModel(valid[0]);
    } catch (err) { console.error(err); }
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
        en: 'English', es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese', 
        zh: 'Chinese', ar: 'Arabic', fa: 'Farsi', hi: 'Hindi', uk: 'Ukrainian',
        pt: 'Portuguese', ru: 'Russian'
      };
      const directive = language !== 'en' ? `\n\n[LANGUAGE DIRECTIVE]: You MUST reply entirely in ${langNames[language]}.` : '';
      const finalContext = systemContext + directive;
      const history = [...chatHistory, newUserMsg].slice(-15).map(m => ({
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
    e.target.value = null; // Reset input
  };

  // --- Vault & Download Actions ---
  const getPreviousUserMessage = (index) => {
    for (let i = index - 1; i >= 0; i--) {
      if (chatHistory[i].role === 'user') return chatHistory[i].parts[0].text;
    }
    return 'Archived Trigger';
  };

  const pinToVault = (prompt, response) => {
    const newItem = {
      id: Date.now(),
      prompt,
      response,
      date: new Date().toISOString()
    };
    setVault(prev => [newItem, ...prev]);
    setIsVaultOpen(true);
    setIsContextOpen(false); // Close context to avoid overlap
  };

  const removeFromVault = (id) => {
    setVault(prev => prev.filter(item => item.id !== id));
  };

  const downloadSingle = (prompt, response) => {
    let log = `MARIPOSA MATRIARCH // SOVEREIGN SKILL RECORD\n`;
    log += `DATE: ${new Date().toISOString()}\n`;
    log += `=========================================\n\n`;
    log += `[TRIGGER/INPUT]: ${prompt}\n\n`;
    log += `[MATRIARCH SHIELD]:\n${response}\n`;

    const blob = new Blob([log], { type: "text/plain" });
    const anchor = document.createElement("a");
    anchor.download = `Mariposa_Skill_${Date.now()}.txt`;
    anchor.href = window.URL.createObjectURL(blob);
    anchor.click();
  };

  const downloadFullTranscript = () => {
    let log = "MARIPOSA MATRIARCH // FULL SESSION RECORD\n";
    log += "DATE: " + new Date().toISOString() + "\n";
    log += "========================================================\n\n";

    chatHistory.forEach(msg => {
      const role = msg.role === 'user' ? 'CLAIMANT' : msg.role === 'error' ? 'SYSTEM' : 'MATRIARCH';
      log += `[${role}]: ${msg.parts[0].text}\n\n`;
    });

    const blob = new Blob([log], { type: "text/plain" });
    const anchor = document.createElement("a");
    anchor.download = `Mariposa_Session_${Date.now()}.txt`;
    anchor.href = window.URL.createObjectURL(blob);
    anchor.click();
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-slate-100 font-sans overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] opacity-30" />

      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-40 shrink-0 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black italic tracking-widest text-sm uppercase">Mariposa <span className="text-cyan-400">Matriarch</span></h1>
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
              v2.6 <Radio className="w-2 h-2 text-cyan-500 animate-pulse" /> {selectedModel.split('/')[1] || 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={() => { setIsVaultOpen(!isVaultOpen); setIsContextOpen(false); }} className={`p-2 rounded transition-colors ${isVaultOpen ? 'text-amber-400 bg-slate-800' : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'}`} title="The Canon Vault">
            <Archive size={20} />
          </button>
          <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`p-2 rounded transition-colors ${voiceEnabled ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-cyan-400'}`} title="Toggle Vocalis (TTS)">
            {voiceEnabled ? <Volume2 size={20}/> : <VolumeX size={20}/>}
          </button>
          <button onClick={downloadFullTranscript} className="p-2 rounded text-slate-400 hover:bg-slate-800 hover:text-cyan-400" title="Download Full Sovereign Record">
            <Download size={20}/>
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded text-slate-400 hover:bg-slate-800 hover:text-cyan-400" title="Node Settings">
            <Sliders size={20}/>
          </button>
          <div className="w-px h-6 bg-slate-800 mx-1 md:mx-2"></div>
          <button onClick={() => { setIsContextOpen(!isContextOpen); setIsVaultOpen(false); }} className={`px-3 py-1.5 rounded border text-xs font-bold uppercase flex items-center gap-2 transition-all ${isContextOpen ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-cyan-500/5 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}`}>
            <BookOpen size={16}/> <span className="hidden sm:inline">Flock's Plan</span>
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute top-20 right-4 md:right-24 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6 text-xs font-bold uppercase tracking-widest text-cyan-400">
            <span className="flex items-center gap-2"><Sliders size={14}/> Node Settings</span>
            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white"><X size={16}/></button>
          </div>
          <div className="space-y-5">
            <div>
              <label className="text-[9px] font-mono text-slate-500 mb-1 block uppercase tracking-widest">Compiler API Key</label>
              <input type="password" value={userApiKey} onChange={e => setUserApiKey(e.target.value)} className="w-full bg-[#030303] border border-slate-700 rounded-lg p-3 text-xs text-slate-300 focus:border-cyan-500/50 outline-none transition-all" placeholder="AIzaSy..."/>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Neural Engine</label>
                <button onClick={sweepModels} className="text-[9px] text-cyan-400 font-bold uppercase flex items-center gap-1 hover:text-white transition-colors">
                  <RefreshCw size={10} className={isSweeping ? 'animate-spin' : ''}/> Sync
                </button>
              </div>
              <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="w-full bg-[#030303] border border-slate-700 rounded-lg p-3 text-xs text-slate-300 outline-none">
                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-mono text-slate-500 mb-1 block uppercase tracking-widest flex items-center gap-1">
                <Globe size={10}/> Interface Language
              </label>
              <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-[#030303] border border-slate-700 rounded-lg p-3 text-xs text-slate-300 outline-none">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="pt">Português</option>
              </select>
            </div>
            <button onClick={() => { if(window.confirm("Purge Session History? Vault will remain intact.")) setChatHistory([]); }} className="w-full py-3 mt-2 flex items-center justify-center gap-2 text-xs text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-all uppercase font-black tracking-widest">
              <Trash2 size={14}/> Clear Session
            </button>
          </div>
        </div>
      )}

      {/* Main UI Layout */}
      <div className="flex-1 flex overflow-hidden relative z-30">
        
        {/* Left Sidebar: Canon Vault */}
        <aside className={`absolute left-0 top-0 bottom-0 w-full sm:w-[400px] bg-slate-900/95 backdrop-blur-2xl border-r border-slate-800 flex flex-col z-50 shadow-2xl transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isVaultOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 bg-amber-950/20">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2"><Archive size={16}/> The Canon Vault</h2>
            <button onClick={() => setIsVaultOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={18}/></button>
          </div>
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {vault.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center mt-10">Vault is empty. Pin insights from Mariposa to build your Sovereign Record.</p>
            ) : (
              vault.map(item => (
                <div key={item.id} className="mb-6 p-5 rounded-2xl bg-black/40 border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1"><ShieldCheck size={12}/> Skill Anchored</span>
                    <button onClick={() => removeFromVault(item.id)} className="text-slate-600 hover:text-rose-400 transition-colors" title="Remove"><Trash2 size={14}/></button>
                  </div>
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2 italic border-l-2 border-slate-700 pl-3">"{item.prompt}"</p>
                  <div className="text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar pr-2" dangerouslySetInnerHTML={parseMarkdown(item.response)} />
                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-[9px] text-slate-600 uppercase tracking-widest mono">{new Date(item.date).toLocaleDateString()}</span>
                    <button onClick={() => downloadSingle(item.prompt, item.response)} className="text-[10px] uppercase font-bold text-slate-500 hover:text-cyan-400 flex items-center gap-1 transition-colors">
                      <Download size={12}/> Save
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Center: Chat Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#050505]">
          <div className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col gap-6 scroll-smooth custom-scrollbar">
            
            {/* Welcome Message */}
            {chatHistory.length === 0 && (
              <div className="flex gap-4 w-full animate-in fade-in slide-in-from-bottom-4">
                <div className="w-10 h-10 shrink-0 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <ShieldCheck size={20}/>
                </div>
                <div className="max-w-2xl bg-slate-900/60 border border-slate-800 rounded-2xl rounded-tl-none p-6 shadow-xl backdrop-blur-sm">
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    <strong className="text-white font-bold italic">"Kindness eases change. Love quiets fear."</strong>
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">
                    I am Mariposa, your Sovereign DBT Coach. I am programmed with Gentle Rigor to act as a Cognitive Shield. I will not validate philosophical spiraling, but I will anchor you to reality.
                  </p>
                  <ul className="text-xs text-slate-500 space-y-2 mb-4 mono">
                    <li>&gt; Configure your <strong>API Key</strong> in the Settings (sliders icon).</li>
                    <li>&gt; Hover over my responses to <strong>Pin</strong> breakthroughs or <strong>Download</strong> specific skills.</li>
                    <li>&gt; Update <strong>Flock's Plan</strong> on the right to customize your triggers.</li>
                  </ul>
                  <p className="text-sm text-cyan-400/80 font-bold tracking-wide mt-2">
                    What is your current distress level (0-10), and what are we navigating today?
                  </p>
                </div>
              </div>
            )}

            {/* Messages Map */}
            {chatHistory.map((msg, i) => {
              const isUser = msg.role === 'user';
              const isError = msg.role === 'error';
              const prevUserMsg = !isUser && !isError ? getPreviousUserMessage(i) : null;

              return (
                <div key={i} className={`flex gap-4 md:gap-6 w-full group animate-in fade-in slide-in-from-bottom-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 shrink-0 rounded-full border flex items-center justify-center ${isUser ? 'bg-slate-800 border-slate-700 text-slate-400 shadow-inner' : isError ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]'}`}>
                    {isUser ? <User size={20}/> : isError ? <AlertTriangle size={20}/> : <ShieldCheck size={20}/>}
                  </div>
                  
                  {/* Message Content & Action Bar */}
                  <div className={`relative max-w-[85%] md:max-w-3xl flex-1 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div dir="auto" className={`p-5 md:p-6 text-sm leading-loose shadow-xl ${isUser ? 'bg-slate-800/50 border border-slate-700 text-slate-200 rounded-2xl rounded-tr-none' : isError ? 'bg-rose-500/10 border border-rose-500/20 text-rose-200 font-mono text-xs uppercase rounded-2xl rounded-tl-none' : 'bg-slate-900/60 border border-slate-800 text-slate-300 backdrop-blur-sm rounded-2xl rounded-tl-none'}`} dangerouslySetInnerHTML={parseMarkdown(msg.parts[0].text)} />
                    
                    {/* Action Bar (Only for Matriarch responses) */}
                    {!isUser && !isError && (
                      <div className="absolute -right-2 md:-right-12 top-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={() => pinToVault(prevUserMsg, msg.parts[0].text)} className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-500 hover:text-amber-400 shadow-lg transition-colors" title="Pin Skill/Insight to Vault">
                          <Bookmark size={16}/>
                        </button>
                        <button onClick={() => downloadSingle(prevUserMsg, msg.parts[0].text)} className="p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-500 hover:text-cyan-400 shadow-lg transition-colors" title="Download This Audit">
                          <Download size={16}/>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isProcessing && (
              <div className="flex gap-4 md:gap-6 w-full animate-in fade-in">
                <div className="w-10 h-10 shrink-0 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <ShieldCheck size={20}/>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl rounded-tl-none p-5 flex items-center w-24">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} className="h-4" />
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-8 bg-slate-950/80 border-t border-slate-800 backdrop-blur shrink-0 relative z-20">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-3 bg-slate-900 border border-slate-700 rounded-3xl p-2 focus-within:border-cyan-500/50 transition-colors shadow-2xl">
              <input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="shrink-0 p-3 text-slate-500 hover:text-cyan-400 transition-colors" title="Upload Source (.txt)">
                <Paperclip size={20}/>
              </button>
              <textarea ref={textareaRef} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}} placeholder="Initiate language bypass... (Shift+Enter for new line)" className="flex-1 max-h-[200px] min-h-[44px] bg-transparent text-slate-200 text-sm py-3 px-2 outline-none resize-none custom-scrollbar placeholder-slate-600" />
              <button type="submit" disabled={isProcessing || !inputText.trim()} className="shrink-0 w-12 h-12 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                <Send size={20} className="ml-1"/>
              </button>
            </form>
          </div>
        </main>

        {/* Right Sidebar: Context / Flock's Plan */}
        <aside className={`absolute right-0 top-0 bottom-0 w-full sm:w-[400px] bg-slate-900/95 backdrop-blur-2xl border-l border-slate-800 flex flex-col z-40 shadow-2xl transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isContextOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 bg-cyan-950/20">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2"><BookOpen size={16}/> The Flock's Directives</h2>
            <button onClick={() => setIsContextOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={18}/></button>
          </div>
          <div className="p-6 flex-1 flex flex-col min-h-0">
            <p className="text-[10px] text-slate-500 mb-4 leading-relaxed uppercase tracking-widest mono">
              Define Sovereign Context. Mariposa uses these parameters for DBT interventions.
            </p>
            <textarea value={systemContext} onChange={e => setSystemContext(e.target.value)} className="flex-1 w-full bg-[#030303] border border-slate-800 rounded-xl p-5 text-xs font-mono text-slate-400 focus:outline-none focus:border-cyan-500/50 resize-none leading-loose shadow-inner custom-scrollbar" />
          </div>
        </aside>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}} />
    </div>
  );
}