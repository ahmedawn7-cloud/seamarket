"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, CheckCircle, Clock, AlertTriangle, Play, Lock, BarChart, FileText, ChevronRight, Target, Edit, TrendingUp, TrendingDown, Star, Save, Copy, Trash2, Image as ImageIcon, Bot, RotateCcw, Check } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  "Electronics", "Beauty", "Home & Living", "Fashion", "Health", 
  "Food & Snacks", "Baby & Kids", "Pet Supplies", "Sports & Outdoor", 
  "Automotive", "Tools & Hardware", "Stationery", "Kitchen", 
  "Home Appliances", "Muslim Products", "Trending Viral", "Other"
];

const INITIAL_FORM_STATE = {
  platform: 'Shopee',
  product_url: '',
  image_url: '',
  product_name: '',
  price_rm: '',
  approximate_sales: '',
  category: '',
  brand: '',
  variant_count: '',
  stock_level: '',
  rating_score: '',
  review_count: '',
  shipping_location: '',
  seller_name: '',
  marketplace_country: 'Malaysia',
  assigned_to: 'Agent 1',
  source_type: 'Manual Research',
  notes: '',
  status: 'draft',
};

// --- COMPONENT: AI CARD ---
const AICard = ({ title, fieldKey, fieldData, formContext, onEdit, onRegenerate }: { title: string, fieldKey: string, fieldData: any, formContext: any, onEdit: (val: string) => void, onRegenerate?: (field: string, bot: string) => Promise<void> }) => {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("");
  const [showBotMenu, setShowBotMenu] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (!fieldData) return null;
  const isLowConfidence = fieldData.confidence < 70;

  const handleRegen = async (bot: string) => {
    if (!onRegenerate) return;
    setIsRegenerating(true);
    setShowBotMenu(false);
    try {
      await onRegenerate(fieldKey, bot);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3 bg-white">
      <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
        <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-500" /> {title}
        </h4>
        <div className="flex items-center gap-3 relative">
          {isRegenerating && <div className="text-xs text-blue-600 font-bold flex items-center gap-1 animate-pulse"><RotateCcw className="w-3 h-3 animate-spin"/> Regenerating...</div>}
          {isLowConfidence && <span className="text-xs text-red-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Needs Review</span>}
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${isLowConfidence ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {fieldData.confidence}%
          </span>
          {onRegenerate && (
            <div className="relative">
              <button onClick={() => setShowBotMenu(!showBotMenu)} className="p-1 hover:bg-gray-200 rounded text-gray-500" title="Regenerate">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              {showBotMenu && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 shadow-lg rounded-lg py-1 z-10">
                  <button onClick={() => handleRegen('Auto')} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600">Auto (Default)</button>
                  <button onClick={() => handleRegen('Gemini')} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600">Gemini</button>
                  <button onClick={() => handleRegen('Groq')} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600">Groq</button>
                  <button onClick={() => handleRegen('Cerebras')} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600">Cerebras</button>
                  <button onClick={() => handleRegen('Ollama')} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600">Ollama</button>
                  <button onClick={() => handleRegen('OpenRouter')} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600">OpenRouter</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="p-3">
        {editing ? (
          <div>
            <textarea 
              value={editVal} 
              onChange={e => setEditVal(e.target.value)} 
              className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              rows={4}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setEditing(false)} className="text-xs text-gray-500 px-3 py-1 hover:bg-gray-100 rounded">Cancel</button>
              <button onClick={() => { onEdit(editVal); setEditing(false); }} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-1"><Check className="w-3 h-3"/> Save</button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{fieldData.edited || fieldData.original}</p>
            <div className="flex gap-2 mt-3 pt-2 border-t border-gray-50">
              <button onClick={() => { setEditVal(fieldData.edited || fieldData.original); setEditing(true); }} className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline"><Edit className="w-3 h-3"/> Edit</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductOpsPage() {
  const [activeTab, setActiveTab] = useState('Intake');
  const [week, setWeek] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [rankedProducts, setRankedProducts] = useState<any[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [currentIntakeId, setCurrentIntakeId] = useState<string | null>(null);
  
  // AI Research State
  const [aiResearch, setAiResearch] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [overrideProvider, setOverrideProvider] = useState('Auto');

  const tabs = ['Intake', 'Queue', 'Gate', 'Results', 'Ranking', 'Performance'];

  useEffect(() => { fetchWeekData(); }, []);
  useEffect(() => { if (week) fetchProducts(); }, [week, activeTab]);

  // Polling mechanism removed for in-memory architecture

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchWeekData = async () => {
    try {
      const res = await fetch('/api/product-ops/weeks');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setWeek(data[0]); setDbError(null);
      } else if (data.error) {
        setDbError(data.error); setWeek(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!week) return;
    try {
      const res = await fetch(`/api/product-ops/intake?week_label=${week.week_label}`);
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
      else setProducts([]);
    } catch (e) { console.error(e); }
  };

  const runAIResearchInMemory = async () => {
    if (!form.product_name || !form.category || !form.platform) {
      alert("Name, Category, and Platform are required to start AI Research!");
      return;
    }
    
    setIsPolling(true); // Re-using isPolling as a loading state indicator
    setAiResearch({ research_status: 'running' }); // Optimistic UI state

    try {
      // Trigger AI synchronously in memory
      const aiRes = await fetch('/api/product-ops/ai-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, overrideProvider })
      });
      const aiResponse = await aiRes.json();
      
      if (aiResponse.success) {
        setAiResearch(aiResponse.data);
        
        // Auto-populate the rating score if the user hasn't entered one manually
        if (!form.rating_score && aiResponse.data.predicted_rating_score?.score) {
          setForm(prev => ({ ...prev, rating_score: aiResponse.data.predicted_rating_score.score.toString() }));
        }
      } else {
        alert("Failed to run AI: " + aiResponse.error);
        setAiResearch(null);
      }
    } catch (e) {
      console.error(e);
      alert("Error generating AI research");
      setAiResearch(null);
    } finally {
      setIsPolling(false);
    }
  };

  const approveResearch = async () => {
    if (!aiResearch || !week) return;
    
    try {
      // 1. Create the product intake record first
      const payload = { 
        ...form, 
        product_url: form.product_url?.trim() || null,
        image_url: form.image_url?.trim() || null,
        week_id: week.id, 
        week_label: week.week_label, 
        status: 'queued',
        price_rm: form.price_rm ? parseFloat(form.price_rm) : null,
        approximate_sales: form.approximate_sales ? parseInt(form.approximate_sales) : null,
        variant_count: form.variant_count ? parseInt(form.variant_count) : null,
        stock_level: form.stock_level ? parseInt(form.stock_level) : null,
        rating_score: form.rating_score ? parseFloat(form.rating_score) : null,
        review_count: form.review_count ? parseInt(form.review_count) : null,
      };
      
      const intakeRes = await fetch('/api/product-ops/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const intakeData = await intakeRes.json();
      
      if (intakeData.error) { alert(intakeData.error); return; }
      
      // 2. Save the AI Research record attached to the new intake ID
      await fetch('/api/product-ops/ai-research-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          product_intake_id: intakeData.id,
          ...aiResearch,
          approved_by: form.assigned_to, 
          approved_at: new Date().toISOString() 
        })
      });
      
      showToast("Research Approved and Saved successfully!");
      
      // Reset
      setForm(prev => ({ ...INITIAL_FORM_STATE, platform: prev.platform, assigned_to: prev.assigned_to }));
      setCurrentIntakeId(null);
      setAiResearch(null);
      fetchProducts();
      fetchWeekData();
    } catch (e) {
      console.error(e);
      alert("Error approving research.");
    }
  };

  const updateAIField = async (field: string, newText: string) => {
    if (!aiResearch) return;
    const updatedField = { ...aiResearch[field], edited: newText };
    setAiResearch({ ...aiResearch, [field]: updatedField });
  };

  const regenerateAIField = async (field: string, bot: string) => {
    try {
      const res = await fetch('/api/product-ops/ai-research-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, field, bot })
      });
      const data = await res.json();
      if (data.success && aiResearch) {
        setAiResearch((prev: any) => ({ ...prev, [field]: data.data }));
        showToast(`Regenerated ${field} using ${bot}`);
      } else {
        alert(data.error || "Failed to regenerate field");
      }
    } catch (e) {
      console.error(e);
      alert("Error regenerating field");
    }
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the form?")) {
      setForm(prev => ({ ...INITIAL_FORM_STATE, platform: prev.platform, assigned_to: prev.assigned_to }));
      setCurrentIntakeId(null);
      setAiResearch(null);
      setIsPolling(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/product-ops/intake?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Product deleted successfully");
        fetchProducts();
        fetchWeekData();
      } else {
        alert("Failed to delete product.");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting product.");
    }
  };

  const lockWeekAndRunBots = async () => {
    if (!confirm("Are you sure you want to lock the week and trigger bots?")) return;
    try {
      await fetch('/api/product-ops/weekly-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_label: week.week_label, admin_user: form.assigned_to })
      });
      alert("Week locked. Starting bots...");
      await fetch('/api/product-ops/run-all-bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_label: week.week_label })
      });
      fetchWeekData();
      fetchProducts();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Product Ops...</div>;

  const totalSubmitted = products.filter(p => p.status !== 'draft').length;
  const targetTotal = week?.target_total || 100;
  const progressPercent = Math.min(100, Math.round((totalSubmitted / targetTotal) * 100));

  const isResearchRunning = aiResearch?.research_status === 'pending' || aiResearch?.research_status?.startsWith('running');
  const isResearchDone = aiResearch?.research_status === 'completed' || aiResearch?.research_status === 'partial' || aiResearch?.research_status === 'approved';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-28 md:pb-0 relative">
      {toast && (
        <div className="fixed top-20 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-5">
          <CheckCircle className="w-5 h-5 text-green-400" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm p-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2"><Target className="text-blue-600" /> Ops: {week?.week_label}</h1>
              <p className="text-xs text-gray-500 mt-1">
                Assigned: <span className="font-medium text-gray-700">{form.assigned_to}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-blue-600">{totalSubmitted}</span>
              <span className="text-sm text-gray-500"> / {targetTotal}</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b overflow-x-auto shadow-sm">
        <div className="max-w-5xl mx-auto flex space-x-1 p-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2.5 text-sm font-semibold rounded-md whitespace-nowrap transition-colors ${activeTab === t ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 mt-2">
        {activeTab === 'Intake' && (
          <div className="max-w-3xl mx-auto space-y-6 mb-8">
            
            {/* Section 1 & 2 combined for brevity in AI mode */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span> 
                  Product Inputs
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Platform *</label>
                    <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className="w-full bg-gray-50 border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Shopee</option><option>Lazada</option><option>TikTok Shop</option>
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Product Name *</label>
                    <input type="text" value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} className="w-full bg-gray-50 border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Required for AI..." />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Category *</label>
                    <input list="cat-list" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-gray-50 border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Select or type..." />
                    <datalist id="cat-list">{DEFAULT_CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Brand</label>
                    <input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="w-full bg-gray-50 border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional" />
                  </div>
                  <div className="col-span-2 md:col-span-4">
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Image URL</label>
                    <div className="flex gap-4 items-start">
                      <div className="flex-1">
                        <input type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="w-full bg-gray-50 border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://... (Optional)" />
                      </div>
                      {form.image_url && (
                        <div className="shrink-0">
                          <img src={form.image_url} alt="Preview" className="w-12 h-12 rounded border object-cover bg-gray-100" onError={(e: any) => { e.target.style.display = 'none' }} onLoad={(e: any) => { e.target.style.display = 'block' }} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                     <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Price (RM)</label>
                     <input type="number" step="0.01" value={form.price_rm} onChange={e => setForm({ ...form, price_rm: e.target.value })} className="w-full bg-gray-50 border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                     <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Quantity Sold</label>
                     <input type="number" value={form.approximate_sales} onChange={e => setForm({ ...form, approximate_sales: e.target.value })} className="w-full bg-gray-50 border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                     <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Variant Count</label>
                     <input type="number" value={form.variant_count} onChange={e => setForm({ ...form, variant_count: e.target.value })} className="w-full bg-gray-50 border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                     <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Review Count</label>
                     <input type="number" value={form.review_count} onChange={e => setForm({ ...form, review_count: e.target.value })} className="w-full bg-gray-50 border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                     <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Rating Score</label>
                     <input type="number" step="0.1" value={form.rating_score} onChange={e => setForm({ ...form, rating_score: e.target.value })} className="w-full bg-gray-50 border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 4.8" />
                  </div>
                </div>
              </div>
            </div>

            {/* AI TRIGGER OR PROGRESS */}
            {!isResearchDone && (
              <div className={`rounded-xl shadow-sm border p-6 text-center transition-all ${isResearchRunning ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                {isResearchRunning ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <h3 className="font-bold text-blue-900 text-lg mb-1">AI Research in Progress</h3>
                    <p className="text-sm text-blue-700 font-mono bg-blue-100 px-3 py-1 rounded-full uppercase tracking-wider">{aiResearch?.research_status}</p>
                    <p className="text-xs text-blue-500 mt-4">Generating insights, checking competition, and calculating scores...</p>
                  </div>
                ) : (
                  <div>
                    <Bot className="w-12 h-12 mx-auto text-blue-600 mb-3" />
                    <h3 className="font-bold text-gray-900 text-lg mb-2">Automate Intelligence</h3>
                    <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">Click below to dispatch the AI to research market trends, regulatory risks, and generate commercial scores.</p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                      <select 
                        value={overrideProvider} 
                        onChange={(e) => setOverrideProvider(e.target.value)} 
                        className="bg-gray-50 border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                        title="Internal Provider Override"
                      >
                        <option value="Auto">Auto (Default Router)</option>
                        <option value="Gemini">Gemini</option>
                        <option value="Groq">Groq</option>
                        <option value="Cerebras">Cerebras</option>
                        <option value="Ollama">Ollama</option>
                        <option value="OpenRouter">OpenRouter</option>
                      </select>
                      <button onClick={runAIResearchInMemory} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2">
                        <Play className="w-4 h-4 fill-current" /> Trigger AI Research
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI RESEARCH CARDS */}
            {isResearchDone && (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span> 
                      Human Intelligence Review
                    </h3>
                    {aiResearch.research_status === 'partial' && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold">Partial Results</span>}
                  </div>
                  <div className="p-4 space-y-1">
                    <AICard title="Trend Analysis" fieldKey="trend_analysis" fieldData={aiResearch.trend_analysis} formContext={form} onEdit={(v) => updateAIField('trend_analysis', v)} onRegenerate={regenerateAIField} />
                    <AICard title="Target Customer" fieldKey="target_customer" fieldData={aiResearch.target_customer} formContext={form} onEdit={(v) => updateAIField('target_customer', v)} onRegenerate={regenerateAIField} />
                    <AICard title="Problem Solved" fieldKey="problem_solved" fieldData={aiResearch.problem_solved} formContext={form} onEdit={(v) => updateAIField('problem_solved', v)} onRegenerate={regenerateAIField} />
                    <AICard title="Unique Selling Points" fieldKey="usps" fieldData={aiResearch.usps} formContext={form} onEdit={(v) => updateAIField('usps', v)} onRegenerate={regenerateAIField} />
                    <AICard title="Market Opportunity" fieldKey="market_opportunity" fieldData={aiResearch.market_opportunity} formContext={form} onEdit={(v) => updateAIField('market_opportunity', v)} onRegenerate={regenerateAIField} />
                    <AICard title="Competition Landscape" fieldKey="competition_landscape" fieldData={aiResearch.competition_landscape} formContext={form} onEdit={(v) => updateAIField('competition_landscape', v)} onRegenerate={regenerateAIField} />
                    <AICard title="Supplier Availability" fieldKey="supplier_availability" fieldData={aiResearch.supplier_availability} formContext={form} onEdit={(v) => updateAIField('supplier_availability', v)} onRegenerate={regenerateAIField} />
                    <AICard title="Malaysia Regulatory" fieldKey="malaysia_regulatory" fieldData={aiResearch.malaysia_regulatory} formContext={form} onEdit={(v) => updateAIField('malaysia_regulatory', v)} onRegenerate={regenerateAIField} />
                    <AICard title="Risk Analysis" fieldKey="risk_analysis" fieldData={aiResearch.risk_analysis} formContext={form} onEdit={(v) => updateAIField('risk_analysis', v)} onRegenerate={regenerateAIField} />
                    <AICard title="Recommended Actions" fieldKey="recommended_actions" fieldData={aiResearch.recommended_actions} formContext={form} onEdit={(v) => updateAIField('recommended_actions', v)} onRegenerate={regenerateAIField} />
                  </div>
                </div>

                {/* SCORES */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs">3</span> 
                      AI Scoring & Intelligence
                    </h3>
                    <div className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current"/> Final Score: {aiResearch.final_intelligence_score}/100
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'ai_score', label: 'AI Score' },
                      { key: 'opportunity_score', label: 'Opportunity' },
                      { key: 'competition_score', label: 'Competition' },
                      { key: 'supplier_score', label: 'Supplier Availability' },
                      { key: 'risk_score_detail', label: 'Risk' },
                      { key: 'margin_score', label: 'Margin' },
                    ].map(s => aiResearch[s.key] && (
                      <div key={s.key} className="bg-gray-50 p-3 rounded-lg border">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-gray-500 uppercase">{s.label}</span>
                          <span className="font-black text-lg text-blue-600">{aiResearch[s.key].score}</span>
                        </div>
                        <p className="text-xs text-gray-600">{aiResearch[s.key].explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] z-40 md:relative md:bg-transparent md:border-none md:shadow-none md:p-0">
              <div className="max-w-3xl mx-auto flex gap-2">
                <button onClick={handleClear} className="p-3 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors shrink-0" title="Clear Form"><Trash2 className="w-5 h-5" /></button>
                {aiResearch?.research_status === 'approved' ? (
                   <div className="flex-1 bg-green-50 text-green-700 font-medium py-3 rounded-xl shadow-sm border border-green-200 flex items-center justify-center gap-2">
                     <Lock className="w-4 h-4" /> Research Approved & Locked
                   </div>
                ) : isResearchDone ? (
                  <button onClick={approveResearch} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Approve Research
                  </button>
                ) : (
                  <div className="flex-1 bg-gray-100 text-gray-400 font-medium py-3 rounded-xl flex items-center justify-center gap-2">
                    Waiting for AI...
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
        
        {/* TAB 2: QUEUE */}
        {activeTab === 'Queue' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
               <h2 className="font-semibold text-gray-700">Research Queue ({products.length})</h2>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                   <tr>
                     <th className="px-4 py-3">Product</th>
                     <th className="px-4 py-3">Platform</th>
                     <th className="px-4 py-3">Category</th>
                     <th className="px-4 py-3">Status</th>
                     <th className="px-4 py-3 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {products.map(p => (
                     <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-3">
                         {p.image_url ? <img src={p.image_url} className="w-8 h-8 rounded border object-cover" /> : <div className="w-8 h-8 rounded border bg-gray-100" />}
                         <span className="max-w-[200px] truncate" title={p.product_name}>{p.product_name}</span>
                       </td>
                       <td className="px-4 py-3 text-gray-600">{p.platform}</td>
                       <td className="px-4 py-3 text-gray-600">{p.category || '-'}</td>
                       <td className="px-4 py-3">
                         <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                           p.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                           p.status === 'queued' ? 'bg-blue-50 text-blue-700' :
                           p.status === 'approved' ? 'bg-green-50 text-green-700' :
                           'bg-purple-50 text-purple-700'
                         }`}>
                           {p.status}
                         </span>
                       </td>
                       <td className="px-4 py-3 text-right">
                         <button 
                           onClick={() => handleDelete(p.id, p.product_name)}
                           className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors inline-flex"
                           title="Delete Product"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </td>
                     </tr>
                   ))}
                   {products.length === 0 && (
                     <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No products submitted this week yet.</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {/* TAB 3: GATE */}
        {activeTab === 'Gate' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Weekly Research Gate</h2>
              <p className="text-gray-500 mb-6">Lock the week and dispatch AI agents to enrich all queued products.</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Current Week</p>
                  <p className="font-semibold text-gray-900">{week?.week_label}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Valid Submissions</p>
                  <p className="font-semibold text-gray-900">{totalSubmitted} / {week?.target_total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gate Status</p>
                  <p className="font-semibold capitalize text-gray-900">{week?.status?.replace(/_/g, ' ')}</p>
                </div>
              </div>

              {week?.status === 'in_progress' ? (
                <button 
                  onClick={lockWeekAndRunBots}
                  className="bg-gray-900 hover:bg-black text-white font-medium py-3 px-8 rounded-lg shadow-sm transition-colors inline-flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> Lock Week & Run Bots
                </button>
              ) : (
                <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-4 font-medium flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Bots have been dispatched for this week!
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: RANKING */}
        {activeTab === 'Ranking' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {rankedProducts.map((rp, idx) => (
                <div key={rp.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row gap-4 items-start md:items-center relative overflow-hidden">
                  
                  {/* Badge */}
                  <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold uppercase rounded-bl-lg
                    ${rp.final_recommendation === 'Push' ? 'bg-green-500 text-white' : 
                      rp.final_recommendation === 'Test' ? 'bg-blue-500 text-white' : 
                      rp.final_recommendation === 'Avoid' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                    }
                  `}>
                    {rp.final_recommendation}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">{rp.product_intake?.platform}</span>
                      <span className="text-xs text-gray-400">#{idx + 1}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1 pr-16">{rp.product_intake?.product_name}</h3>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4 text-green-500"/> Opp Score: {rp.final_opportunity_score}</span>
                      <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-orange-500"/> Risk Score: {rp.final_risk_score}</span>
                    </div>
                  </div>
                </div>
              ))}
              {rankedProducts.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
                  No ranked products yet. Lock the week and run bots first.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
