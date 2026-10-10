import Image from "next/image";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import SectionTitle from '@/components/global/SectionTitle';
import { fetchUserOrders } from '@/utils/actions';
import { formatCurrency, formatDate } from '@/utils/format';

async function OrdersPage() {
  const orders = await fetchUserOrders();

  return (
    <>
      <SectionTitle text='Your Orders' />
      <Table>
        <TableCaption>Total Orders : {orders.length}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Order Items</TableHead>
            <TableHead>Shipping Details</TableHead>
            <TableHead>Order Total</TableHead>
            <TableHead>Tax</TableHead>
            <TableHead>Shipping</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const {
              orderItems,
              orderTotal,
              tax,
              shipping,
              createdAt,
              shippingName,
              shippingPhone,
              shippingAddress,
              city,
            } = order;

            return (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="space-y-2 py-1">
                    {orderItems && orderItems.length > 0 ? (
                      orderItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          {item.image && (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={36}
                              height={36}
                              className="w-9 h-9 object-cover rounded"
                            />
                          )}
                          <div className="text-xs">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-muted-foreground">
                              {item.amount} x {formatCurrency(item.price)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">{order.products} items</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs space-y-0.5">
                    {shippingName && <p className="font-medium">{shippingName}</p>}
                    {shippingPhone && <p className="text-muted-foreground">{shippingPhone}</p>}
                    {(shippingAddress || city) && (
                      <p className="text-muted-foreground">{shippingAddress}, {city}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(orderTotal)}</TableCell>
                <TableCell>{formatCurrency(tax)}</TableCell>
                <TableCell>{formatCurrency(shipping)}</TableCell>
                <TableCell>{formatDate(createdAt)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
export default OrdersPage;
