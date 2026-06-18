"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { InviteUserModal } from "@/components/workspace/InviteUserModal";
import { useRouter } from "next/navigation";

export default function InviteMemberButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 transition-all"
        style={{ background: "var(--primary)" }}
      >
        <UserPlus size={15} strokeWidth={2.5} />
        Invite member
      </button>

      {isModalOpen && (
        <InviteUserModal
          onClose={() => {
            setIsModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
