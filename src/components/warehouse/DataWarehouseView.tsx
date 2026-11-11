import React, { useState, useEffect } from 'react';
import {
  Layers,
  Database,
  Calendar,
  Users,
  MapPin,
  CreditCard,
  Play,
  Code2,
  Table,
  CheckCircle,
} from 'lucide-react';
import { api } from '../../api/client';
import { StarSchemaOverview } from '../../types';
import { StatCard } from '../ui/StatCard';

export const DataWarehouseView: React.FC = () => {
  const [overview, setOverview] = useState<StarSchemaOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDimension, setSelectedDimension] = useState<'dates' | 'accounts' | 'locations' | 'types' | 'facts'>('facts');
  const [olapSlice, setOlapSlice] = useState<'date' | 'location' | 'type'>('location');
  const [olapResults, setOlapResults] = useState<any[] | null>(null);
  const [queryRunning, setQueryRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'tables' | 'olap' | 'sql'>('visual');

  useEffect(() => {
    api
      .getStarSchemaOverview()
      .then((data) => setOverview(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const runOLAP = async (dim: 'date' | 'location' | 'type') => {
    setOlapSlice(dim);
    setQueryRunning(true);
    try {
      const data = await api.runOLAPQuery(dim);
      setOlapResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setQueryRunning(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'olap' && !olapResults) {
      runOLAP('location');
    }
  }, [activeTab]);

  if (loading || !overview) {
    return (
      <div className="py-24 text-center text-xs text-slate-500 font-mono">
        Loading Data Warehouse dimensional schema and star fact tables...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Data Warehousing & Star Schema (Dimensional Modeling)
          </h2>
          <p className="text-xs text-slate-500">
            Database: <strong className="font-mono text-slate-800">finguard</strong> · Fact_Transactions and Conformed Dimension Tables.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('visual')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'visual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Star Schema Visual
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'tables' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dimension Tables
          </button>
          <button
            onClick={() => setActiveTab('olap')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'olap' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            OLAP Slice & Dice
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'sql' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            MySQL 8.0 DDL
          </button>
        </div>
      </div>

      {/* Warehouse Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard
          title="Fact Records"
          value={overview.factCount}
          subtitle="Fact_Transactions grain"
          highlightColor="blue"
        />
        <StatCard
          title="Date Dimension"
          value={overview.dimDateCount}
          subtitle="Dim_Date rows"
        />
        <StatCard
          title="Account Dimension"
          value={overview.dimAccountCount}
          subtitle="Dim_Account profiles"
        />
        <StatCard
          title="Location Dimension"
          value={overview.dimLocationCount}
          subtitle="Dim_Location territories"
        />
        <StatCard
          title="Channel Dimension"
          value={overview.dimTypeCount}
          subtitle="Dim_Transaction_Type"
        />
      </div>

      {/* Tab 1: Star Schema Visual Architecture */}
      {activeTab === 'visual' && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <h3 className="text-sm font-bold text-slate-900">
              Star Schema Relational Architecture
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Conformed dimensional design optimized for analytical query aggregation, rollup, and fraud mining.
            </p>
          </div>

          {/* Diagram Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left Dimension Column */}
            <div className="space-y-4">
              {/* Dim_Date */}
              <div className="bg-slate-50 border border-blue-200 rounded-lg p-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-blue-900 mb-2 border-b border-blue-100 pb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dim_Date</span>
                </div>
                <ul className="space-y-1 font-mono text-[11px] text-slate-600">
                  <li className="text-blue-700 font-semibold">🔑 Date_Key (INT, PK)</li>
                  <li>Full_Date (DATE)</li>
                  <li>Day_Name (VARCHAR)</li>
                  <li>Month_Number (TINYINT)</li>
                  <li>Quarter (TINYINT)</li>
                  <li>Year_Val (SMALLINT)</li>
                  <li>Is_Weekend (BOOLEAN)</li>
                </ul>
              </div>

              {/* Dim_Account */}
              <div className="bg-slate-50 border border-emerald-200 rounded-lg p-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-emerald-900 mb-2 border-b border-emerald-100 pb-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dim_Account</span>
                </div>
                <ul className="space-y-1 font-mono text-[11px] text-slate-600">
                  <li className="text-emerald-700 font-semibold">🔑 Account_Key (INT, PK)</li>
                  <li>Account_ID (VARCHAR, UK)</li>
                  <li>Customer_Segment (ENUM)</li>
                  <li>Risk_Tier (ENUM)</li>
                  <li>First_Active_Date (DATE)</li>
                </ul>
              </div>
            </div>

            {/* Center Fact Table */}
            <div className="bg-blue-50/80 border-2 border-blue-500 rounded-xl p-5 text-xs shadow-md">
              <div className="flex items-center justify-between font-bold text-blue-950 mb-3 border-b border-blue-200 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Fact_Transactions</span>
                </div>
                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-mono">
                  CENTRAL FACT
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-3">
                Grain: 1 row per individual financial transaction
              </p>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="text-slate-800 font-bold">Primary Key:</div>
                <div className="text-blue-800 font-semibold pl-2">🔑 Fact_ID (BIGINT, PK)</div>
                <div className="text-slate-800 font-bold pt-1">Foreign Key Dimensions:</div>
                <div className="pl-2 space-y-0.5 text-blue-700">
                  <div>🔗 Date_Key → Dim_Date</div>
                  <div>🔗 Account_Key → Dim_Account</div>
                  <div>🔗 Location_Key → Dim_Location</div>
                  <div>🔗 Type_Key → Dim_Transaction_Type</div>
                </div>
                <div className="text-slate-800 font-bold pt-1">Additive Measures & Metrics:</div>
                <div className="pl-2 space-y-0.5 text-slate-700">
                  <div>📊 Amount (DECIMAL 12,2)</div>
                  <div>📊 Risk_Score (INT 0–100)</div>
                  <div>📊 Risk_Level (ENUM)</div>
                  <div>📊 Is_Suspicious (BOOLEAN)</div>
                  <div>📊 Is_Confirmed_Fraud (BOOLEAN)</div>
                </div>
              </div>
            </div>

            {/* Right Dimension Column */}
            <div className="space-y-4">
              {/* Dim_Location */}
              <div className="bg-slate-50 border border-purple-200 rounded-lg p-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-purple-900 mb-2 border-b border-purple-100 pb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-600" />
                  <span>Dim_Location</span>
                </div>
                <ul className="space-y-1 font-mono text-[11px] text-slate-600">
                  <li className="text-purple-700 font-semibold">🔑 Location_Key (INT, PK)</li>
                  <li>City_Name (VARCHAR)</li>
                  <li>Country (VARCHAR)</li>
                  <li>Region (VARCHAR)</li>
                  <li>Jurisdiction_Risk_Level (ENUM)</li>
                </ul>
              </div>

              {/* Dim_Transaction_Type */}
              <div className="bg-slate-50 border border-amber-200 rounded-lg p-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-amber-900 mb-2 border-b border-amber-100 pb-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                  <span>Dim_Transaction_Type</span>
                </div>
                <ul className="space-y-1 font-mono text-[11px] text-slate-600">
                  <li className="text-amber-700 font-semibold">🔑 Type_Key (INT, PK)</li>
                  <li>Type_Name (VARCHAR)</li>
                  <li>Channel_Category (ENUM)</li>
                  <li>Is_Immediate_Settlement (BOOL)</li>
                  <li>Historical_Fraud_Rate_Pct (DECIMAL)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Dimension Records Browser */}
      {activeTab === 'tables' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Dimensional Data Inspection
            </h3>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-medium">
              <button
                onClick={() => setSelectedDimension('facts')}
                className={`px-2.5 py-1 rounded ${
                  selectedDimension === 'facts' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Fact_Transactions
              </button>
              <button
                onClick={() => setSelectedDimension('locations')}
                className={`px-2.5 py-1 rounded ${
                  selectedDimension === 'locations' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Dim_Location
              </button>
              <button
                onClick={() => setSelectedDimension('types')}
                className={`px-2.5 py-1 rounded ${
                  selectedDimension === 'types' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Dim_Transaction_Type
              </button>
              <button
                onClick={() => setSelectedDimension('accounts')}
                className={`px-2.5 py-1 rounded ${
                  selectedDimension === 'accounts' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Dim_Account
              </button>
              <button
                onClick={() => setSelectedDimension('dates')}
                className={`px-2.5 py-1 rounded ${
                  selectedDimension === 'dates' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Dim_Date
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-md overflow-x-auto max-h-96">
            {selectedDimension === 'facts' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Fact_ID</th>
                    <th className="py-2.5 px-3">Transaction_Key</th>
                    <th className="py-2.5 px-3">Date_Key</th>
                    <th className="py-2.5 px-3">Account_Key</th>
                    <th className="py-2.5 px-3">Location_Key</th>
                    <th className="py-2.5 px-3">Type_Key</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Risk_Score</th>
                    <th className="py-2.5 px-3">Risk_Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                  {overview.sampleFacts.map((f: any) => (
                    <tr key={f.fact_id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{f.fact_id}</td>
                      <td className="py-2 px-3 text-blue-600">{f.transaction_key}</td>
                      <td className="py-2 px-3">{f.date_key}</td>
                      <td className="py-2 px-3">{f.account_key}</td>
                      <td className="py-2 px-3">{f.location_key}</td>
                      <td className="py-2 px-3">{f.type_key}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">${f.amount}</td>
                      <td className="py-2 px-3 font-bold">{f.risk_score}</td>
                      <td className="py-2 px-3">{f.risk_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedDimension === 'locations' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Location_Key</th>
                    <th className="py-2.5 px-3">City_Name</th>
                    <th className="py-2.5 px-3">Country</th>
                    <th className="py-2.5 px-3">Region</th>
                    <th className="py-2.5 px-3">Jurisdiction_Risk_Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                  {overview.dimensions.locations.map((l: any) => (
                    <tr key={l.location_key} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-purple-700">{l.location_key}</td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-900">{l.city_name}</td>
                      <td className="py-2 px-3">{l.country}</td>
                      <td className="py-2 px-3">{l.region}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            l.jurisdiction_risk_level === 'High'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {l.jurisdiction_risk_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedDimension === 'types' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Type_Key</th>
                    <th className="py-2.5 px-3">Type_Name</th>
                    <th className="py-2.5 px-3">Channel_Category</th>
                    <th className="py-2.5 px-3">Immediate_Settlement</th>
                    <th className="py-2.5 px-3">Historical_Fraud_Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                  {overview.dimensions.types.map((t: any) => (
                    <tr key={t.type_key} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-amber-700">{t.type_key}</td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-900">{t.type_name}</td>
                      <td className="py-2 px-3">{t.channel_category}</td>
                      <td className="py-2 px-3">{t.is_immediate_settlement ? 'YES' : 'NO'}</td>
                      <td className="py-2 px-3 font-bold">{t.historical_fraud_rate_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedDimension === 'accounts' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Account_Key</th>
                    <th className="py-2.5 px-3">Account_ID</th>
                    <th className="py-2.5 px-3">Customer_Segment</th>
                    <th className="py-2.5 px-3">Risk_Tier</th>
                    <th className="py-2.5 px-3">First_Active_Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                  {overview.dimensions.accounts.map((a: any) => (
                    <tr key={a.account_key} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-emerald-700">{a.account_key}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{a.account_id}</td>
                      <td className="py-2 px-3">{a.customer_segment}</td>
                      <td className="py-2 px-3">{a.risk_tier}</td>
                      <td className="py-2 px-3">{a.first_active_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedDimension === 'dates' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Date_Key</th>
                    <th className="py-2.5 px-3">Full_Date</th>
                    <th className="py-2.5 px-3">Day_Name</th>
                    <th className="py-2.5 px-3">Month_Name</th>
                    <th className="py-2.5 px-3">Quarter</th>
                    <th className="py-2.5 px-3">Year</th>
                    <th className="py-2.5 px-3">Is_Weekend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                  {overview.dimensions.dates.map((d: any) => (
                    <tr key={d.date_key} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-blue-700">{d.date_key}</td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-900">{d.full_date}</td>
                      <td className="py-2 px-3">{d.day_name}</td>
                      <td className="py-2 px-3">{d.month_name}</td>
                      <td className="py-2 px-3">Q{d.quarter}</td>
                      <td className="py-2 px-3">{d.year_val}</td>
                      <td className="py-2 px-3">{d.is_weekend ? 'TRUE' : 'FALSE'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: OLAP Slice & Dice Engine */}
      {activeTab === 'olap' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                OLAP Dimensional Cube Query Engine (Slice, Dice & Rollup)
              </h3>
              <p className="text-xs text-slate-500">
                Execute analytical rollups aggregating measures across conformed dimensional hierarchies.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Dimension Slice:</span>
              <button
                onClick={() => runOLAP('location')}
                className={`px-3 py-1.5 text-xs font-medium rounded ${
                  olapSlice === 'location'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                By Location
              </button>
              <button
                onClick={() => runOLAP('type')}
                className={`px-3 py-1.5 text-xs font-medium rounded ${
                  olapSlice === 'type'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                By Channel
              </button>
              <button
                onClick={() => runOLAP('date')}
                className={`px-3 py-1.5 text-xs font-medium rounded ${
                  olapSlice === 'date'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                By Date Rollup
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-md overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <th className="py-2.5 px-4 uppercase">{olapSlice} Dimension Value</th>
                  <th className="py-2.5 px-4 text-center">Transaction Count</th>
                  <th className="py-2.5 px-4 text-right">Aggregated Volume ($ USD)</th>
                  <th className="py-2.5 px-4 text-center">High-Risk Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {queryRunning ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-mono text-xs">
                      Computing multidimensional aggregation cube...
                    </td>
                  </tr>
                ) : olapResults?.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 font-mono text-xs">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">
                      {r.dimensionValue}
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums">{r.count}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                      ${r.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          r.highRiskCount > 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {r.highRiskCount} flagged
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: MySQL 8.0 DDL Schema Script */}
      {activeTab === 'sql' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Production MySQL 8.0 DDL Schema Script
              </h3>
              <p className="text-xs text-slate-500">
                Ready for MySQL Workbench or direct terminal execution (<code className="font-mono text-blue-600">database/warehouse_star_schema.sql</code>).
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`-- Star Schema for FinGuard\nCREATE TABLE Dim_Date ...;`);
                alert('SQL schema copied to clipboard');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Copy SQL Script</span>
            </button>
          </div>

          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-96 leading-relaxed">
{`-- ============================================================================
-- FinGuard – Data Warehousing and Data Mining Capstone Project
-- Data Warehouse Star Schema (Dimensional Modeling)
-- Target RDBMS: MySQL 8.0+
-- ============================================================================

USE finguard;

-- Dimension 1: Dim_Date
CREATE TABLE IF NOT EXISTS Dim_Date (
    date_key INT PRIMARY KEY,
    full_date DATE NOT NULL UNIQUE,
    day_name VARCHAR(15) NOT NULL,
    month_name VARCHAR(15) NOT NULL,
    quarter TINYINT NOT NULL,
    year_val SMALLINT NOT NULL,
    is_weekend BOOLEAN NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dimension 2: Dim_Account
CREATE TABLE IF NOT EXISTS Dim_Account (
    account_key INT AUTO_INCREMENT PRIMARY KEY,
    account_id VARCHAR(64) NOT NULL UNIQUE,
    customer_segment ENUM('Retail', 'Business', 'Corporate', 'Private Banking'),
    risk_tier ENUM('Low', 'Standard', 'Elevated', 'High')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dimension 3: Dim_Location
CREATE TABLE IF NOT EXISTS Dim_Location (
    location_key INT AUTO_INCREMENT PRIMARY KEY,
    city_name VARCHAR(120) NOT NULL UNIQUE,
    country VARCHAR(100),
    jurisdiction_risk_level ENUM('Low', 'Medium', 'High', 'Sanctioned')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dimension 4: Dim_Transaction_Type
CREATE TABLE IF NOT EXISTS Dim_Transaction_Type (
    type_key INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(40) NOT NULL UNIQUE,
    channel_category ENUM('Card-Present', 'Digital-CNP', 'Automated-Cash', 'Interbank-Wire'),
    historical_fraud_rate_pct DECIMAL(5,2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Central Fact Table: Fact_Transactions
CREATE TABLE IF NOT EXISTS Fact_Transactions (
    fact_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_key VARCHAR(64) NOT NULL UNIQUE,
    date_key INT NOT NULL,
    account_key INT NOT NULL,
    location_key INT NOT NULL,
    type_key INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    risk_score INT NOT NULL,
    risk_level ENUM('Low', 'Medium', 'High') NOT NULL,
    is_suspicious BOOLEAN NOT NULL,
    is_confirmed_fraud BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (date_key) REFERENCES Dim_Date(date_key),
    FOREIGN KEY (account_key) REFERENCES Dim_Account(account_key),
    FOREIGN KEY (location_key) REFERENCES Dim_Location(location_key),
    FOREIGN KEY (type_key) REFERENCES Dim_Transaction_Type(type_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`}
          </pre>
        </div>
      )}
    </div>
  );
};
