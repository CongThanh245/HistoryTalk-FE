export const runtime = "nodejs";

import VerifyEmailView from "@/components/auth/VerifyEmailView";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    token?: string;
    email?: string;
  }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token = "", email = "" } = await searchParams;

  return <VerifyEmailView token={token} initialEmail={email} />;
}
