import { Card, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/utils/format';
import { createOrderAction } from '@/utils/actions';
import FormContainer from '../form/FormContainer';
import { SubmitButton } from '../form/Buttons';
import { Cart } from '@prisma/client';

function CartTotals({ cart }: { cart: Cart }) {
  const { cartTotal, shipping, tax, orderTotal } = cart;
  return (
    <div>
      <Card className='p-8'>
        <CartTotalRow label='Subtotal' amount={cartTotal} />
        <CartTotalRow label='Shipping' amount={shipping} />
        <CartTotalRow label='Tax' amount={tax} />
        <CardTitle className='mt-8'>
          <CartTotalRow label='Order Total' amount={orderTotal} lastRow />
        </CardTitle>
      </Card>
      <Card className='p-6 mt-4'>
        <h3 className='text-base font-semibold mb-4'>Shipping Details</h3>
        <FormContainer action={createOrderAction}>
          <div className='space-y-3 mb-6'>
            <div>
              <Label htmlFor='shippingName'>Full Name</Label>
              <Input
                id='shippingName'
                name='shippingName'
                placeholder='Ahmed Hassan'
                required
              />
            </div>
            <div>
              <Label htmlFor='shippingPhone'>Phone Number (Egyptian)</Label>
              <Input
                id='shippingPhone'
                name='shippingPhone'
                placeholder='01012345678'
                required
              />
            </div>
            <div>
              <Label htmlFor='shippingAddress'>Street Address</Label>
              <Input
                id='shippingAddress'
                name='shippingAddress'
                placeholder='123 Main St, Apartment 4B'
                required
              />
            </div>
            <div>
              <Label htmlFor='city'>City</Label>
              <Input
                id='city'
                name='city'
                placeholder='Cairo'
                required
              />
            </div>
          </div>
          <SubmitButton text='Place Order' className='w-full' />
        </FormContainer>
      </Card>
    </div>
  );
}

function CartTotalRow({
  label,
  amount,
  lastRow,
}: {
  label: string;
  amount: number;
  lastRow?: boolean;
}) {
  return (
    <>
      <p className='flex justify-between text-sm'>
        <span>{label}</span>
        <span>{formatCurrency(amount)}</span>
      </p>
      {lastRow ? null : <Separator className='my-2' />}
    </>
  );
}

export default CartTotals;
