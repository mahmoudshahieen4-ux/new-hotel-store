"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LuLogOut } from "react-icons/lu";

function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ redirectTo: "/" });
  };

  return (
    <Button variant="destructive" onClick={handleSignOut}>
      <LuLogOut className="mr-2 h-4 w-4" />
      Sign out
    </Button>
  );
}

export default SignOutButton;