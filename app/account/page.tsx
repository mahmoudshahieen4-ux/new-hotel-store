import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LuHeart,
  LuShoppingCart,
  LuPackage,
  LuStar,
  LuMail,
} from "react-icons/lu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SignOutButton from "@/components/account/SignOutButton";
import { fetchFavoritesCount, fetchCartItems } from "@/utils/actions";

export const metadata = {
  title: "My Account",
};

const quickLinks = [
  { href: "/orders", label: "Orders", icon: LuPackage },
  { href: "/favorites", label: "Favorites", icon: LuHeart },
  { href: "/reviews", label: "Reviews", icon: LuStar },
  { href: "/cart", label: "Cart", icon: LuShoppingCart },
];

export default async function AccountPage() {
  const session = await auth();

  // The account page is only available to signed-in users.
  if (!session?.user) {
    redirect("/sign-in?redirect_url=/account");
  }

  const user = session.user;
  const [favoritesCount, cartCount] = await Promise.all([
    fetchFavoritesCount(),
    fetchCartItems(),
  ]);

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">My Account</CardTitle>
          <CardDescription>
            Manage your account and view your activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Profile */}
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-full overflow-hidden border-2">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? "User"}
                  width={64}
                  height={64}
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary text-primary-foreground text-2xl font-semibold">
                  {(user.name?.[0] ?? "U").toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user.name ?? "User"}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 break-all">
                <LuMail className="h-4 w-4 shrink-0" />
                {user.email}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                User ID: <code className="bg-muted px-1.5 py-0.5 rounded">{user.id}</code>
              </p>
              <p className="text-xs mt-1">
                <span
                  className={
                    user.role === "ADMIN"
                      ? "inline-block rounded bg-primary px-1.5 py-0.5 text-primary-foreground font-medium"
                      : "inline-block rounded bg-muted px-1.5 py-0.5 text-muted-foreground font-medium"
                  }
                >
                  {user.role === "ADMIN" ? "Admin" : "Member"}
                </span>
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <p className="flex items-center gap-2 text-2xl font-bold">
                <LuHeart className="h-5 w-5 text-primary" />
                {favoritesCount}
              </p>
              <p className="text-sm text-muted-foreground">Favorites</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="flex items-center gap-2 text-2xl font-bold">
                <LuShoppingCart className="h-5 w-5 text-primary" />
                {cartCount}
              </p>
              <p className="text-sm text-muted-foreground">Cart items</p>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickLinks.map((link) => (
              <Button
                key={link.href}
                asChild
                variant="outline"
                className="justify-start"
              >
                <Link href={link.href}>
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
          </div>

          {/* Sign out */}
          <div className="pt-4 border-t">
            <SignOutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}