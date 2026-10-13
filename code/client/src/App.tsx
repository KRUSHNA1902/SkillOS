import Demo from "@/components/ui/demo";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Zap } from "lucide-react";

function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <main className="w-full min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </main>
    );
  }

  if (user) {
    return (
      <main className="w-full min-h-screen bg-[#121212] text-white p-8">
        <div className="max-w-4xl mx-auto border border-white/10 p-8 rounded-2xl bg-white/5 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h1 className="text-3xl font-bold">Welcome to SkillOS Dashboard</h1>
            {user.id === 'dev-user-001' && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full text-xs font-mono font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Dev Bypass Active
              </span>
            )}
          </div>
          <p className="text-gray-400 mb-8">You are logged in as {user.email}</p>
          <button 
            onClick={logout}
            className="px-6 py-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition border border-red-500/50 cursor-pointer"
          >
            Logout
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-[#121212]">
      <Demo />
    </main>
  );
}

export default App;
