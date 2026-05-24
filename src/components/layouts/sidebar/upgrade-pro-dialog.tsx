"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CheckIcon, CrownIcon, SparklesIcon, XIcon } from "lucide-react";

const plans = [
  {
    name: "Miễn phí",
    subtitle: "Bắt đầu học lịch sử ngay.",
    price: "Free",
    period: "Trọn đời",
    action: "Mở khóa sau khi đăng nhập",
    tone: "neutral",
    features: [
      ["Lượt chat", "Giới hạn"],
      ["Quảng cáo", "Có quảng cáo"],
      ["Gợi ý hội thoại", "Giới hạn"],
      ["Chỉnh sửa", "Giới hạn"],
      ["Ghi nhớ ngữ cảnh", "Giới hạn"],
      ["Đồng bộ đám mây", "60 ngày"],
    ],
  },
  {
    name: "HistoryTalk Standard",
    subtitle: "Mở khóa toàn bộ trải nghiệm học tập.",
    price: "79.000đ",
    period: "/tháng",
    action: "Đăng ký",
    tone: "featured",
    badge: "Phổ biến nhất",
    note: "Ưu đãi -50% năm đầu",
    features: [
      ["Lượt chat", "Không giới hạn"],
      ["Quảng cáo", "Không quảng cáo"],
      ["Gợi ý hội thoại", "Không giới hạn"],
      ["Chỉnh sửa", "Không giới hạn"],
      ["Ghi nhớ ngữ cảnh", "Không giới hạn"],
      ["Đồng bộ đám mây", "120 ngày"],
      ["Lợi ích trên app", "Đã mở"],
    ],
  },
  {
    name: "HistoryTalk Pro",
    subtitle: "Dành cho người học chuyên sâu.",
    price: "199.000đ",
    period: "/tháng",
    action: "Sắp ra mắt",
    tone: "pro",
    features: [
      ["Lượt chat", "Không giới hạn"],
      ["Quảng cáo", "Không quảng cáo"],
      ["Gợi ý hội thoại", "Không giới hạn"],
      ["Chỉnh sửa", "Không giới hạn"],
      ["Ghi nhớ ngữ cảnh", "Không giới hạn"],
      ["Không gian học nhóm", "Sắp ra mắt"],
      ["Tính năng nâng cao", "Sắp ra mắt"],
    ],
  },
];

export function UpgradeProDialog({ children }: { children: React.ReactNode }) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="upgrade-pro-overlay" />
        <DialogPrimitive.Content className="upgrade-pro-content">
          <DialogPrimitive.Title className="sr-only">Nâng cấp HistoryTalk Pro</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Bảng so sánh các gói nâng cấp của HistoryTalk.
          </DialogPrimitive.Description>

          <div className="upgrade-pro-brand">HistoryTalk</div>

          <DialogPrimitive.Close className="upgrade-pro-close" aria-label="Đóng">
            <XIcon className="size-5" />
          </DialogPrimitive.Close>

          <div className="upgrade-pro-billing" aria-label="Chu kỳ thanh toán">
            <button type="button">Hàng tháng</button>
            <button type="button">Theo quý -10%</button>
            <button type="button" className="is-active">
              Hàng năm -20%
            </button>
          </div>

          <div className="upgrade-pro-grid">
            {plans.map((plan, index) => (
              <section
                key={plan.name}
                className={`upgrade-pro-card upgrade-pro-card-${index} ${
                  plan.tone === "featured" ? "is-featured" : ""
                }`}
              >
                {plan.badge ? <div className="upgrade-pro-badge">{plan.badge}</div> : null}

                <div className="upgrade-pro-card-head">
                  <CrownIcon className="size-5" />
                  <div>
                    <h3>{plan.name}</h3>
                    <p>{plan.subtitle}</p>
                  </div>
                </div>

                <div className="upgrade-pro-price">
                  <span>{plan.price}</span>
                  <small>{plan.period}</small>
                </div>

                {plan.note ? <div className="upgrade-pro-note">{plan.note}</div> : null}

                <button
                  type="button"
                  className={`upgrade-pro-action ${plan.tone === "featured" ? "is-featured" : ""}`}
                >
                  {plan.action}
                </button>

                <div className="upgrade-pro-features">
                  {plan.features.map(([label, value]) => (
                    <div key={label} className="upgrade-pro-feature">
                      <span>{label}</span>
                      <strong>
                        {value}
                        {plan.tone !== "neutral" ? (
                          <SparklesIcon className="size-3.5" />
                        ) : (
                          <CheckIcon className="size-3.5" />
                        )}
                      </strong>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <footer className="upgrade-pro-foot">
            <p>Giao diện minh họa. Thanh toán sẽ được kết nối sau.</p>
            <div>
              <span>FAQ</span>
              <span>Chính sách riêng tư</span>
              <span>Điều khoản dịch vụ</span>
            </div>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
