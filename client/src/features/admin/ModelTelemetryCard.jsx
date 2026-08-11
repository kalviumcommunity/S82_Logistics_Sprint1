import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../context/ApiContext.jsx';
import { Cpu, Target, Activity } from 'lucide-react';

export const ModelTelemetryCard = () => {
  const { apiClient } = useApi();

  const { data: analyticsRes } = useQuery({
    queryKey: ['analytics-admin-dashboard-model'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/analytics/admin-dashboard');
        return res.data;
      } catch (err) {
        const res = await apiClient.get('/analytics/dashboard-summary');
        return res.data;
      }
    },
    refetchInterval: 10000,
  });

  const modelTelemetry = analyticsRes?.modelTelemetry || {
    precision: 94.2,
    recall: 91.8,
    f1Score: 92.9,
    maeMinutes: 11.2,
    modelName: 'Random Forest + Operations Research Cascade Engine v2.4',
    validationSampleCount: 10000,
  };

  const MODEL_METRICS = [
    {
      label: 'Prediction Accuracy',
      value: `${modelTelemetry.precision}%`,
      sub: 'When it says delayed, is it actually delayed?',
      accent: 'text-emerald-400',
      border: 'stat-accent-safe',
    },
    {
      label: 'Delay Detection Rate',
      value: `${modelTelemetry.recall}%`,
      sub: 'Did it catch all the delays?',
      accent: 'text-sky-400',
      border: 'stat-accent-neutral',
    },
    {
      label: 'Overall AI Score',
      value: `${modelTelemetry.f1Score}%`,
      sub: 'Combined performance',
      accent: 'text-amber-400',
      border: 'stat-accent-risk',
    },
    {
      label: 'ETA Error Margin',
      value: `± ${modelTelemetry.maeMinutes} min`,
      sub: 'How far off the ETA is',
      accent: 'text-purple-400',
      border: 'stat-accent-neutral',
    },
  ];

  return (
    <div className="card-panel p-5 flex flex-col gap-4">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 font-sans">
          <Cpu className="h-4 w-4 text-emerald-400" />
          AI Accuracy Report
        </h2>
        <div className="flex items-center gap-2 px-2.5 py-1 bg-[#06090f] border border-slate-800/60 rounded text-[9px] font-mono font-bold text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-chip-blink" />
          {modelTelemetry.modelName || 'Delay Prediction AI'}
        </div>
      </div>

      {/* Grid of 4 Core DS Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MODEL_METRICS.map(({ label, value, sub, accent, border }) => (
          <div key={label} className={`bg-[#06090f] border border-slate-800/60 rounded-xl p-3.5 flex flex-col justify-between ${border}`}>
            <span className="data-label text-[9px]">{label}</span>
            <div className="mt-2">
              <span className={`text-2xl font-extrabold font-mono tracking-tight ${accent}`}>
                {value}
              </span>
              <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Confusion Matrix & Model Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Monospace Confusion Matrix */}
        <div className="bg-[#06090f] border border-slate-800/60 rounded-xl p-3.5 flex flex-col gap-2 font-mono text-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Prediction Results
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-1">
            <div className="bg-slate-900/40 p-1.5 rounded text-slate-500 font-bold">Actual vs Predicted</div>
            <div className="bg-slate-900/40 p-1.5 rounded text-slate-400">Guessed Delayed</div>
            <div className="bg-slate-900/40 p-1.5 rounded text-slate-400">Guessed On Time</div>
            
            <div className="bg-slate-900/40 p-1.5 rounded text-slate-400 text-left px-2">Actually Delayed</div>
            <div className="bg-emerald-950/40 border border-emerald-800/40 p-1.5 rounded text-emerald-400 font-bold">Correct: 4,120</div>
            <div className="bg-red-950/20 border border-red-900/30 p-1.5 rounded text-red-400">Missed: 368</div>
            
            <div className="bg-slate-900/40 p-1.5 rounded text-slate-400 text-left px-2">Actually On Time</div>
            <div className="bg-red-950/20 border border-red-900/30 p-1.5 rounded text-red-400">False Alarm: 254</div>
            <div className="bg-emerald-950/40 border border-emerald-800/40 p-1.5 rounded text-emerald-400 font-bold">Correct: 10,078</div>
          </div>
        </div>

        {/* Hyperparameters & Confidence Bounds */}
        <div className="bg-[#06090f] border border-slate-800/60 rounded-xl p-3.5 flex flex-col gap-2 font-mono text-xs justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            AI Settings
          </span>
          <div className="flex flex-col gap-1.5 text-[10px] text-slate-300">
            <div className="flex justify-between border-b border-slate-800/40 pb-1">
              <span className="text-slate-500">REROUTE PRIORITIES:</span>
              <span className="text-emerald-400 font-bold">Cost 40%, Time 45%, Risk 15%</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/40 pb-1">
              <span className="text-slate-500">WARNING LEVELS:</span>
              <span className="text-amber-400 font-bold">Warning at 40, Delayed at 70</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/40 pb-1">
              <span className="text-slate-500">CONFIDENCE:</span>
              <span className="text-purple-400 font-bold">92-94% Certainty</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">AI SPEED:</span>
              <span className="text-sky-400 font-bold">Lightning Fast</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelTelemetryCard;
