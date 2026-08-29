import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRecruiterStore } from '../store/recruiterStore';
import { useJobStore } from '../store/jobStore';
import { BrainCircuit, Loader2, Sparkles, AlertCircle, HelpCircle, Trophy, Eye } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 3D Constellation Skills network component
function ConstellationNetwork({ skillsCount = 10 }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create random nodes representing skills
  const [nodes] = useState(() => {
    const arr = [];
    for (let i = 0; i < skillsCount; i++) {
      arr.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ),
        size: Math.random() * 0.1 + 0.05,
      });
    }
    return arr;
  });

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta / 10;
      groupRef.current.rotation.x += delta / 15;
    }
  });

  // Calculate lines between nearby nodes
  const lines: THREE.Vector3[][] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].pos.distanceTo(nodes[j].pos) < 1.2) {
        lines.push([nodes[i].pos, nodes[j].pos]);
      }
    }
  }

  return (
    <group ref={groupRef}>
      {/* Node Spheres */}
      {nodes.map((node, idx) => (
        <mesh key={idx} position={node.pos}>
          <sphereGeometry args={[node.size, 16, 16]} />
          <meshBasicMaterial color="#2563EB" wireframe={true} />
        </mesh>
      ))}

      {/* Connection Lines */}
      {lines.map((line, idx) => {
        const points = line;
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <line key={idx} {...{ geometry: lineGeo } as any}>
            <lineBasicMaterial color="#64748B" opacity={0.3} transparent={true} />
          </line>
        );
      })}
    </group>
  );
}

export default function RecruiterPage() {
  const { jobs, fetchJobs } = useJobStore();
  const { candidates, loading, error, fetchCandidatesForJob } = useRecruiterStore();
  
  const [selectedJobId, setSelectedJobId] = useState('');
  const [showNetwork, setShowNetwork] = useState(false);

  useEffect(() => {
    fetchJobs({ status: 'APPROVED', limit: 100 });
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      fetchCandidatesForJob(selectedJobId);
    }
  }, [selectedJobId]);

  // Color mappings for scores
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success bg-emerald-50 border-emerald-200';
    if (score >= 80) return 'text-primary bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-danger bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text tracking-tight">Recruiter Placement Intelligence</h1>
          <p className="text-sm text-secondary font-medium">Screen candidates, rank matches, and inspect AI semantic explanations.</p>
        </div>

        {selectedJobId && !loading && candidates.length > 0 && (
          <button
            onClick={() => setShowNetwork((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 border border-border bg-surface text-text hover:border-slate-400 hover:shadow-sm text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span>{showNetwork ? 'Hide 3D skills network' : 'Show 3D skills network'}</span>
          </button>
        )}
      </div>

      {/* Select Job Card */}
      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Choose Approved Job Opening</label>
          <select
            className="w-full max-w-md h-10 border border-border rounded-lg px-3 text-xs bg-background text-text focus:border-primary outline-none transition"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            <option value="">Select a job profile...</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.jobTitle} at {j.company.name} ({j.location})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedJobId && showNetwork && (
        <div className="bg-slate-950 h-64 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Suspense fallback={<div className="text-slate-500 text-xs">Loading constellation network...</div>}>
              <Canvas camera={{ position: [0, 0, 2] }}>
                <ConstellationNetwork skillsCount={15} />
              </Canvas>
            </Suspense>
          </div>
          <div className="absolute top-4 left-4 z-10 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-primary" />
            <span>AI Skills Network Mapping Topology</span>
          </div>
        </div>
      )}

      {/* Candidates table / results */}
      {selectedJobId && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-text uppercase tracking-wider">Ranked Candidates</h2>
          
          {loading ? (
            <div className="text-center py-16 text-secondary bg-surface border border-border rounded-xl">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
              <span>Analyzing candidate resumes and executing ATS calculations...</span>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-16 text-secondary bg-surface border border-border rounded-xl">
              No matching candidate resumes found.
            </div>
          ) : (
            <div className="space-y-4">
              {candidates.map((cand, idx) => (
                <div
                  key={cand.studentId}
                  className="bg-surface p-6 rounded-xl border border-border shadow-sm hover:shadow-md hover:border-slate-300 transition duration-200 flex flex-col md:flex-row justify-between gap-6"
                >
                  {/* Left: Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-slate-100 border border-border rounded-full flex justify-center items-center font-bold text-xs text-primary">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-text text-sm leading-none">{cand.fullName}</h4>
                        <div className="text-[10px] font-mono text-secondary mt-1">
                          {cand.rollNumber} &bull; {cand.department}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-secondary leading-relaxed">
                      <p className="font-semibold text-text">"{cand.explanation}"</p>
                    </div>

                    {/* Skills Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <div className="text-[10px] font-bold text-secondary uppercase mb-1">Matched Skills</div>
                        <div className="flex flex-wrap gap-1">
                          {cand.matchedSkills.slice(0, 8).map((s, idx) => (
                            <span key={idx} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-secondary uppercase mb-1">Missing Skills</div>
                        <div className="flex flex-wrap gap-1">
                          {cand.missingSkills.slice(0, 8).map((s, idx) => (
                            <span key={idx} className="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Scores */}
                  <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 min-w-[120px]">
                    <div className={`w-14 h-14 rounded-xl border flex flex-col justify-center items-center shadow-inner ${getScoreColor(cand.atsScore)}`}>
                      <span className="text-lg font-extrabold">{cand.atsScore}</span>
                    </div>
                    <div className="text-[9px] font-bold text-secondary uppercase tracking-widest mt-2">ATS SCORE</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
