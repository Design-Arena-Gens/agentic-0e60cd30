// @ts-nocheck
"use client";

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Glitch } from '@react-three/postprocessing';
import { BlendFunction, GlitchMode } from 'postprocessing';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

function NeonTubes() {
  const group = useRef(null);
  const tubes = useMemo(() => {
    const items = [] as { pos: [number, number, number]; color: string }[];
    for (let i = 0; i < 46; i++) {
      items.push({ pos: [(Math.random() - 0.5) * 16, Math.random() * 6 + 1, -Math.random() * 30 - 10], color: Math.random() > 0.5 ? '#00f0ff' : '#ff2dfb' });
    }
    return items;
  }, []);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.children.forEach((m: any, idx: number) => {
      m.position.y = 1 + Math.sin(clock.elapsedTime * (0.7 + idx * 0.03) + idx) * 0.8;
    });
  });
  return (
    <group ref={group}>
      {tubes.map((t, i) => (
        <mesh key={i} position={t.pos}>
          <cylinderGeometry args={[0.02, 0.02, 2.4, 16]} />
          <meshBasicMaterial color={t.color} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function CameraRig() {
  const ref = useRef(null);
  useFrame(({ camera, clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    camera.position.x = Math.sin(t * 0.6) * 2.2;
    camera.position.y = 1.6 + Math.sin(t * 0.9) * 0.2;
    camera.position.z = 6 + Math.cos(t * 0.4) * 0.8;
    camera.lookAt(0, 1, 0);
  });
  return <group ref={ref} />;
}

function SceneEffects({ glitchOn }: { glitchOn: boolean }) {
  return (
    <EffectComposer>
      <Bloom intensity={1.1} luminanceThreshold={0.2} luminanceSmoothing={0.6} mipmapBlur blendFunction={BlendFunction.SCREEN} />
      {glitchOn && (
        <Glitch delay={[0.2, 0.6]} duration={[0.5, 1.0]} strength={[0.2, 0.6]} mode={GlitchMode.CONSTANT_MILD} />
      )}
    </EffectComposer>
  );
}

function useMusicAndVoiceover(started: boolean) {
  useEffect(() => {
    if (!started) return;

    // Background music via WebAudio (simple electronic loop)
    let audioCtx: AudioContext | null = null;
    let stop = false;

    const startAudio = async () => {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      const tempo = 128; // BPM
      const beat = 60 / tempo;

      const master = audioCtx.createGain();
      master.gain.value = 0.25;
      master.connect(audioCtx.destination);

      const makeKick = (time: number) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
        gain.gain.setValueAtTime(1.0, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        osc.connect(gain).connect(master);
        osc.start(time);
        osc.stop(time + 0.13);
      };

      const makeHat = (time: number) => {
        const bufferSize = 2 * audioCtx!.sampleRate * 0.05;
        const buffer = audioCtx!.createBuffer(1, bufferSize, audioCtx!.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx!.createBufferSource();
        noise.buffer = buffer;
        const bandpass = audioCtx!.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 8000;
        const gain = audioCtx!.createGain(); gain.gain.value = 0.1;
        noise.connect(bandpass).connect(gain).connect(master);
        noise.start(time);
        noise.stop(time + 0.03);
      };

      const makeBass = (time: number, note: number) => {
        const osc = audioCtx!.createOscillator();
        const gain = audioCtx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = note;
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(0.18, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
        const lp = audioCtx!.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
        osc.connect(lp).connect(gain).connect(master);
        osc.start(time);
        osc.stop(time + 0.38);
      };

      const startTime = audioCtx.currentTime + 0.05;
      let bar = 0;

      const schedule = () => {
        if (!audioCtx || stop) return;
        const now = audioCtx.currentTime;
        while (bar * 4 * beat < (now - startTime) + 1.0) {
          const tBar = startTime + bar * 4 * beat;
          // 4x4 kick
          for (let i = 0; i < 4; i++) makeKick(tBar + i * beat);
          // hats
          for (let i = 0; i < 8; i++) makeHat(tBar + i * (beat / 2));
          // bass pattern
          const scale = [55, 55, 82.41, 41.2];
          for (let s = 0; s < 4; s++) makeBass(tBar + s * beat, scale[(bar + s) % scale.length]);
          bar++;
        }
        setTimeout(schedule, 100);
      };
      schedule();

      // Voiceover (Hinglish) via SpeechSynthesis
      const speak = (text: string, delay: number, rate = 1.02) => {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = rate;
        u.pitch = 1.02;
        const pickVoice = () => {
          const voices = speechSynthesis.getVoices();
          const prefer = voices.find(v => /India|Hindi|en-IN/i.test(v.name + ' ' + v.lang)) || voices.find(v => /en-|en_/i.test(v.lang)) || voices[0];
          if (prefer) u.voice = prefer;
          setTimeout(() => speechSynthesis.speak(u), delay);
        };
        if (speechSynthesis.getVoices().length === 0) {
          speechSynthesis.onvoiceschanged = pickVoice;
        }
        pickVoice();
      };

      speak('Ab design karega AI vs AI! ??', 1000);
      speak('Kaunsa model banayega best look?', 4500);
      speak('Tum decide karoge ? vote do aur dekho kaun jeetega DesignArena mein!', 8200, 0.98);

      return () => {
        stop = true;
        try { speechSynthesis.cancel(); } catch {}
        try { audioCtx?.close(); } catch {}
      };
    };

    startAudio();
  }, [started]);
}

export default function Page() {
  const [started, setStarted] = useState(false);
  const [glitchOn, setGlitchOn] = useState(false);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);

  useMusicAndVoiceover(started);

  // Timeline of scenes
  useEffect(() => {
    if (!started || timerStarted) return;
    setTimerStarted(true);
    const steps = [
      { at: 0, run: () => setSceneIdx(0) },
      { at: 2, run: () => setGlitchOn(true) },
      { at: 4, run: () => { setSceneIdx(1); setGlitchOn(false); } },
      { at: 8, run: () => setSceneIdx(2) },
      { at: 12, run: () => { setSceneIdx(3); setGlitchOn(true); } },
      { at: 16, run: () => { setSceneIdx(4); setGlitchOn(false); } },
      { at: 22, run: () => setSceneIdx(5) }
    ];
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      steps.forEach((s: any) => { if (!s.done && t >= s.at) { s.done = true; s.run(); } });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, timerStarted]);

  const start = useCallback(() => setStarted(true), []);

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ fov: 60, position: [0, 1.6, 7] }}>
        <color attach="background" args={["#06070d"]} />
        <NeonTubes />
        <CameraRig />
        <ambientLight intensity={0.6} />
        <pointLight position={[2, 3, 2]} intensity={1.2} color={'#00f0ff'} />
        <pointLight position={[-2, 2, 1]} intensity={1.0} color={'#ff2dfb'} />
        <SceneEffects glitchOn={glitchOn} />
        <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
      </Canvas>

      {/* Overlays */}
      <div className="overlay">
        <div className="topbar">
          <div className="badge neon logo">DesignArena.ai</div>
          <div className="stack">
            <div className="badge">Vote</div>
            <div className="badge">Compare</div>
            <div className="badge">Discover</div>
          </div>
        </div>

        {/* Center intro */}
        <div className={`center-text scene ${sceneIdx === 0 ? 'show' : ''}`}>
          <div>
            <div className="huge neon">AI Design Battle</div>
            <div className="sub">Fast neon transitions ? Glitch overlays ? Cinematic vibes</div>
          </div>
        </div>

        {/* Two AI interfaces */}
        <div className={`panels scene ${sceneIdx === 1 ? 'show' : ''}`}>
          {[0,1].map(side => (
            <div className="panel" key={side}>
              <div className="panelHeader">
                <div className="stack">
                  <span className="tag">{side === 0 ? 'Model A' : 'Model B'}</span>
                  <span className="tag">Neon</span>
                  <span className="tag">Cinematic</span>
                </div>
                <div className="badge">Score: {side === 0 ? '87' : '82'}</div>
              </div>
              <div className="panelBody">
                <div className="previewGrid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div className="previewCard" key={i}>
                      <div className="previewThumb" style={{ backgroundImage: `linear-gradient(135deg, rgba(0,240,255,0.35), rgba(255,45,251,0.35)), url('data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 400 400\"><defs><linearGradient id=\"g\" x1=\"0\" x2=\"1\"><stop stop-color=\"#00f0ff\"/><stop offset=\"1\" stop-color=\"#ff2dfb\"/></linearGradient></defs><rect width=\"400\" height=\"400\" fill=\"#0a0f1a\"/><circle cx=\"200\" cy=\"200\" r=\"${120 - i*12}\" fill=\"none\" stroke=\"url(#g)\" stroke-width=\"3\" opacity=\"0.8\"/></svg>`)}')` }} />
                    </div>
                  ))}
                </div>
                <div className="controls">
                  <button className="voteBtn">Vote {side === 0 ? 'A' : 'B'}</button>
                  <div className="badge">Live: {side === 0 ? '4.2k' : '4.1k'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Rating battles */}
        <div className={`center-text scene ${sceneIdx === 2 ? 'show' : ''}`}>
          <div>
            <div className="huge neon">Rating Battles</div>
            <div className="sub">Compare posters, websites, logos & 3D art</div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className={`leaderboard scene ${sceneIdx === 3 ? 'show' : ''}`}>
          {[
            { name: 'Model A ? HyperNeon', score: 96 },
            { name: 'Model C ? SynthWave', score: 93 },
            { name: 'Model B ? QuantumUI', score: 91 },
            { name: 'Model D ? HoloGrid', score: 88 },
          ].map((r, i) => (
            <div className="lbRow" key={i}>
              <div className="stack"><span className="badge">#{i+1}</span><span>{r.name}</span></div>
              <div className="badge">{r.score}</div>
            </div>
          ))}
        </div>

        {/* Vote. Compare. Discover. */}
        <div className={`center-text scene ${sceneIdx === 4 ? 'show' : ''}`}>
          <div>
            <div className="huge neon">Vote. Compare. Discover.</div>
            <div className="sub">Electric energy ? Smooth camera ? Glitch overlays</div>
          </div>
        </div>

        {/* Ending */}
        <div className={`endCard scene ${sceneIdx === 5 ? 'show' : ''}`}>
          <div>
            <div className="brand glow">DesignArena.ai</div>
            <div className="tagline">Where AIs Compete, Creativity Wins.</div>
          </div>
        </div>

        <div className="bottombar">
          <div className="badge">Cinematic ? 24s ? 4K</div>
          {!started && (
            <button className="cta" onClick={start}>Play cinematic with audio</button>
          )}
        </div>
      </div>
    </main>
  );
}
