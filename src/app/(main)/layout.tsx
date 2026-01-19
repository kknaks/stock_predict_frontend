import BottomNav from "@/components/common/BottomNav";
import AuthGuard from "@/components/common/AuthGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen pb-16">
        {children}
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
