export const dynamic = "force-dynamic";

import { auth, AppSession } from "@/lib/auth";
import { LandingPage } from "@/components/LandingPage";

export default async function Home() {
  const session = (await auth()) as AppSession | null;
  return <LandingPage isAuthenticated={Boolean(session?.user)} />;
}
