"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LuUser, LuLogIn } from "react-icons/lu";

export default function LinksDropdown() {
  const { data: session, status } = useSession();

  // حالة تحميل الجلسة (Loading)
  if (status === "loading") {
    return (
      <Button variant="outline" size="icon" disabled>
        <LuUser className="w-5 h-5" />
      </Button>
    );
  }

  // المستخدم مسجّل دخوله: تظهر أيقونة البروفايل فقط وتفتح صفحة الحساب.
  if (status === "authenticated") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full overflow-hidden"
            title="My account"
          >
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="Profile"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <LuUser className="w-5 h-5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44" align="end" sideOffset={10}>
          <DropdownMenuItem asChild>
            <Link href="/account" className="w-full cursor-pointer">
              My Account
            </Link>
          </DropdownMenuItem>
          {session?.user?.role === "ADMIN" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="w-full cursor-pointer">
                  Admin Dashboard
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // غير مسجّل: لا تظهر أيقونة بروفايل، بل زر/قائمة تسجيل دخول فقط.
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Login">
          <LuLogIn className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end" sideOffset={10}>
        <DropdownMenuItem asChild>
          <Link href="/sign-in" className="w-full cursor-pointer">
            Login
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/sign-up" className="w-full cursor-pointer">
            Register
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
