"use client";

import { useState, useEffect } from "react";
import { Plus, Layers, RefreshCw, BarChart2, Eye, MousePointer } from "lucide-react";

export default function AdsPage() {
  const [ads, setAds] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newZone, setNewZone] = useState({ name: "", width: "", height: "" });
  const [newAd, setNewAd] = useState({
    zoneId: "",
    name: "",
    type: "banner",
    code: "",
    imageUrl: "",
    targetUrl: "",
    isActive: true,
  });

  const [activeTab, setActiveTab] = useState("ads"); // "ads" or "zones"
  const [siteId, setSiteId] = useState("");
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem("x-site-id") || process.env.NEXT_PUBLIC_SITE_ID || "";
    setSiteId(id);
  }, []);

  useEffect(() => {
    if (siteId) {
      fetchData();
    }
  }, [siteId]);

  const fetchData = async () => {
    setLoading(true);
    setSaveError(null);
    try {
      const [adsRes, zonesRes] = await Promise.all([
        fetch("/api/admin/ads", { headers: { "x-site-id": siteId } }),
        fetch("/api/admin/ads/zones", { headers: { "x-site-id": siteId } })
      ]);
      if (adsRes.ok && zonesRes.ok) {
        const adsData = await adsRes.json().catch(() => ({}));
        const zonesData = await zonesRes.json().catch(() => ({}));
        if (adsData.success) setAds(adsData.data?.ads || []);
        if (zonesData.success) setZones(zonesData.data?.zones || []);
      }
    } catch (e) {
      console.error("Failed to load advertising data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/ads/zones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId
        },
        body: JSON.stringify({
          name: newZone.name,
          width: newZone.width ? Number(newZone.width) : null,
          height: newZone.height ? Number(newZone.height) : null,
        })
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setNewZone({ name: "", width: "", height: "" });
        fetchData();
      } else {
        setSaveError(data.error || "Failed to create ad zone");
      }
    } catch (err) {
      setSaveError("Error creating ad zone");
    }
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-site-id": siteId
        },
        body: JSON.stringify(newAd)
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setNewAd({
          zoneId: "",
          name: "",
          type: "banner",
          code: "",
          imageUrl: "",
          targetUrl: "",
          isActive: true,
        });
        fetchData();
      } else {
        setSaveError(data.error || "Failed to create ad");
      }
    } catch (err) {
      setSaveError("Error creating ad");
    }
  };

  const handleDeleteAd = async (id) => {
    if (!confirm("Are you sure you want to delete this ad?")) return;
    try {
      const res = await fetch(`/api/admin/ads/${id}`, {
        method: "DELETE",
        headers: { "x-site-id": siteId }
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics calculations
  const totalImpressions = ads.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
  const totalClicks = ads.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
  const totalCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Advertisement Management</h1>
          <p className="text-slate-500 text-xs mt-1">Configure AdSense layouts, banner promotions, and track conversion rates.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-605 rounded-lg">
            <Eye size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block mb-0.5">Total Impressions</span>
            <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{totalImpressions.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-lg">
            <MousePointer size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block mb-0.5">Total Clicks</span>
            <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{totalClicks.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-lg">
            <BarChart2 size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-450 block mb-0.5">Average CTR</span>
            <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{totalCtr}%</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b dark:border-slate-700 gap-4">
        <button
          onClick={() => setActiveTab("ads")}
          className={`pb-2.5 text-xs font-bold transition-all relative ${
            activeTab === "ads" ? "text-indigo-650 dark:text-indigo-400 border-b-2 border-indigo-600" : "text-slate-400"
          }`}
        >
          Active Campaigns
        </button>
        <button
          onClick={() => setActiveTab("zones")}
          className={`pb-2.5 text-xs font-bold transition-all relative ${
            activeTab === "zones" ? "text-indigo-650 dark:text-indigo-400 border-b-2 border-indigo-600" : "text-slate-400"
          }`}
        >
          Ad Placement Zones
        </button>
      </div>

      {activeTab === "ads" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ad List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Ad Campaigns List</span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading campaign list...</div>
              ) : ads.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-450">No ad campaigns configured. Create one on the right!</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="p-3">Campaign / Code</th>
                        <th className="p-3">Placement Zone</th>
                        <th className="p-3 text-center">Stats</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
                      {ads.map((ad) => (
                        <tr key={ad.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                          <td className="p-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-100">{ad.name}</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{ad.type}</div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700/80 rounded-md font-medium text-[10px]">
                              {ad.zone?.name || "Unassigned"}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="font-semibold">{ad.clicks || 0} Clicks</div>
                            <div className="text-[10px] text-slate-400">{ad.impressions || 0} Imps</div>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteAd(ad.id)}
                              className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Create Ad Form */}
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 p-5 rounded-xl space-y-4 h-fit">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
              <Plus size={14} /> Create Ad Campaign
            </h3>
            <form onSubmit={handleCreateAd} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Promo Banner"
                  value={newAd.name}
                  onChange={(e) => setNewAd({ ...newAd, name: e.target.value })}
                  className="w-full p-2 border rounded-lg text-xs dark:bg-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Placement Zone</label>
                <select
                  required
                  value={newAd.zoneId}
                  onChange={(e) => setNewAd({ ...newAd, zoneId: e.target.value })}
                  className="w-full p-2 border rounded-lg text-xs dark:bg-slate-900 outline-none"
                >
                  <option value="">Select Zone</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Ad Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAd({ ...newAd, type: "banner" })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      newAd.type === "banner"
                        ? "bg-indigo-50 border-indigo-250 text-indigo-650 dark:bg-indigo-950/20"
                        : "border-slate-200 text-slate-400"
                    }`}
                  >
                    Image Banner
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAd({ ...newAd, type: "adsense" })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      newAd.type === "adsense"
                        ? "bg-indigo-50 border-indigo-250 text-indigo-650 dark:bg-indigo-950/20"
                        : "border-slate-200 text-slate-400"
                    }`}
                  >
                    AdSense / Custom Code
                  </button>
                </div>
              </div>

              {newAd.type === "banner" ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Banner Image URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/banner.png"
                      value={newAd.imageUrl}
                      onChange={(e) => setNewAd({ ...newAd, imageUrl: e.target.value })}
                      className="w-full p-2 border rounded-lg text-xs dark:bg-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Target Redirect URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/promo-target"
                      value={newAd.targetUrl}
                      onChange={(e) => setNewAd({ ...newAd, targetUrl: e.target.value })}
                      className="w-full p-2 border rounded-lg text-xs dark:bg-slate-900 outline-none"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">HTML Code / Scripts</label>
                  <textarea
                    rows={4}
                    placeholder='<ins class="adsbygoogle" ...>'
                    value={newAd.code}
                    onChange={(e) => setNewAd({ ...newAd, code: e.target.value })}
                    className="w-full p-2 border rounded-lg text-xs dark:bg-slate-900 outline-none font-mono"
                  />
                </div>
              )}

              <button type="submit" className="w-full py-2 bg-indigo-650 text-white rounded-lg text-xs font-bold mt-2">
                Deploy Campaign
              </button>
              {saveError && <p className="text-red-500 text-xs font-semibold">{saveError}</p>}
            </form>
          </div>
        </div>
      )}

      {activeTab === "zones" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Zones List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b dark:border-slate-700">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Ad Placement Zones</span>
              </div>

              {zones.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No ad placement zones configured.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {zones.map((zone) => (
                    <div key={zone.id} className="p-4 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">{zone.name}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700/80 rounded-md font-medium text-[10px]">
                          {zone.width && zone.height ? `${zone.width}x${zone.height}` : "Responsive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Create Zone Form */}
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 p-5 rounded-xl space-y-4 h-fit">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
              <Layers size={14} /> Create Placement Zone
            </h3>
            <form onSubmit={handleCreateZone} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Header Leaderboard"
                  value={newZone.name}
                  onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                  className="w-full p-2 border rounded-lg text-xs dark:bg-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Width (px)</label>
                  <input
                    type="number"
                    placeholder="728"
                    value={newZone.width}
                    onChange={(e) => setNewZone({ ...newZone, width: e.target.value })}
                    className="w-full p-2 border rounded-lg text-xs dark:bg-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Height (px)</label>
                  <input
                    type="number"
                    placeholder="90"
                    value={newZone.height}
                    onChange={(e) => setNewZone({ ...newZone, height: e.target.value })}
                    className="w-full p-2 border rounded-lg text-xs dark:bg-slate-900 outline-none"
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-2 bg-indigo-650 text-white rounded-lg text-xs font-bold mt-2">
                Create Zone
              </button>
              {saveError && <p className="text-red-500 text-xs font-semibold">{saveError}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
