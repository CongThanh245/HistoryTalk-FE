import PaymentHistory from "@/components/payment/payment-history";

export const metadata = {
  title: "Lịch sử đơn hàng",
  description: "Xem lịch sử thanh toán và trạng thái các gói đã mua",
};

export default function Page() {
  return (
    <div className="px-3 py-6 md:px-6 md:py-8">
      <PaymentHistory variant="customer" />
    </div>
  );
}
