import React from 'react';
import { X, CheckCircle, Circle, Target } from 'lucide-react';
import type { ScoreBreakdown } from '../types';

interface ScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: ScoreBreakdown | null;
  companyName: string;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({
  isOpen,
  onClose,
  breakdown,
  companyName,
}) => {
  if (!isOpen || !breakdown) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span>Scoring Rationale: {companyName}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent, point-by-point breakdown calculated out of 100 maximum points.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                Total Computed Score
              </span>
              <div className="text-2xl font-black text-blue-950 mt-0.5">
                {breakdown.total_score} <span className="text-sm font-medium text-blue-700">/ 100</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                Tier Classification
              </span>
              <div className="mt-0.5">
                <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold ${
                  breakdown.temperature === 'HOT'
                    ? 'bg-rose-600 text-white'
                    : breakdown.temperature === 'WARM'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-600 text-white'
                }`}>
                  {breakdown.temperature} ({breakdown.temperature === 'HOT' ? '75+' : breakdown.temperature === 'WARM' ? '45-74' : '<45'})
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Itemized Evaluation Factors
            </h4>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {breakdown.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 flex items-start justify-between text-xs transition-colors ${
                    item.earned ? 'bg-white' : 'bg-slate-50/60 opacity-75'
                  }`}
                >
                  <div className="flex items-start space-x-3 pr-4">
                    {item.earned ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-slate-900 flex items-center space-x-2">
                        <span>{item.factor}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-0.5 leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-mono font-bold text-sm ${
                      item.earned ? 'text-emerald-700' : 'text-slate-400'
                    }`}>
                      +{item.points_awarded}
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal"> / {item.max_points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Formula: 8 Buying Signals (80 pts max) + ICP Size Fit (20 pts max)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-colors"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
