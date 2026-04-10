import { Suspense } from "react";

import LoginPageClient from "@/components/pages/LoginPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageClient />
    </Suspense>
  );
}
