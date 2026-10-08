"use client";

import { signOut } from "next-auth/react";
import { useToast } from "../ui/use-toast";

function SignOutLink() {
  const { toast } = useToast();

  const handleLogout = async () => {
    toast({ description: "Logout Successful" });
    await signOut({ redirectTo: "/" });
  };

  return (
    <button onClick={handleLogout} className="w-full text-left">
      Logout
    </button>
  );
}

export default SignOutLink;
