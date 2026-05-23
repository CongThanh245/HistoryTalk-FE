// src/app/staff/admin/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  UsersIcon, 
  CoinsIcon, 
  CreditCardIcon, 
  TrendingUpIcon, 
  ArrowRightIcon, 
  ActivityIcon,
  CircleDollarSignIcon,
  UserCheckIcon,
  ShieldCheckIcon
} from "lucide-react";
import { GaugeIcon } from "@phosphor-icons/react";

import { StaffShell } from "@/components/staff/staff-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAdminStats } from "@/features/admin/hooks";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading || !stats) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--accent-gold)] border-t-transparent" />
          <span className="text-xs font-semibold text-[var(--content-muted)]">Đang tải phân tích hệ thống...</span>
        </div>
      </div>
    );
  }

  // Format currency
  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
  };

  return (
    <StaffShell
      title="Tổng quan hệ thống"
      description="Trung tâm điều khiển và giám sát chỉ số tăng trưởng HistoryTalk."
      icon={GaugeIcon}
      accent="var(--accent-gold)"
    >
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Users */}
          <Card 
            className="relative overflow-hidden border transition-all duration-300 hover:shadow-lg"
            style={{ 
              background: "var(--card-light-bg)", 
              borderColor: "var(--card-light-border)" 
            }}
          >
            <div className="absolute top-0 left-0 h-1 w-full bg-blue-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--content-muted)]">Tổng người dùng</span>
              <div className="rounded-lg p-2 bg-blue-500/10 text-blue-600">
                <UsersIcon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-[var(--content-heading)]">{stats.totalUsers}</div>
              <p className="text-xs text-[var(--content-muted)] mt-1 flex items-center gap-1">
                <TrendingUpIcon className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">+12%</span> so với tháng trước
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Revenue */}
          <Card 
            className="relative overflow-hidden border transition-all duration-300 hover:shadow-lg"
            style={{ 
              background: "var(--card-light-bg)", 
              borderColor: "var(--card-light-border)" 
            }}
          >
            <div className="absolute top-0 left-0 h-1 w-full bg-[var(--accent-gold)]" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--content-muted)]">Doanh thu hệ thống</span>
              <div className="rounded-lg p-2 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
                <CircleDollarSignIcon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-[var(--content-heading)]">{formatVND(stats.totalRevenue)}</div>
              <p className="text-xs text-[var(--content-muted)] mt-1 flex items-center gap-1">
                <TrendingUpIcon className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">+8.5%</span> so với tuần trước
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Subscription Packages */}
          <Card 
            className="relative overflow-hidden border transition-all duration-300 hover:shadow-lg"
            style={{ 
              background: "var(--card-light-bg)", 
              borderColor: "var(--card-light-border)" 
            }}
          >
            <div className="absolute top-0 left-0 h-1 w-full bg-emerald-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--content-muted)]">Premium (Plus / Pro)</span>
              <div className="rounded-lg p-2 bg-emerald-500/10 text-emerald-600">
                <CreditCardIcon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-[var(--content-heading)]">
                {stats.plusCount + stats.proCount}
                <span className="text-xs font-normal text-[var(--content-muted)] ml-2">khách</span>
              </div>
              <p className="text-xs text-[var(--content-muted)] mt-1 flex items-center justify-between">
                <span>Plus: <strong className="text-[var(--content-heading)]">{stats.plusCount}</strong></span>
                <span>Pro: <strong className="text-[var(--content-heading)]">{stats.proCount}</strong></span>
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Tokens */}
          <Card 
            className="relative overflow-hidden border transition-all duration-300 hover:shadow-lg"
            style={{ 
              background: "var(--card-light-bg)", 
              borderColor: "var(--card-light-border)" 
            }}
          >
            <div className="absolute top-0 left-0 h-1 w-full bg-amber-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--content-muted)]">Tổng Token lưu trữ</span>
              <div className="rounded-lg p-2 bg-amber-500/10 text-amber-600">
                <CoinsIcon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-[var(--content-heading)]">{stats.totalTokens.toLocaleString()}</div>
              <p className="text-xs text-[var(--content-muted)] mt-1">
                Token trung bình/User: <strong className="text-[var(--content-heading)]">{Math.round(stats.totalTokens / stats.totalUsers)}</strong>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Analytics visual section using custom premium styled divs */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* User Registration Trend Chart */}
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">Người dùng đăng ký mới</CardTitle>
              <CardDescription className="text-xs">Tăng trưởng đăng ký hàng ngày (7 ngày gần nhất)</CardDescription>
            </CardHeader>
            <CardContent className="h-[240px] flex items-end justify-between gap-3 pt-4 px-6 border-t border-dashed border-[var(--card-light-border)]">
              {stats.registrationTrend.map((item) => {
                const maxVal = Math.max(...stats.registrationTrend.map(x => x.count));
                const pct = (item.count / maxVal) * 100;
                return (
                  <div key={item.date} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="relative w-full flex items-end justify-center h-[160px]">
                      {/* Tooltip value */}
                      <span className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[var(--abyssal-blue)] text-white text-[10px] py-0.5 px-1.5 rounded shadow font-bold z-10">
                        {item.count} user
                      </span>
                      {/* Bar */}
                      <div 
                        className="w-full sm:w-8 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                        style={{ 
                          height: `${pct}%`,
                          background: "linear-gradient(0deg, var(--accent-blue) 30%, var(--accent-gold-soft) 100%)",
                          boxShadow: "0 0 10px rgba(143,179,200,0.15)"
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--content-muted)]">{item.date}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Revenue Distribution Chart */}
          <Card style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">Doanh số & Doanh thu</CardTitle>
              <CardDescription className="text-xs">Doanh thu lũy kế các ngày gần nhất (VND)</CardDescription>
            </CardHeader>
            <CardContent className="h-[240px] flex items-end justify-between gap-3 pt-4 px-6 border-t border-dashed border-[var(--card-light-border)]">
              {stats.revenueTrend.map((item) => {
                const maxVal = Math.max(...stats.revenueTrend.map(x => x.revenue));
                const pct = (item.revenue / maxVal) * 100;
                return (
                  <div key={item.date} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="relative w-full flex items-end justify-center h-[160px]">
                      {/* Tooltip value */}
                      <span className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[var(--abyssal-blue)] text-white text-[10px] py-0.5 px-1.5 rounded shadow font-bold z-10">
                        {formatVND(item.revenue)}
                      </span>
                      {/* Bar */}
                      <div 
                        className="w-full sm:w-8 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                        style={{ 
                          height: `${pct}%`,
                          background: "linear-gradient(0deg, var(--accent-gold) 30%, var(--truffle) 100%)",
                          boxShadow: "0 0 10px rgba(201,162,77,0.15)"
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--content-muted)]">{item.date}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Recent logs and quick shortcuts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Quick shortcuts */}
          <Card className="lg:col-span-1" style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">Lối tắt Quản lý</CardTitle>
              <CardDescription className="text-xs">Chuyển hướng nhanh tới các phân hệ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 border-t border-[var(--card-light-border)] pt-4">
              <Button 
                variant="outline" 
                className="w-full justify-between h-10 rounded-xl px-4 hover:bg-[var(--card-light-hover)] border-[var(--card-light-border)]"
                onClick={() => router.push("/staff/admin/accounts/customer")}
              >
                <span className="flex items-center gap-2 font-medium text-[var(--content-heading)]">
                  <UserCheckIcon className="h-4 w-4 text-blue-500" />
                  Khách hàng (Customer)
                </span>
                <ArrowRightIcon className="h-4 w-4 opacity-50" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-between h-10 rounded-xl px-4 hover:bg-[var(--card-light-hover)] border-[var(--card-light-border)]"
                onClick={() => router.push("/staff/admin/accounts/content-admin")}
              >
                <span className="flex items-center gap-2 font-medium text-[var(--content-heading)]">
                  <ActivityIcon className="h-4 w-4 text-purple-500" />
                  Content Admin
                </span>
                <ArrowRightIcon className="h-4 w-4 opacity-50" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-between h-10 rounded-xl px-4 hover:bg-[var(--card-light-hover)] border-[var(--card-light-border)]"
                onClick={() => router.push("/staff/admin/accounts/system-admin")}
              >
                <span className="flex items-center gap-2 font-medium text-[var(--content-heading)]">
                  <ShieldCheckIcon className="h-4 w-4 text-emerald-500" />
                  System Admin
                </span>
                <ArrowRightIcon className="h-4 w-4 opacity-50" />
              </Button>
            </CardContent>
          </Card>

          {/* System audit log */}
          <Card className="lg:col-span-2" style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-[var(--content-heading)]">Nhật ký hoạt động hệ thống</CardTitle>
              <CardDescription className="text-xs">Các thao tác hành động quản trị viên mới diễn ra</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-[var(--card-light-border)] pt-4">
              <div className="space-y-3">
                {stats.recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs leading-relaxed">
                    <div className="h-2 w-2 rounded-full bg-[var(--accent-gold)] shrink-0 mt-1.5 shadow-[0_0_4px_var(--accent-gold-glow)]" />
                    <div className="flex-1">
                      <span className="font-semibold text-[var(--content-heading)] mr-1.5">{act.user}</span>
                      <span className="text-[var(--content-text)]">{act.action}</span>
                    </div>
                    <span className="text-[10px] text-[var(--content-muted)] shrink-0 font-medium">{act.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StaffShell>
  );
}
