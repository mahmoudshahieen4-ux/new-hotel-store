import CartItemsList from "@/components/cart/CartItemsList";
import CartTotals from "@/components/cart/CartTotals";
import SectionTitle from "@/components/global/SectionTitle";
import { fetchOrCreateCart, updateCart } from "@/utils/actions";
import { auth } from "@/auth";

async function CartPage() {
  const session = await auth();
  // Guest-safe: open the cart page with an empty state instead of bouncing
  // logged-out visitors away when they click the cart icon in the nav.
  if (!session?.user?.id) return <SectionTitle text="Empty Cart" />;
  const previousCart = await fetchOrCreateCart({ userId: session.user.id });
  const { currentCart, cartItems } = await updateCart(previousCart);
  if (cartItems.length === 0) return <SectionTitle text="Empty Cart" />;

  return (
    <>
      <SectionTitle text="Shopping Cart" />
      <div className="mt-8 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <CartItemsList cartItems={cartItems} />
        </div>
        <div className="lg:col-span-4">
          <CartTotals cart={currentCart} />
        </div>
      </div>
    </>
  );
}
export default CartPage;
