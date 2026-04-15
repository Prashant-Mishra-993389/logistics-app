import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, ArrowUpRight, Database, Server } from "lucide-react";
import { buildApiUrl, openInNewTab, rolePortalMap } from "@/lib/platformConfig";

const ROLE_SEQUENCE = ["client", "admin", "driver"];

const getServiceBadgeClass = (value) => {
  if (value === "up" || value === "configured") {
    return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  }

  if (value === "down") {
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  }

  return "text-amber-300 border-amber-500/30 bg-amber-500/10";
};

export default function PlatformGateway() {
  const [health, setHealth] = useState({
    loading: true,
    ok: false,
    services: {
      database: "checking",
      storage: "checking",
    },
    timestamp: null,
  });
  const [snapshot, setSnapshot] = useState({ loading: true, metrics: [], ordersCount: null });

  const refreshStatus = useCallback(async () => {
    try {
      const [healthRes, dashboardRes] = await Promise.all([
        fetch(buildApiUrl("/health")),
        fetch(buildApiUrl("/dashboard")),
      ]);

      if (!healthRes.ok) {
        throw new Error(`Health endpoint returned ${healthRes.status}`);
      }

      const healthData = await healthRes.json();
      setHealth({
        loading: false,
        ok: Boolean(healthData?.ok),
        services: {
          database: healthData?.services?.database ?? "unknown",
          storage: healthData?.services?.storage ?? "unknown",
        },
        timestamp: healthData?.timestamp ?? null,
      });

      if (!dashboardRes.ok) {
        setSnapshot({ loading: false, metrics: [], ordersCount: null });
        return;
      }

      const dashboardData = await dashboardRes.json();
      const metrics = Array.isArray(dashboardData?.metrics) ? dashboardData.metrics.slice(0, 3) : [];
      const ordersCount = Array.isArray(dashboardData?.orders) ? dashboardData.orders.length : null;

      setSnapshot({
        loading: false,
        metrics,
        ordersCount,
      });
    } catch {
      setHealth({
        loading: false,
        ok: false,
        services: {
          database: "down",
          storage: "unknown",
        },
        timestamp: null,
      });
      setSnapshot({ loading: false, metrics: [], ordersCount: null });
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const intervalId = window.setInterval(refreshStatus, 30000);
    return () => window.clearInterval(intervalId);
  }, [refreshStatus]);

  const roleCards = useMemo(() => {
    return ROLE_SEQUENCE.map((key) => ({ key, ...rolePortalMap[key] }));
  }, []);

  const statusLabel = health.loading ? "Checking" : health.ok ? "Online" : "Offline";
  const statusTone = health.loading ? "text-amber-300" : health.ok ? "text-emerald-400" : "text-rose-400";

  return (
    <section id="portal-launchpad" className="bg-[#0B0B0B] border-y border-white/10 px-6 py-24 md:px-[8vw]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 mb-12">
          <div>
            <p className="font-inter text-[11px] tracking-[5px] text-accent-red uppercase mb-4">Platform Entry</p>
            <h2 className="font-bebas text-[44px] md:text-[72px] leading-none text-white tracking-[-1px]">
              LAUNCH <span className="text-white/20">EVERY WORKSPACE.</span>
            </h2>
            <p className="font-inter text-text-secondary text-[15px] max-w-2xl mt-6">
              This is the live gateway between your landing page, backend API, and every operational dashboard.
              Open any role portal directly and verify backend health in one place.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 px-5 py-4 min-w-[240px]">
            <div className="flex items-center gap-3 mb-2">
              <Activity className={`w-4 h-4 ${statusTone}`} />
              <span className="font-inter text-[12px] uppercase tracking-[2px] text-white/70">System Status</span>
            </div>
            <div className={`font-bebas text-[30px] tracking-[2px] ${statusTone}`}>{statusLabel}</div>
            <p className="font-inter text-[12px] text-white/40 mt-1">
              {health.timestamp ? `Updated ${new Date(health.timestamp).toLocaleTimeString()}` : "Waiting for API response"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {roleCards.map((role, index) => (
            <motion.div
              key={role.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-background border border-white/10 p-7 flex flex-col gap-4"
            >
              <div className="font-inter text-[11px] text-accent-red tracking-[3px] uppercase">{role.label}</div>
              <p className="font-inter text-[14px] text-text-secondary leading-relaxed min-h-[52px]">{role.description}</p>
              <button
                type="button"
                onClick={() => openInNewTab(role.url)}
                className="mt-3 inline-flex items-center justify-center gap-2 bg-accent-red text-white font-bebas text-[16px] tracking-[3px] py-3 px-5 uppercase hover:bg-red-700 transition-colors"
              >
                Open Portal
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <p className="font-inter text-[11px] text-white/35 break-all">{role.url}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-black/40 border border-white/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-accent-red" />
              <h3 className="font-bebas text-[24px] tracking-[2px] text-white">Backend Services</h3>
            </div>
            <div className="flex flex-wrap gap-3 mb-4">
              <span className={`inline-flex items-center px-3 py-1 border text-[11px] uppercase tracking-[2px] ${getServiceBadgeClass(health.services.database)}`}>
                <Database className="w-3 h-3 mr-2" />
                Database: {health.services.database}
              </span>
              <span className={`inline-flex items-center px-3 py-1 border text-[11px] uppercase tracking-[2px] ${getServiceBadgeClass(health.services.storage)}`}>
                Storage: {health.services.storage}
              </span>
            </div>
            <button
              type="button"
              onClick={refreshStatus}
              className="font-inter text-[12px] tracking-[2px] uppercase text-white/80 border border-white/20 px-4 py-2 hover:text-white hover:border-white/40 transition-colors"
            >
              Refresh Health
            </button>
          </div>

          <div className="bg-black/40 border border-white/10 p-6">
            <h3 className="font-bebas text-[24px] tracking-[2px] text-white mb-4">Live Snapshot</h3>
            {snapshot.loading ? (
              <p className="font-inter text-[14px] text-text-secondary">Loading latest platform metrics...</p>
            ) : snapshot.metrics.length > 0 ? (
              <div className="space-y-3">
                {snapshot.metrics.map((metric) => (
                  <div key={metric.id} className="border border-white/10 px-4 py-3 bg-background/70">
                    <p className="font-inter text-[11px] uppercase tracking-[2px] text-white/55">{metric.label}</p>
                    <p className="font-bebas text-[34px] leading-none text-white mt-1">{metric.value}</p>
                    <p className="font-inter text-[12px] text-text-secondary mt-1">{metric.note}</p>
                  </div>
                ))}
                {snapshot.ordersCount !== null && (
                  <p className="font-inter text-[12px] text-white/55 uppercase tracking-[2px]">
                    Total active order records loaded: {snapshot.ordersCount}
                  </p>
                )}
              </div>
            ) : (
              <p className="font-inter text-[14px] text-text-secondary">
                Dashboard feed unavailable right now. Start backend on port 5000 to fetch live metrics.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
