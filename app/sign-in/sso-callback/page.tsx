/**
 * SSO Callback Page
 *
 * In NextAuth v5, OAuth callbacks are handled automatically by the
 * /api/auth/callback/[provider] route. This page is not needed.
 *
 * If the user is redirected here, they will be automatically
 * redirected to the callback URL in the session config.
 */

import { redirect } from "next/navigation";

export default function SSOCallbackPage() {
  // Redirect to products page since OAuth is handled by NextAuth
  redirect("/products");
}
