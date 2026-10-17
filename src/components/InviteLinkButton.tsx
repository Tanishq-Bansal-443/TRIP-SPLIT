"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

interface InviteLinkButtonProps {
  inviteToken: string;
  groupName: string;
}

export function InviteLinkButton({ inviteToken, groupName }: InviteLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const getInviteUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/join/${inviteToken}`;
    }
    return `/join/${inviteToken}`;
  };

  const handleCopy = async () => {
    const url = getInviteUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      prompt("Copy trip invite link:", url);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-sm"
      title={`Click to copy invite link for ${groupName}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>Invite Link Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Invite Friends</span>
        </>
      )}
    </button>
  );
}
