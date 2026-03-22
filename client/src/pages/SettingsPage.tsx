import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { user, units, updateUnits, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() { logout(); navigate("/login"); }

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-6 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)}
          className="text-white/40 hover:text-white/70 transition-colors text-sm flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h2 className="text-white font-bold text-base">Settings</h2>
        <div className="w-10" />
      </div>

      {/* Account card */}
      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5 space-y-3">
        <h3 className="text-white/50 text-xs uppercase tracking-wide font-medium">Account</h3>
        <div className="flex items-center gap-4">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
              {user?.name[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-white font-semibold text-sm">{user?.name}</p>
            <p className="text-white/40 text-xs">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Units card */}
      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5 space-y-3">
        <h3 className="text-white/50 text-xs uppercase tracking-wide font-medium">Units</h3>
        <p className="text-white/40 text-xs">Weight and height display preference. Data is always stored in metric.</p>
        <div className="flex gap-2">
          {(["metric", "imperial"] as const).map((u) => (
            <button key={u} onClick={() => updateUnits(u)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                units === u
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                  : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
              }`}>
              {u === "metric" ? "Metric (kg / cm)" : "Imperial (lbs / ft)"}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all">
        Sign out
      </button>
    </div>
  );
}
