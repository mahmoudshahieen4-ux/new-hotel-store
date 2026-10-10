"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";

type PaymentResponse = { url: string | null; message?: string };

/**
 * Checkout page - redirects the buyer to the Kashier hosted checkout page,
 * which returns them to `/api/confirm` after the payment is handled.
 */
function CheckoutContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const res = await fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const data: PaymentResponse = await res.json();

        if (cancelled) return;
        if (data?.url) {
          setPaymentUrl(data.url);
          setStatus("ready");
          window.location.assign(data.url);
        } else {
          setMessage(
            data?.message || "Payment could not be initialized.",
          );
          setStatus("error");
        }
      } catch (err) {
        if (cancelled) return;
        setMessage("Payment could not be initialized. Please try again.");
        setStatus("error");
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ReloadIcon className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">
          Redirecting to secure payment&hellip;
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold">Payment unavailable</h2>
        <p className="mt-2 text-muted-foreground">{message}</p>
        <Button asChild className="mt-6">
          <Link href="/cart">Back to cart</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-16 text-center">
      <h2 className="text-xl font-semibold">Complete your payment</h2>
      <p className="mt-2 text-muted-foreground">
        You are being redirected to our secure payment provider. If nothing
        happens, use the button below.
      </p>
      {paymentUrl && (
        <Button asChild className="mt-6">
          <a href={paymentUrl} rel="noopener noreferrer">
            Proceed to payment
          </a>
        </Button>
      )}
      <div className="mt-4">
        <Button asChild variant="link">
          <Link href="/cart">Cancel and return to cart</Link>
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={<div className="py-24 text-center">Loading checkout&hellip;</div>}
    >
      <CheckoutContent />
    </Suspense>
  );
}

