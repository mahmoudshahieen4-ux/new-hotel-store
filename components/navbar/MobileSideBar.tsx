"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LuAlignLeft, LuX } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { links } from "@/utils/links";

// شريط جانبي للموبايل: يظهر فقط على الشاشات الصغيرة (أقل من md)
// ويعرض روابط التنقل بدلاً من LinksDropdown الخاصة بسطح المكتب.
export default function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // قفل تمرير الصفحة أثناء فتح القائمة الجانبية
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const isAdmin = session?.user?.role === "ADMIN";

  const closeSidebar = () => setOpen(false);

  return (
    <>
      {/* زر الهامبرغر: يظهر فقط على الشاشات الصغيرة */}
      <Button
        variant="outline"
        size="icon"
        className="md:hidden flex justify-center items-center"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <LuAlignLeft className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* الخلفية المعتمة - يغلق بالضغط عليها */}
          <div className="absolute inset-0 bg-black/50" onClick={closeSidebar} />
          {/* الشريط الجانبي */}
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-background border-r shadow-xl p-5 flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-semibold">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close menu"
                onClick={closeSidebar}
              >
                <LuX className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex flex-col gap-1">
              {links.map((link) => {
                if (
                  (link.href.startsWith("/admin")) &&
                  !isAdmin
                ) {
                  return null;
                }
                const isActivePage = pathname === link.href;
                const variant = isActivePage ? "default" : "ghost";
                return (
                  <Button
                    key={link.href}
                    asChild
                    variant={variant}
                    onClick={closeSidebar}
                    className="w-full capitalize justify-start cursor-pointer"
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                );
              })}
            </nav>

            <div className="mt-auto border-t pt-4">
              {status === "authenticated" ? (
                <Button
                  variant="outline"
                  className="w-full cursor-pointer"
                  onClick={() => signOut({ redirectTo: "/" })}
                >
                  Sign out
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    asChild
                    variant="default"
                    onClick={closeSidebar}
                    className="w-full"
                  >
                    <Link href="/sign-in">Login</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    onClick={closeSidebar}
                    className="w-full"
                  >
                    <Link href="/sign-up">Register</Link>
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}