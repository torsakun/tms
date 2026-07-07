"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { InviteUserModal } from "@/components/workspace/InviteUserModal";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function InviteMemberButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button size="sm" onClick={() => setIsModalOpen(true)}>
        <UserPlus size={15} strokeWidth={2.5} />
        Invite member
      </Button>

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
