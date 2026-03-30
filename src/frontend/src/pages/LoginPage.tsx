import { BarChart2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <BarChart2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">ProTrack</span>
        </div>
        <div className="bg-[#141E2E] border border-[#223047] rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-[#94A3B8] mb-8">
            Sign in to manage your projects and invoices
          </p>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-base"
          >
            {isLoggingIn ? "Connecting..." : "Sign in with Internet Identity"}
          </Button>
          <p className="text-center text-[#94A3B8] text-sm mt-6">
            Secure, decentralized authentication powered by ICP
          </p>
        </div>
      </div>
    </div>
  );
}
