"use client";

import { useMemo, useState } from "react";
import { Factory, Globe2, PackageCheck, Search, Ship, Truck } from "lucide-react";

const SOURCING_PLATFORMS = [
  { name: "AliExpress", type: "Dropshipping / retail supplier", region: "China/global", url: "https://www.aliexpress.com" },
  { name: "CJdropshipping", type: "Dropshipping fulfillment", region: "China/global warehouses", url: "https://cjdropshipping.com" },
  { name: "1688", type: "Wholesale sourcing", region: "China", url: "https://www.1688.com" },
  { name: "Alibaba", type: "B2B wholesale", region: "Global", url: "https://www.alibaba.com" },
  { name: "Shopee Malaysia", type: "Local competitor check", region: "Malaysia", url: "https://shopee.com.my" },
  { name: "Lazada Malaysia", type: "Local competitor check", region: "Malaysia", url: "https://www.lazada.com.my" },
];

export default function SourcingIntelligence() {
  const [unitCost, setUnitCost] = useState(8);
  const [quantity, setQuantity] = useState(100);
  const [weightKg, setWeightKg] = useState(0.25);
  const [query, setQuery] = useState("");

  const estimates = useMemo(() => {
    const productCost = unitCost * quantity;
    return [
      { method: "Air express", days: "5-8 days", cost: productCost + weightKg * quantity * 6.5 },
      { method: "Standard air", days: "9-14 days", cost: productCost + weightKg * quantity * 3.8 },
      { method: "Sea freight", days: "21-35 days", cost: productCost + weightKg * quantity * 1.2 },
    ];
  }, [quantity, unitCost, weightKg]);

  const filteredPlatforms = SOURCING_PLATFORMS.filter((platform) =>
    `${platform.name} ${platform.type} ${platform.region}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Sourcing</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Source smarter before you commit</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Compare supplier paths, shipping routes, origin risk, and marketplace availability.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Supplier origin", icon: Globe2, value: "China, Malaysia, regional warehouses" },
          { title: "Fulfillment routes", icon: Ship, value: "Air, sea, cross-border warehouse" },
          { title: "Source readiness", icon: PackageCheck, value: "Compare cost, speed, and risk" },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-slate-800 bg-[#0d1322] p-5">
            <item.icon className="mb-4 h-6 w-6 text-cyan-300" />
            <h3 className="font-bold text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Sourcing platform directory</h2>
            <p className="mt-1 text-sm text-slate-500">Starter directory for Malaysia-compatible sourcing research.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search platforms..."
              className="w-full rounded-full border border-slate-700 bg-black/30 py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {filteredPlatforms.map((platform) => (
            <a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-slate-800 bg-black/20 p-5 transition hover:border-cyan-400/60 hover:bg-cyan-400/5"
            >
              <h3 className="font-bold text-white">{platform.name}</h3>
              <p className="mt-2 text-sm text-slate-400">{platform.type}</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-cyan-300">{platform.region}</p>
            </a>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1fr]">
        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6">
          <div className="mb-5 flex items-center gap-3">
            <Factory className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-bold text-white">Sourcing calculator</h2>
          </div>
          <div className="space-y-4">
            <NumberInput label="Supplier unit cost" value={unitCost} onChange={setUnitCost} />
            <NumberInput label="Order quantity" value={quantity} onChange={setQuantity} />
            <NumberInput label="Weight per unit (kg)" value={weightKg} onChange={setWeightKg} step="0.01" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-6">
          <div className="mb-5 flex items-center gap-3">
            <Truck className="h-5 w-5 text-cyan-300" />
            <h2 className="text-xl font-bold text-white">Logistics estimate</h2>
          </div>
          <div className="space-y-3">
            {estimates.map((estimate) => (
              <div key={estimate.method} className="rounded-lg border border-slate-800 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-white">{estimate.method}</p>
                    <p className="text-sm text-slate-500">{estimate.days}</p>
                  </div>
                  <p className="text-lg font-bold text-cyan-300">RM {estimate.cost.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  step = "1",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      {label}
      <input
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-lg border border-slate-700 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-400"
      />
    </label>
  );
}