"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, Wallet, History, Settings } from "lucide-react";

const tabs = [
  { href: "/predict", label: "예측", icon: TrendingUp },
  { href: "/balance", label: "잔고", icon: Wallet },
  { href: "/history", label: "내역", icon: History },
  { href: "/settings", label: "설정", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-14">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
