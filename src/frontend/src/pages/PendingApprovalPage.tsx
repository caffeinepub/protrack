import { BarChart2, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function PendingApprovalPage() {
  const { clear } = useInternetIdentity();

  return (
    <div
      className="min-h-screen bg-[#0B1220] flex items-center justify-center"
      data-ocid="pending_approval.page"
    >
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <BarChart2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">ProTrack</span>
        </div>

        {/* Card */}
        <div className="bg-[#141E2E] border border-[#223047] rounded-2xl p-8 shadow-2xl text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">
            Account Pending Approval
          </h1>
          <p className="text-[#94A3B8] mb-8 leading-relaxed">
            Your account is under review. An admin will approve your access
            shortly.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-[#94A3B8] bg-[#0B1220] rounded-xl p-3">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full flex-shrink-0 animate-pulse" />
              <span>Waiting for admin approval&hellip;</span>
            </div>
          </div>

          <Button
            data-ocid="pending_approval.sign_out.button"
            onClick={clear}
            variant="outline"
            className="mt-6 w-full border-[#223047] text-[#94A3B8] hover:text-white hover:bg-white/5 hover:border-[#2d3f5a]"
          >
            Sign Out
          </Button>
        </div>

        <p className="text-center text-[#94A3B8] text-xs mt-6">
          Secure, decentralized authentication powered by ICP
        </p>
      </div>
    </div>
  );
}
