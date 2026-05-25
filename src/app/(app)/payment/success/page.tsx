import { Suspense } from "react";
import PaymentResult from "@/components/payment/payment-result";

export const metadata = {
  title: "Kết quả thanh toán",
};

export default function Page() {
  return (
    <Suspense>
      <PaymentResult />
    </Suspense>
  );
}
