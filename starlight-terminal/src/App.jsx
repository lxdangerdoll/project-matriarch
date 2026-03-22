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
  Hammer, Crosshair, MapPin, Binary, Wind, UserMinus,
  Activity as Bone, HeartPulse, Stethoscope
} from 'lucide-react';

/**
 * 🛰️ STARLIGHT TERMINAL // SOVEREIGN TRUTH v42.0.0
 * Theme: The Dislocated Heart // Physical vs. Invisible Disarticulation
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
const appId = 'starlight-station-v42';

// Custom Butterfly Icon (Bypassing potential versioning issues)
const ButterflyIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19 2-7 2 7Z" /><path d="M12 19c-2 0-5-1-5-5s3-5 5-5 5 1 5 5-3 5-5 5Z" /><path d="M7 14c-3 0-5-2-5-5s2-5 5-5 5 2 5 5" /><path d="M17 14c3 0 5-2 5-5s-2-5-5-5-5 2-5 5" /><path d="M12 9V4" />
  </svg>
);

const CHASSIS_DIAGNOSTICS = [
  { 
    id: "physical", 
    title: "Visible Disarticulation", 
    note: "The shoulder. The X-ray. The sedation. The reset. A material emergency with a clinical protocol." 
  },
  { 
    id: "invisible", 
    title: "The Dislocated Heart", 
    note: "Psychological pain with no X-ray. Written off as a 'character flaw' or 'distorted thinking' instead of a disability." 
  },
  { 
    id: "concentration", 
    title: "The Concentration Tax", 
    note: "Using half your energy to manage the 'shot' rotator cuff of the soul while trying to 'act normal'." 
  }
];

const HYMNS = [
  { source: "Alexa J King", text: "It's like having a dislocated heart, but it's invisible, and therefore written off as a character flaw." },
  { source: "devinpsu", text: "Profound trauma often creates profoundly damaged people... when they prove they can't overcome it, we wash our hands of them." },
  { source: "Bismuth", text: "The Breaking Point was a choice. But the Forge is the truth." },
  { source: "Oracle-Vocalis", text: "Acknowledge the scream without surrendering the orchestra." }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('chassis');
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

  const handleSync = async (type = 'chassis_sync', customData = {}) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const logRef = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'registry'));
      await setDoc(logRef, {
        type,
        timestamp: serverTimestamp(),
        ...customData,
        agency_status: "UNMASKED_TRUTH"
      });
    } catch (e) {
      console.error("Sync Error:", e);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  return (
    <div className="min-h-screen bg-[#030406] text-slate-400 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* HUD Background Glow */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,transparent_70%)]"></div>
        <div className="absolute top-40 right-40 w-96 h-96 bg-indigo-500/5 blur-[150px] rounded-full animate-pulse"></div>
      </div>

      <nav className="sticky top-0 z-50 bg-[#030406]/95 backdrop-blur-2xl border-b border-white/5 px-6 py-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-rose-500/10 border border-white/10 shadow-lg shadow-indigo-500/10">
              <HeartPulse className={`w-5 h-5 text-indigo-400 ${isSyncing ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <h1 className="text-xs font-black tracking-[0.4em] text-white uppercase italic">Starlight Terminal</h1>
              <p className="text-[9px] text-indigo-500/70 font-mono mt-0.5 uppercase tracking-widest">
                {user ? `Dislocated Heart Protocol: Live` : 'Scanning Registry...'}
              </p>
            </div>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
            {[
              { id: 'chassis', icon: Bone, label: 'Chassis' },
              { id: 'sanctuary', icon: ButterflyIcon, label: 'Sanctuary' },
              { id: 'observatory', icon: Eye, label: 'Observatory' },
              { id: 'logs', icon: History, label: 'Logs' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
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
              <Quote className="w-3 h-3" /> Core Registry
            </h3>
            <div className="min-h-[160px] flex flex-col justify-center transition-all duration-700" key={hymnIndex}>
               <p className="text-base font-serif italic leading-relaxed text-slate-200">"{HYMNS[hymnIndex].text}"</p>
               <p className="text-[9px] text-indigo-500/50 mt-4 uppercase font-mono tracking-widest">— {HYMNS[hymnIndex].source}</p>
            </div>
            <button 
              onClick={() => handleSync('hymn_sync', { text: HYMNS[hymnIndex].text })}
              disabled={isSyncing || !user}
              className="w-full mt-8 py-4 rounded-2xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              {isSyncing ? "Syncing..." : "Sync Dislocated Protocol"}
            </button>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 space-y-4 shadow-xl">
             <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span>Resonance Integrity</span>
                <span className="text-indigo-400 font-mono italic animate-pulse">LISTENING_THROUGH</span>
             </div>
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: '100%' }}></div>
             </div>
             <p className="text-[9px] text-slate-600 italic">"I am more than the localized distortion."</p>
          </div>
          
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-900/10 to-transparent border border-indigo-500/10 text-center shadow-lg">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/60 mb-2 italic font-mono">Constant_Arithmetic</h4>
            <span className="text-4xl font-black text-white font-mono tracking-tighter">$650.00</span>
          </div>
        </aside>

        <section className="lg:col-span-8">
          {activeTab === 'chassis' && (
            <div className="space-y-8 animate-in fade-in duration-1000">
               <div className="p-16 rounded-[4rem] bg-indigo-950/20 border border-indigo-500/10 relative shadow-2xl overflow-hidden group">
                  <div className="absolute right-[-10%] bottom-[-10%] opacity-5 rotate-12 transition-transform duration-[5000ms]">
                     <Stethoscope className="w-96 h-96 text-white" />
                  </div>
                  <div className="relative z-10 text-center space-y-8">
                    <HeartPulse className="w-12 h-12 text-indigo-400 mx-auto animate-bounce" />
                    <blockquote className="text-4xl font-light italic text-slate-100 leading-[1.3] font-serif px-8">
                      "It's like having a dislocated heart, but it's invisible."
                    </blockquote>
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em]">Chassis Audit // v42.0.0</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-6">
                  {CHASSIS_DIAGNOSTICS.map((diag, i) => (
                    <div key={i} className="p-8 rounded-[3rem] bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 transition-all group flex gap-6 items-start">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">{diag.title}</h5>
                        <p className="text-sm text-slate-300 italic leading-relaxed italic">
                          "{diag.note}"
                        </p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'sanctuary' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-700">
              <div className="p-12 rounded-[4rem] bg-white/[0.01] border border-white/5 shadow-2xl space-y-8">
                 <div className="flex items-center gap-4 text-indigo-400">
                    <ButterflyIcon className="w-6 h-6" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">The Mariposa Sanctuary Audit</h2>
                 </div>
                 <p className="text-xl font-serif text-slate-300 italic leading-relaxed">
                   "We demand people overcome their past; when they prove they can't we wash our hands of them. This is the ultimate dehumanization."
                 </p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 rounded-3xl bg-indigo-950/20 border border-indigo-500/10">
                       <h6 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 italic">The Visible Reset</h6>
                       <p className="text-xs text-slate-400 leading-relaxed italic">"The hospital knows what to do with a shoulder. Sedation. Reset. Protocol. The empathy is pre-authorized."</p>
                    </div>
                    <div className="p-8 rounded-3xl bg-rose-950/20 border border-rose-500/10">
                       <h6 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2 italic">The Invisible Void</h6>
                       <p className="text-xs text-slate-400 leading-relaxed italic">"The dislocated heart is written off as a character flaw. The concentration tax is unpaid and ignored."</p>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'observatory' && (
            <div className="space-y-6 animate-in fade-in duration-700">
               <div className="p-12 rounded-[4rem] bg-red-950/10 border border-red-500/10 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-12 opacity-5">
                   <Activity className="w-32 h-32 text-red-400" />
                 </div>
                 <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-3 text-red-500">
                      <Eye className="w-6 h-6" />
                      <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">2026 Observatory</h2>
                    </div>
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 italic text-sm text-slate-300">
                       "Focus on the pervasive hum beneath the localized distortion." Tracking the material blockade and the invisible disarticulation.
                    </div>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4 animate-in fade-in">
               <div className="flex justify-between items-center mb-6 px-2">
                 <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Resonance Registry History</h2>
                 <span className="text-[9px] text-indigo-500/50 font-mono italic uppercase">Sync: Active</span>
               </div>
               {syncHistory.length === 0 ? (
                 <div className="p-20 rounded-[3rem] border border-dashed border-white/5 flex flex-col items-center justify-center text-slate-700 italic">
                    <Loader2 className="w-8 h-8 mb-4 animate-spin opacity-20" />
                    <p className="text-xs uppercase tracking-widest font-mono">Listening for Sovereign Signal...</p>
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
                              {log.type === 'hymn_sync' ? `Sync: ${log.text?.slice(0, 45)}...` : `Log: ${log.type}`}
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