import SignInForm from "@/components/auth/SignInForm";
import { sanitizeCallbackUrl } from "@/utils/navigation";

interface SignInPageProps {
  searchParams?: Promise<{ guest?: string; callbackUrl?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolved = await searchParams;
  const guest = resolved?.guest;
  const isGuest = process.env.NODE_ENV !== "production"
    ? guest === "true" ? true : guest === "admin" ? "admin" : false
    : false;
  const callbackUrl = sanitizeCallbackUrl(resolved?.callbackUrl, "/products");

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <SignInForm isGuest={isGuest} redirectUrl={callbackUrl} />
    </div>
  );
}
