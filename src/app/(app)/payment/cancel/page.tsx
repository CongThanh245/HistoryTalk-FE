import { Suspense } from "react";
import PaymentResult from "@/components/payment/payment-result";

export const metadata = {
  title: "Thanh toán đã hủy",
};

export default function Page() {
  return (
    <Suspense>
      <PaymentResult />
    </Suspense>
  );
}
