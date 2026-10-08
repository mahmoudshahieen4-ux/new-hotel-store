import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchAdminOrders, fetchAdminProducts } from "@/utils/actions";
import { formatCurrency } from "@/utils/format";
import {
  LuPackage,
  LuShoppingCart,
  LuDollarSign,
  LuPlus,
  LuChartColumn,
} from "react-icons/lu";

export const metadata = {
  title: "Admin Dashboard",
};

const quickActions = [
  { href: "/admin/products", label: "Manage Products", icon: LuPackage },
  { href: "/admin/products/create", label: "Create Product", icon: LuPlus },
  { href: "/admin/sales", label: "View Sales", icon: LuChartColumn },
];

export default async function AdminDashboardPage() {
  const session = await auth();

  // Defense in depth: the middleware already guards /admin, but we double check
  // here so a non-admin who somehow reaches this page is still bounced home.
  if (!session?.user) redirect("/sign-in?redirect_url=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  const [products, orders] = await Promise.all([
    fetchAdminProducts(),
    fetchAdminOrders(),
  ]);

  const stats = [
    {
      label: "Total Products",
      value: products.length.toString(),
      icon: LuPackage,
    },
    {
      label: "Total Orders",
      value: orders.length.toString(),
      icon: LuShoppingCart,
    },
    {
      label: "Total Revenue",
      value: formatCurrency(orders.reduce((sum, o) => sum + o.orderTotal, 0)),
      icon: LuDollarSign,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold">
          Welcome, {session.user.name ?? "Admin"} 👋
        </h3>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your store.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your store from here.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {quickActions.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              asChild
              variant="outline"
              className="justify-start"
            >
              <Link href={href}>
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
