import React from 'react';
import { X, CheckCircle, Circle, Target, AlertTriangle } from 'lucide-react';
import type { ScoreDetails } from '../types';

interface ScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  scoreDetails: ScoreDetails | null | undefined;
  companyName: string;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({
  isOpen,
  onClose,
  scoreDetails,
  companyName,
}) => {
  if (!isOpen || !scoreDetails) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span>Deel ICP Scoring Rationale: {companyName}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic factor breakdown based on headcount size, active international signals, and red flags.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Summary Banner */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                Total Deel Lead Score
              </span>
              <div className="text-2xl font-black text-blue-950 mt-0.5 tabular-nums">
                {scoreDetails.lead_score} <span className="text-sm font-medium text-blue-700">/ 100</span>
                {scoreDetails.raw_score !== scoreDetails.lead_score && (
                  <span className="text-xs font-normal text-slate-500 ml-2">
                    (Raw: {scoreDetails.raw_score})
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                ICP Fit Tier
              </span>
              <div className="mt-0.5">
                <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold ${
                  scoreDetails.temperature === 'HOT'
                    ? 'bg-rose-600 text-white'
                    : scoreDetails.temperature === 'WARM'
                    ? 'bg-amber-500 text-white'
                    : scoreDetails.temperature === 'DISQUALIFIED'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-600 text-white'
                }`}>
                  {scoreDetails.temperature}
                </span>
              </div>
            </div>
          </div>

          {/* Recommended Product Wedge */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Recommended Product Wedge:</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {scoreDetails.recommended_product}
            </span>
          </div>

          {/* Factor Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Itemized Evaluation Factors
            </h4>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {scoreDetails.breakdown.map((item, idx) => {
                const isNegative = item.points < 0;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 flex items-start justify-between text-xs transition-colors ${
                      item.earned ? (isNegative ? 'bg-rose-50/50' : 'bg-white') : 'bg-slate-50/60 opacity-75'
                    }`}
                  >
                    <div className="flex items-start space-x-3 pr-4">
                      {item.earned ? (
                        isNegative ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold text-slate-900 flex items-center space-x-2">
                          <span>{item.factor}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            isNegative 
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {item.category}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-mono font-bold text-sm ${
                        item.earned
                          ? isNegative ? 'text-rose-600' : 'text-emerald-700'
                          : 'text-slate-400'
                      }`}>
                        {item.earned ? (isNegative ? `${item.points}` : `+${item.points}`) : '0'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal"> / {item.max_points}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Formula: Headcount Base (20 max) + Buying Signals (110 max) - Red Flags (clamped 0–100)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-colors"
          >
            Close Rationale
          </button>
        </div>
      </div>
    </div>
  );
};
