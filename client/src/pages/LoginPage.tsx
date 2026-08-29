import React, { useState, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
// Import random from maath/random/dist/maath-random.esm if needed, or implement a local float32 array generator which is extremely simple and self-contained!
import * as THREE from 'three';

// 3D Particles Constellation Component (self-contained, no external math dependencies)
function ParticleBackground() {
  const ref = useRef<THREE.Points>(null);
  
  // Generate random coordinates inside a sphere
  const [positions] = useState(() => {
    const arr = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 2.5; // Radius up to 2.5
      
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  });

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 12;
      ref.current.rotation.y -= delta / 18;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#22C55E"
          size={0.012}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await login(trimmedEmail, trimmedPassword);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillCredentials = (fillEmail: string) => {
    setEmail(fillEmail);
    setPassword('Password123!');
    setErrorMsg('');
  };

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden px-4">
      
      {/* 3D WebGL Canvas Layer (Falls back to CSS animations if WebGL fails) */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={
          <div className="absolute inset-0 bg-gradient-to-tr from-background via-background-secondary to-background-tertiary opacity-80" />
        }>
          <Canvas camera={{ position: [0, 0, 1.2] }}>
            <ParticleBackground />
          </Canvas>
        </Suspense>
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-background/20 pointer-events-none z-10" />

      {/* Solid Enterprise Login Form Wrapper */}
      <div className="relative w-full max-w-md bg-surface-1 border border-border-primary rounded p-8 z-20 overflow-hidden flex flex-col items-center shadow-lg">
        
        {/* Brand header — large prominent logo */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="p-3 bg-surface-2 rounded-xl border border-border-primary shadow-sm flex items-center justify-center">
            <img src="/assets/talentpulse_logo.png" className="h-16 w-auto object-contain" alt="Rathinam TalentPulse Logo" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">TalentPulse<span className="text-primary">.ai</span></h1>
            <p className="text-[11px] text-text-muted font-bold mt-1 uppercase tracking-widest">Authorized Academic &amp; Placement Portal</p>
          </div>
        </div>

        {errorMsg && (
          <div className="w-full bg-error/10 border border-error/20 text-error p-3 rounded flex gap-2.5 items-start text-xs font-semibold mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-disabled">
                <Mail className="w-4.5 h-4.5" />
              </span>
              <input
                type="email"
                required
                className="w-full h-11 pl-10 pr-4 bg-background-tertiary border border-border-primary rounded text-text-secondary text-sm focus:border-primary outline-none transition"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Password</label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-disabled">
                <Lock className="w-4.5 h-4.5" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full h-11 pl-10 pr-10 bg-background-tertiary border border-border-primary rounded text-text-secondary text-sm focus:border-primary outline-none transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-primary"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-gradient-primary hover:brightness-110 disabled:opacity-50 text-white font-semibold text-sm rounded transition duration-150 mt-2 glow-primary cursor-pointer border-0"
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center text-[10px] text-text-disabled font-semibold uppercase tracking-wider">
          Authorized Academic Portal &bull; TalentPulse.ai
        </div>
      </div>
    </div>
  );
}
