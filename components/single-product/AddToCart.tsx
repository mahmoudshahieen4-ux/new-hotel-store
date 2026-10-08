"use client";
import { useState } from "react";
import SelectProductAmount from "./SelectProductAmount";
import { Mode } from "./SelectProductAmount";
import FormContainer from "../form/FormContainer";
import { SubmitButton } from "../form/Buttons";
import { addToCartAction } from "@/utils/actions";
import { useSession } from "next-auth/react";
import { ProductSignInButton } from "../form/Buttons";

function AddToCart({ productId }: { productId: string }) {
  const [amount, setAmount] = useState(1);
  const { data: session } = useSession();
  const userId = session?.user?.id;
  return (
    <div className="mt-4">
      <SelectProductAmount
        mode={Mode.SingleProduct}
        amount={amount}
        setAmount={setAmount}
      />
      {userId ? (
        <FormContainer action={addToCartAction}>
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="amount" value={amount} />
          <SubmitButton text="add to cart" className="mt-8" />
        </FormContainer>
      ) : (
        <ProductSignInButton />
      )}
    </div>
  );
}
export default AddToCart;
