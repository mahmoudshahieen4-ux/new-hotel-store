"use client";

import { ReloadIcon } from "@radix-ui/react-icons";
import { useFormStatus } from "react-dom";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { LuTrash2, LuPen } from "react-icons/lu";

type btnSize = "default" | "lg" | "sm";

type SubmitButtonProps = {
  className?: string;
  text?: string;
  size?: btnSize;
};

export function SubmitButton({
  className = "",
  text = "submit",
  size = "lg",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn("capitalize", className)}
      size={size}
    >
      {pending ? (
        <>
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          Please wait...
        </>
      ) : (
        text
      )}
    </Button>
  );
}

type actionType = "edit" | "delete";

export const IconButton = ({ actionType }: { actionType: actionType }) => {
  const { pending } = useFormStatus();

  const renderIcon = () => {
    switch (actionType) {
      case "edit":
        return <LuPen />;
      case "delete":
        return <LuTrash2 />;
      default:
        const never: never = actionType;
        throw new Error(`Invalid action type: ${never}`);
    }
  };
  return (
    <Button
      type="submit"
      size="icon"
      variant="link"
      className="p-2 cursor-pointer"
    >
      {pending ? <ReloadIcon className="animate-spin" /> : renderIcon()}
    </Button>
  );
};

/**
 * Button that redirects to sign-in page
 * Used when user needs to authenticate (e.g., to add to favorites)
 */
export const CardSignInButton = () => {
  const pathname = usePathname();
  const callbackUrl = pathname || "/products";

  return (
    <Link
      href={`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
    >
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="p-2 cursor-pointer"
      >
        <FaRegHeart />
      </Button>
    </Link>
  );
};

export const CardSubmitButton = ({ isFavorite }: { isFavorite: boolean }) => {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="icon"
      variant="outline"
      className="p-2 cursor-pointer"
    >
      {pending ? (
        <ReloadIcon className="animate-spin" />
      ) : isFavorite ? (
        <FaHeart />
      ) : (
        <FaRegHeart />
      )}
    </Button>
  );
};

export const ProductSignInButton = () => {
  const pathname = usePathname();
  const redirectUrl = pathname || "/products";

  return (
    <Link href={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}>
      <Button type="button" className="mt-8 capitalize">
        sign in
      </Button>
    </Link>
  );
};
