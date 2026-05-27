import PaymentHistory from "@/components/payment/payment-history";

export const metadata = {
  title: "Lịch sử giao dịch",
  description: "Xem lịch sử thanh toán của tất cả khách hàng",
};

export default function Page() {
  return <PaymentHistory variant="admin" />;
}
