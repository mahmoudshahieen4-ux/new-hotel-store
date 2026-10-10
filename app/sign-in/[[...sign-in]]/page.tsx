import SignInForm from "@/components/auth/SignInForm";
import { sanitizeCallbackUrl } from "@/utils/navigation";

interface SignInPageProps {
  searchParams?: { guest?: string; callbackUrl?: string };
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  const guest = searchParams?.guest;
  const isGuest = process.env.NODE_ENV !== "production"
    ? guest === "true" ? true : guest === "admin" ? "admin" : false
    : false;
  const callbackUrl = sanitizeCallbackUrl(searchParams?.callbackUrl, "/products");

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <SignInForm isGuest={isGuest} redirectUrl={callbackUrl} />
    </div>
  );
}
