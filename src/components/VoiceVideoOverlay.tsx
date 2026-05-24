/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Minimize2, 
  Maximize2, 
  RotateCw, 
  Radio, 
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { TranslationSet } from "../languages";

interface CallSession {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'voice' | 'video';
  direction: 'incoming' | 'outgoing';
  status: 'connecting' | 'ringing' | 'connected' | 'ended';
}

interface VoiceVideoOverlayProps {
  session: CallSession;
  onHangup: (duration: number) => void;
  onAccept: () => void;
  langSet: TranslationSet;
}

export function VoiceVideoOverlay({ session, onHangup, onAccept, langSet }: VoiceVideoOverlayProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isCamOff, setIsCamOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [usingFrontCam, setUsingFrontCam] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [hasCamPermission, setHasCamPermission] = useState(false);

  // Sound generator parameters
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // Dynamic Call timer counting
  useEffect(() => {
    let timer: any;
    if (session.status === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      clearInterval(timer);
    };
  }, [session.status]);

  // Handle local camera feed capture for actual Video Calls!
  useEffect(() => {
    if (session.type === 'video' && session.status === 'connected' && !isCamOff) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          setMediaStream(stream);
          setHasCamPermission(true);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn("Camera hardware access rejected or not available:", err);
          setHasCamPermission(false);
        });
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [session.status, session.type, isCamOff]);

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
  };

  // Play a mock simulated satellite synth ringtone using the Web Audio API!
  useEffect(() => {
    if (session.status === 'ringing' || session.status === 'connecting') {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        
        // Setup rapid digital ring pulse
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(session.direction === 'incoming' ? 440 : 350, audioCtx.currentTime);
        
        // Modulate volume like a phone pulse
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        
        const pulseInterval = setInterval(() => {
          if (audioCtx.state === 'closed') return;
          gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.6);
        }, 1500);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start();
        
        oscillatorRef.current = osc;

        return () => {
          clearInterval(pulseInterval);
          osc.stop();
          audioCtx.close();
        };
      } catch (e) {
        console.warn("AudioContext ringtone simulation bypass:", e);
      }
    }
  }, [session.status, session.direction]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleMuteToggle = () => setIsMuted(!isMuted);
  const handleSpeakerToggle = () => setIsSpeakerOn(!isSpeakerOn);
  const handleCamToggle = () => setIsCamOff(!isCamOff);
  const handleSwitchCam = () => setUsingFrontCam(!usingFrontCam);

  const getStatusText = () => {
    switch (session.status) {
      case 'connecting': return langSet.callConnecting;
      case 'ringing': return session.direction === 'incoming' ? langSet.callIncoming : langSet.callOutgoing;
      case 'connected': return langSet.callConnected;
      case 'ended': return langSet.callEnded;
      default: return "";
    }
  };

  // FULLSCREEN OR FLOATING MINIMIZED LAYOUT
  if (isMinimized) {
    return (
      <motion.div
        drag
        dragMomentum={false}
        className="fixed bottom-20 right-4 z-40 w-36 h-48 bg-slate-900 border-2 border-cyan-500 rounded-2xl shadow-2xl overflow-hidden cursor-move font-sans"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {session.type === 'video' && session.status === 'connected' && hasCamPermission && !isCamOff ? (
          <video 
            ref={localVideoRef} 
            autoplay 
            playsinline 
            muted 
            className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 to-indigo-950 flex flex-col items-center justify-center p-2 text-center">
            {session.userAvatar ? (
              <img src={session.userAvatar} className="w-10 h-10 rounded-full border border-cyan-500 object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-xs border border-cyan-500/20">
                {session.userName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-[10px] font-mono font-semibold text-slate-300 truncate w-full mt-2">
              {session.userName}
            </span>
            {session.status === 'connected' && (
              <span className="text-[9px] font-mono text-cyan-400 mt-1">
                {formatTimer(callDuration)}
              </span>
            )}
          </div>
        )}

        {/* Floating Mini Action Overlays */}
        <div className="absolute top-1 right-1">
          <button 
            onClick={() => setIsMinimized(false)}
            className="p-1 bg-slate-950/80 hover:bg-slate-900 rounded-md text-white transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="absolute bottom-1 inset-x-1 flex justify-center gap-2">
          <button
            onClick={() => onHangup(callDuration)}
            className="p-1.5 bg-rose-600 hover:bg-rose-500 rounded-full text-white transition"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between items-center text-slate-100 font-sans p-6 sm:p-12 select-none"
      >
        
        {/* Sat-Connection Grid Line backgrounds */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950/90 to-slate-950 pointer-events-none opacity-50" />
        
        {/* Top bar */}
        <div className="relative z-10 w-full flex justify-between items-center">
          <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs font-mono text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>NEXUS SAC-2 ENCRYPTED</span>
          </div>

          {session.status === 'connected' && (
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2.5 bg-slate-900/60 hover:bg-slate-800 rounded-full border border-slate-800 transition"
              title="Minimize call window"
            >
              <Minimize2 className="w-4 h-4 text-slate-300" />
            </button>
          )}
        </div>

        {/* Center Section: Main Camera view or User profile */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center text-center">
          {session.type === 'video' && session.status === 'connected' && hasCamPermission && !isCamOff ? (
            // Immersive Video display card
            <div className="relative w-72 h-96 sm:w-80 sm:h-[420px] bg-slate-900 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-slate-800">
              <video 
                ref={localVideoRef} 
                autoplay 
                playsinline 
                muted 
                className={`w-full h-full object-cover transform ${usingFrontCam ? "-scale-x-100" : ""}`}
              />
              
              <div className="absolute bottom-4 left-4 right-4 bg-slate-950/65 backdrop-blur-md p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">{session.userName}</p>
                  <p className="text-[10px] text-cyan-400 font-mono mt-0.5">{formatTimer(callDuration)}</p>
                </div>

                <button 
                  onClick={handleSwitchCam}
                  className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 transition"
                  title="Front/Back Camera"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            // Voice Call avatar pulse visual design
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                {/* Visual pulse rings */}
                <span className="absolute inset-0 rounded-full bg-cyan-400/10 animate-ping" />
                <span className="absolute -inset-4 rounded-full bg-indigo-500/5 animate-pulse" />
                
                {session.userAvatar ? (
                  <img 
                    src={session.userAvatar} 
                    alt={session.userName} 
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-slate-800 relative z-10 shadow-2xl" 
                  />
                ) : (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-900 flex items-center justify-center text-cyan-400 font-bold text-3xl border-2 border-cyan-500/20 relative z-10 shadow-2xl">
                    {session.userName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">{session.userName}</h2>
              <div className="flex items-center gap-1.5 justify-center text-slate-400 text-xs tracking-wide">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>{getStatusText()}</span>
              </div>

              {session.status === 'connected' && (
                <p className="text-xl font-mono text-cyan-400 font-bold mt-4 tracking-wider">
                  {formatTimer(callDuration)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom Bar: Action Controllers */}
        <div className="relative z-10 w-full max-w-sm bg-slate-900/75 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-inner">
          
          {/* Incoming Call Options */}
          {session.status === 'ringing' && session.direction === 'incoming' ? (
            <div className="flex justify-around items-center">
              <button
                onClick={() => onHangup(0)}
                className="w-14 h-14 bg-rose-600 hover:bg-rose-500 rounded-full flex items-center justify-center text-white transition transform active:scale-95 shadow-lg shadow-rose-900/35"
                title={langSet.rejectBtn}
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                onClick={onAccept}
                className="w-14 h-14 bg-emerald-600 hover:bg-emerald-500 rounded-full flex items-center justify-center text-white transition transform active:scale-95 shadow-lg shadow-emerald-900/35 animate-bounce"
                title={langSet.acceptBtn}
              >
                {session.type === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
              </button>
            </div>
          ) : (
            // Connected Dashboard Controls
            <div className="flex justify-between items-center gap-4">
              <button
                onClick={handleMuteToggle}
                className={`p-3.5 rounded-full border transition active:scale-95 flex-1 flex justify-center ${
                  isMuted 
                    ? "bg-rose-900/20 border-rose-500/30 text-rose-400 hover:bg-rose-950/20" 
                    : "bg-slate-800 border-slate-700 text-slate-350 hover:bg-slate-750"
                }`}
                title={langSet.muteMicrophone}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {session.type === 'video' && (
                <button
                  onClick={handleCamToggle}
                  className={`p-3.5 rounded-full border transition active:scale-95 flex-1 flex justify-center ${
                    isCamOff 
                      ? "bg-amber-900/20 border-amber-500/30 text-amber-400 hover:bg-amber-950/25" 
                      : "bg-slate-800 border-slate-700 text-slate-350 hover:bg-slate-750"
                  }`}
                  title="Disable camera stream"
                >
                  {isCamOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              <button
                onClick={handleSpeakerToggle}
                className={`p-3.5 rounded-full border transition active:scale-95 flex-1 flex justify-center ${
                  !isSpeakerOn 
                    ? "bg-rose-900/20 border-rose-500/30 text-rose-400 hover:bg-rose-950/20" 
                    : "bg-slate-800 border-slate-700 text-slate-350 hover:bg-slate-750"
                }`}
                title="Toggle loudspeaker"
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              <button
                onClick={() => onHangup(callDuration)}
                className="p-3.5 bg-rose-600 hover:bg-rose-500 rounded-xl transition active:scale-95 text-white flex-1 flex justify-center shadow-md shadow-rose-900/25"
                title={langSet.hangupBtn}
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-500 font-mono tracking-wider mt-4">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400/70" />
            <span>ENVELOPE RATE COMPRESSION STABLE (LOW BANDWIDTH)</span>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
