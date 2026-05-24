/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { MessageSquareCode, ShieldCheck, Zap } from "lucide-react";
import { TranslationSet } from "../languages";

interface SplashScreenProps {
  onComplete: () => void;
  langSet: TranslationSet;
}

export function SplashScreen({ onComplete, langSet }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col justify-between items-center z-50 p-8 select-none font-sans">
      <div /> {/* Spacer */}

      <div className="flex flex-col items-center text-center">
        {/* Animated App Brand Logo badge */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [1, 1.1, 1], opacity: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.4)] mb-6 text-white"
        >
          <MessageSquareCode className="w-12 h-12" id="nexus-splash-logo" />
        </motion.div>

        {/* Display Typography pairing with Space Grotesk-like tracking */}
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold tracking-tight text-white mb-2"
        >
          NEXUS MESSENGER
        </motion.h1>

        {/* Micro-indicators */}
        <motion.p 
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 0.7 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-indigo-200 uppercase tracking-widest font-mono flex items-center gap-1.5 justify-center"
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          {langSet.splashText}
        </motion.p>
      </div>

      <div className="flex flex-col items-center gap-6 w-full max-w-xs">
        {/* Loading progress glow */}
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.2, ease: "easeInOut" }}
            onAnimationComplete={onComplete}
            className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
          />
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono tracking-wider">
          <ShieldCheck className="w-4.5 h-4.5 text-indigo-400" />
          <span>E2E QUANTUM EMBEDDED</span>
        </div>
      </div>
    </div>
  );
}
