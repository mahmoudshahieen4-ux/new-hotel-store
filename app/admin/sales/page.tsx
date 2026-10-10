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

import { fetchAdminOrders } from '@/utils/actions';
import { formatCurrency, formatDate } from '@/utils/format';
import PaginationContainer from '@/components/global/PaginationContainer';

async function SalesPage({ searchParams }: { searchParams?: { page?: string } }) {
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const { orders, total, totalPages } = await fetchAdminOrders(page);

  return (
    <>
    <Table>
      <TableCaption>Total Orders : {total}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Order Items</TableHead>
          <TableHead>Shipping Address</TableHead>
          <TableHead>Order Total</TableHead>
          <TableHead>Tax</TableHead>
          <TableHead>Shipping</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const {
            orderTotal,
            tax,
            shipping,
            createdAt,
            email,
            orderItems,
            shippingName,
            shippingPhone,
            shippingAddress,
            city,
          } = order;

          return (
            <TableRow key={order.id}>
              <TableCell>
                <div className="text-xs">
                  <p className="font-medium">{shippingName || email}</p>
                  <p className="text-muted-foreground">{email}</p>
                  {shippingPhone && <p className="text-muted-foreground">{shippingPhone}</p>}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 py-1">
                  {orderItems && orderItems.length > 0 ? (
                    orderItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-cover rounded"
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
                <div className="text-xs text-muted-foreground">
                  {(shippingAddress || city) ? `${shippingAddress}, ${city}` : "N/A"}
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
    <PaginationContainer currentPage={page} totalPages={totalPages} />
    </>
  );
}
export default SalesPage;
