import BottomNav from "@/components/common/BottomNav";
import AuthGuard from "@/components/common/AuthGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
        {children}
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
