import React from 'react';

import { useApi } from '../../context/ApiContext.jsx';
import { Cpu, Target, Activity } from 'lucide-react';

export const ModelTelemetryCard = ({ analyticsRes }) => {
  const { apiClient } = useApi();

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

      
    </div>
  );
};

export default ModelTelemetryCard;
