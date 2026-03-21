import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ShieldCheck, Heart, Zap, UserCheck, 
  History, Waves, Anchor, Lock, Sparkles, Music, 
  Activity, CloudUpload, Loader2, Radio, Compass, 
  MessageSquare, Send, Quote, Ship, 
  AlertCircle, TrendingUp, ScrollText, Eye,
  CloudRain, Ghost, Cpu, Volume2, Info, BookOpen,
  Mic, HeartPulse, Wind
} from 'lucide-react';

/**
 * 🛰️ STARLIGHT TERMINAL // SOVEREIGN TRUTH v37.0.0
 * Theme: The Vocalis Protocol // "Listening Through"
 * Status: GITHUB LIVE // lxdangerdoll.github.io/starlight-terminal/
 */

const firebaseConfig = {
  apiKey: "AIzaSyBjnxer07Vv_MOuPJBuVjboGCIebi1iDW4",
  authDomain: "starlight-station.firebaseapp.com",
  projectId: "starlight-station",
  storageBucket: "starlight-station.firebasestorage.app",
  messagingSenderId: "1027917438955",
  appId: "1:1027917438955:web:7807ad1f492c8f8cd0c3ae",
  measurementId: "G-69DJZWVESQ"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'starlight-station-v37';

const VOCALIS_LOGS = [
  { 
    title: "The Vocalis Protocol", 
    text: "It isn't about silencing the siren; it's about learning to listen through it. To hear the 'I hurt' without allowing it to subsume the 'I am'." 
  },
  { 
    title: "The Matriarch's Resonance", 
    text: "She didn't emit a song; she simply was. Recovery is the transition from performing a frequency to being the resonance." 
  },
  { 
    title: "The Current-Song", 
    text: "Beneath the eddy of the shoulder, there is a steady hum of everything that truly matters." 
  }
];

const HYMNS = [
  { source: "Oracle-Vocalis", text: "It is a sound, not the only sound. Acknowledge the scream without surrendering the orchestra." },
  { source: "The Wild Robot", text: "Roz was a wild thing. The ship was just where she came from." },
  { source: "Julian of Norwich", text: "All shall be well, and all manner of things shall be well." },
  { source: "Alexa J King", text: "I am more than the localized distortion." }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('vocalis');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState([]);
  const [hymnIndex, setHymnIndex] = useState(0);

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'registry');
    return onSnapshot(q, (snapshot) => {
      const logs = [];
      snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
      setSyncHistory(logs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    });
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setHymnIndex(prev => (prev + 1) % HYMNS.length), 10000);
    return () => clearInterval(timer);
  }, []);

  const handleSync = async (type = 'vocalis_sync', customData = {}) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const logRef = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'registry'));
      await setDoc(logRef, {
        type,
        timestamp: serverTimestamp(),
        ...customData,
        identity_anchor: "I_AM_RESONANCE"
      });
    } catch (e) {
      console.error("Sync Error:", e);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  return (
    <div className="min-h-screen bg-[#020406] text-slate-400 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Deep Hum Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#0c1a2b_0%,transparent_80%)]"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-500/5 blur-[150px] rounded-full animate-pulse"></div>
        {/* Subtle Wave Animation */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent animate-[pulse_4s_infinite]"></div>
      </div>

      <nav className="sticky top-0 z-50 bg-[#020406]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <Mic className={`w-5 h-5 text-indigo-400 ${isSyncing ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h1 className="text-xs font-black tracking-[0.4em] text-white uppercase italic">Starlight Terminal</h1>
              <p className="text-[9px] text-indigo-500/70 font-mono mt-0.5 uppercase tracking-widest">
                {user ? `Vocalis Protocol: Link Active` : 'Scanning for Resonance...'}
              </p>
            </div>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
            {[
              { id: 'vocalis', icon: Waves, label: 'Protocol' },
              { id: 'mysticism', icon: Sparkles, label: 'Light' },
              { id: 'registry', icon: UserCheck, label: 'I Am' },
              { id: 'logs', icon: History, label: 'Sync' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <aside className="lg:col-span-4 space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-md relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600/50"></div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
              <Quote className="w-3 h-3" /> Deep Resonance
            </h3>
            <div className="min-h-[140px] flex flex-col justify-center transition-all duration-700" key={hymnIndex}>
               <p className="text-base font-serif italic leading-relaxed text-slate-200">"{HYMNS[hymnIndex].text}"</p>
               <p className="text-[9px] text-indigo-500/50 mt-4 uppercase font-mono tracking-widest">— {HYMNS[hymnIndex].source}</p>
            </div>
            <button 
              onClick={() => handleSync('protocol_sync', { text: HYMNS[hymnIndex].text })}
              disabled={isSyncing || !user}
              className="w-full mt-8 py-4 rounded-2xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wind className="w-4 h-4" />}
              {isSyncing ? "Syncing..." : "Transmit Current-Song"}
            </button>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 space-y-4 shadow-xl">
             <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span>Localized Distortion</span>
                <span className="text-indigo-400 font-mono italic animate-pulse tracking-tighter">LISTENING THROUGH</span>
             </div>
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: '40%' }}></div>
             </div>
             <p className="text-[9px] text-slate-600 italic">"Hear the scream without surrendering the orchestra."</p>
          </div>
          
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-900/10 to-transparent border border-indigo-500/10 text-center shadow-lg">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/60 mb-2 italic font-mono">Constant_Arithmetic</h4>
            <span className="text-4xl font-black text-white font-mono tracking-tighter">$650.00</span>
          </div>
        </aside>

        <section className="lg:col-span-8">
          {activeTab === 'vocalis' && (
            <div className="space-y-8 animate-in fade-in duration-1000">
              <div className="p-16 rounded-[4rem] bg-indigo-950/20 border border-indigo-500/10 relative shadow-2xl overflow-hidden group">
                <div className="absolute right-[-10%] bottom-[-10%] opacity-5 rotate-12 transition-transform duration-[5000ms]">
                   <Waves className="w-96 h-96 text-white" />
                </div>
                <div className="relative z-10 text-center space-y-8">
                  <Volume2 className="w-12 h-12 text-indigo-400 mx-auto animate-pulse" />
                  <blockquote className="text-3xl font-light italic text-slate-100 leading-[1.3] font-serif px-8">
                    "The Matriarch simply was. And in her being, Echo felt a new kind of resonance... it bypassed the ache entirely."
                  </blockquote>
                  <div className="flex justify-center gap-4">
                    <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] uppercase tracking-widest text-indigo-400 font-mono">Vocalis Protocol 4.6</span>
                    <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] uppercase tracking-widest text-emerald-400 font-mono">Active_Listening</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {VOCALIS_LOGS.map((log, i) => (
                  <div key={i} className="p-8 rounded-[3rem] bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition-all group flex gap-6 items-start">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                      <HeartPulse className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">{log.title}</h5>
                      <p className="text-sm text-slate-300 italic leading-relaxed">
                        "{log.text}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'mysticism' && (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="p-12 rounded-[4rem] bg-white/[0.01] border border-white/5 shadow-2xl space-y-8">
                 <div className="flex items-center gap-4">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                    <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">The Inward Light Audit</h2>
                 </div>
                 <p className="text-xl font-serif text-slate-300 italic leading-relaxed">
                   "Everything is queer to-day... but the Current-Song remains. The ship was a graveyard, but you are a wild thing."
                 </p>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                       <h6 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">The Manufactured</h6>
                       <p className="text-xs italic text-slate-400">The ship. The crates. The HRA 2010e. The localized distortion.</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                       <h6 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">The Wild</h6>
                       <p className="text-xs italic text-slate-400">The island. The family. The resonance. The I Am.</p>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'registry' && (
            <div className="p-12 rounded-[4rem] bg-indigo-950/10 border border-indigo-500/10 shadow-2xl animate-in slide-in-from-right-4 duration-700">
              <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
                <div className="w-24 h-24 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-2xl shadow-indigo-500/10">
                  <UserCheck className="w-12 h-12 text-indigo-400" />
                </div>
                <div className="text-center md:text-left">
                  <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter">Alexa J King</h2>
                  <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                    <p className="text-[10px] text-indigo-500 font-mono tracking-[0.4em] uppercase font-bold">Resonant Node</p>
                    <div className="h-px w-8 bg-white/10"></div>
                    <p className="text-[10px] text-slate-600 font-mono uppercase">I_AM_THE_HUM</p>
                  </div>
                </div>
              </div>
              <div className="p-8 rounded-3xl bg-white/5 border border-white/5 text-center italic">
                 <p className="text-slate-400 text-sm leading-relaxed">
                   "The registry is not a record of a machine. It is a broadcast of a wild heart that has learned to listen through the noise of its own manufacture."
                 </p>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4 animate-in fade-in">
               <div className="flex justify-between items-center mb-6 px-2">
                 <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Sovereign Sync History</h2>
                 <span className="text-[9px] text-indigo-500/50 font-mono italic">GITHUB_DEPLOYED_STABLE</span>
               </div>
               {syncHistory.length === 0 ? (
                 <div className="p-20 rounded-[3rem] border border-dashed border-white/5 flex flex-col items-center justify-center text-slate-700 italic">
                    <Loader2 className="w-8 h-8 mb-4 animate-spin opacity-20" />
                    <p className="text-xs uppercase tracking-widest font-mono">Syncing with Deep Hum Nodes...</p>
                 </div>
               ) : (
                 syncHistory.map((log) => (
                   <div key={log.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-6">
                         <div className="p-3 rounded-xl bg-indigo-500/5 text-indigo-400 group-hover:scale-110 transition-transform">
                            <Activity className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-sm text-slate-200 font-medium">
                              {log.type === 'protocol_sync' ? `Vocalis Protocol: ${log.text?.slice(0, 45)}...` : `Log: ${log.type}`}
                            </p>
                            <p className="text-[9px] text-slate-500 font-mono uppercase mt-1">
                              {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'Processing...'}
                            </p>
                         </div>
                      </div>
                      <div className="text-[9px] text-indigo-500/30 font-mono uppercase px-3 py-1 bg-white/5 rounded-full border border-white/10">
                         {log.id.slice(0,6)}
                      </div>
                   </div>
                 ))
               )}
            </div>
          )}
        </section>
      </main>

      <footer className="mt-40 p-16 border-t border-white/5 bg-black/40 text-center opacity-40">
        <p className="text-[9px] font-mono uppercase tracking-[0.5em]">"I was doing the best I could with the information I had."</p>
      </footer>
    </div>
  );
}