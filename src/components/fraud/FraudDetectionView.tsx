import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Sliders,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  TrendingUp,
  Cpu,
  Layers,
  Save,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../api/client';
import { FraudEngineConfig } from '../../types';
import { StatCard } from '../ui/StatCard';

export const FraudDetectionView: React.FC = () => {
  const [config, setConfig] = useState<FraudEngineConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Batch analysis state
  const [runningBatch, setRunningBatch] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    analyzedCount: number;
    durationMs: number;
    anomaliesDetected: {
      amountAnomalies: number;
      locationAnomalies: number;
      timeAnomalies: number;
      burstAnomalies: number;
      typeAnomalies: number;
    };
  } | null>(null);

  useEffect(() => {
    api
      .getFraudConfig()
      .then((cfg) => setConfig(cfg))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setSaveSuccess(null);
    try {
      const res = await api.updateFraudConfig(config);
      setConfig(res.config);
      setSaveSuccess('Risk engine thresholds updated and all records re-scored.');
    } catch (err: any) {
      alert(err.message || 'Failed to update fraud configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleRunBatch = async () => {
    setRunningBatch(true);
    try {
      const res = await api.runBatchAnalysis();
      setBatchResult(res);
    } catch (err: any) {
      alert(err.message || 'Batch analysis failed');
    } finally {
      setRunningBatch(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="py-24 text-center text-xs text-slate-500 font-mono">
        Loading Fraud Detection and Risk Analysis Engine...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Module 2: Fraud Detection & Anomaly Analysis Engine
          </h2>
          <p className="text-xs text-slate-500">
            Multi-parameter heuristic and statistical risk evaluation pipeline calibrated for financial AML compliance.
          </p>
        </div>
        <button
          onClick={handleRunBatch}
          disabled={runningBatch}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${runningBatch ? 'animate-spin' : ''}`} />
          <span>{runningBatch ? 'Executing Anomaly Models...' : 'Execute Live Batch Anomaly Run'}</span>
        </button>
      </div>

      {/* Anomaly Detection Dimensions Banner */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
            <TrendingUp className="w-4 h-4 text-red-600" />
            <span>1. Amount Outliers</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Triggers when volume exceeds ${config.highAmountThreshold.toLocaleString()} or exceeds 4x historical account mean.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>2. Nocturnal Hours</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Monitors high-value authorizations between 0{config.nightHourStart}:00 and 0{config.nightHourEnd}:00 AM.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>3. Cross-Border Velocity</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Flags unfamiliar foreign offshore hubs (Dubai, Zurich, Moscow, Lagos) vs. domestic baseline.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
            <Cpu className="w-4 h-4 text-purple-600" />
            <span>4. Repeat Card Bursts</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Detects carding attacks: $\ge${config.burstMaxTransactions} repeat transactions within {config.burstWindowMinutes} minutes.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 font-semibold text-slate-900 mb-1">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>5. Channel Risk</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Evaluates settlement irreversibility across Wire Transfers, ATM cash limits, and CNP Online.
          </p>
        </div>
      </div>

      {/* Batch Run Results (if executed) */}
      {batchResult && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm font-bold text-blue-950">
                Batch Anomaly Detection Completed
              </h4>
            </div>
            <span className="text-xs font-mono text-blue-800">
              Evaluated {batchResult.analyzedCount} transactions in {batchResult.durationMs}ms
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard
              title="Amount Anomalies"
              value={batchResult.anomaliesDetected.amountAnomalies}
              subtitle="Exceeded thresholds"
              highlightColor="red"
            />
            <StatCard
              title="Nocturnal Anomalies"
              value={batchResult.anomaliesDetected.timeAnomalies}
              subtitle="Night window"
              highlightColor="amber"
            />
            <StatCard
              title="Location Anomalies"
              value={batchResult.anomaliesDetected.locationAnomalies}
              subtitle="Foreign offshore hubs"
              highlightColor="blue"
            />
            <StatCard
              title="Burst Alerts"
              value={batchResult.anomaliesDetected.burstAnomalies}
              subtitle="Rapid repeat velocity"
              highlightColor="red"
            />
            <StatCard
              title="Channel Anomalies"
              value={batchResult.anomaliesDetected.typeAnomalies}
              subtitle="High-risk channel"
              highlightColor="default"
            />
          </div>
        </div>
      )}

      {/* Configurable Risk Thresholds & Weights Panel */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Dynamic Risk Model Calibration (0–100 Scale)
            </h3>
            <p className="text-xs text-slate-500">
              Adjust statistical thresholds and scoring weights. Updates immediately propagate to the database.
            </p>
          </div>
          {saveSuccess && (
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              {saveSuccess}
            </span>
          )}
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-6 text-xs">
          {/* Threshold Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Elevated Amount Threshold ($ USD)
              </label>
              <input
                type="number"
                step="500"
                value={config.highAmountThreshold}
                onChange={(e) =>
                  setConfig({ ...config, highAmountThreshold: Number(e.target.value) })
                }
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 font-mono text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: $5,000</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Critical Extreme Amount Threshold ($ USD)
              </label>
              <input
                type="number"
                step="1000"
                value={config.veryHighAmountThreshold}
                onChange={(e) =>
                  setConfig({ ...config, veryHighAmountThreshold: Number(e.target.value) })
                }
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 font-mono text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: $10,000</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Burst Velocity Time Window (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={config.burstWindowMinutes}
                onChange={(e) =>
                  setConfig({ ...config, burstWindowMinutes: Number(e.target.value) })
                }
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 font-mono text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 5 minutes</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Max Transactions Allowed in Window
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={config.burstMaxTransactions}
                onChange={(e) =>
                  setConfig({ ...config, burstMaxTransactions: Number(e.target.value) })
                }
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 font-mono text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 3 repeated attempts</span>
            </div>
          </div>

          {/* Scoring Weights Sliders */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Risk Factor Scoring Weights (Total Max = 100 Points)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-slate-700">Amount Weight</span>
                  <span className="font-mono font-bold text-blue-600">
                    {config.weights.amountWeight} pts
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={config.weights.amountWeight}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      weights: { ...config.weights, amountWeight: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-slate-700">Nocturnal Weight</span>
                  <span className="font-mono font-bold text-blue-600">
                    {config.weights.timeWeight} pts
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={config.weights.timeWeight}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      weights: { ...config.weights, timeWeight: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-slate-700">Location Weight</span>
                  <span className="font-mono font-bold text-blue-600">
                    {config.weights.locationWeight} pts
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={config.weights.locationWeight}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      weights: { ...config.weights, locationWeight: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-slate-700">Burst Velocity Weight</span>
                  <span className="font-mono font-bold text-blue-600">
                    {config.weights.frequencyWeight} pts
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={config.weights.frequencyWeight}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      weights: { ...config.weights, frequencyWeight: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-slate-700">Channel Type Weight</span>
                  <span className="font-mono font-bold text-blue-600">
                    {config.weights.typeWeight} pts
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={config.weights.typeWeight}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      weights: { ...config.weights, typeWeight: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Re-scoring All Transactions...' : 'Save Configuration & Recalibrate Model'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Model Rationale & Academic Capstone Explanation */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Data Mining & Statistical Model Documentation
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          FinGuard combines deterministic AML rule heuristics with non-parametric outlier scoring. The risk classification separates transactions into three transparent tiers:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-emerald-50/80 rounded border border-emerald-200">
            <strong className="text-emerald-900 block font-semibold">Low Risk (0–30 Points)</strong>
            <p className="text-emerald-800 mt-1 text-[11px]">
              Nominal domestic merchant activity within standard banking hours and normal spending variance.
            </p>
          </div>
          <div className="p-3 bg-amber-50/80 rounded border border-amber-200">
            <strong className="text-amber-900 block font-semibold">Medium Risk (31–60 Points)</strong>
            <p className="text-amber-800 mt-1 text-[11px]">
              Transactions exhibiting single anomalies (e.g. nocturnal withdrawal or elevated amount on personal card).
            </p>
          </div>
          <div className="p-3 bg-red-50/80 rounded border border-red-200">
            <strong className="text-red-900 block font-semibold">High Risk (61–100 Points)</strong>
            <p className="text-red-800 mt-1 text-[11px]">
              Compound risk: combinations of extreme value, foreign offshore destinations, rapid repeated card bursts, and irreversible channels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
