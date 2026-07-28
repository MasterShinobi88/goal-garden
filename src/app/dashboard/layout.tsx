"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MobileNav } from "@/components/MobileNav";
import { AddGoalModal } from "@/components/AddGoalModal";
import { OnboardingTour } from "@/components/OnboardingTour";
import {
  CelebrationBus,
  CelebrationProvider,
} from "@/components/Celebration";
import { GentleReminders } from "@/components/GentleReminders";
import { useAuthUser, useGoals } from "@/hooks/useGoals";
import { isDemoMode } from "@/lib/local-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuthUser();
  const { addGoal } = useGoals(user?.id);
  const [plantOpen, setPlantOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    // Production (demo off): always require a real session
    if (!user && !isDemoMode()) {
      router.replace("/login?next=/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-dvh flex-1 items-center justify-center">
        <LoadingSpinner label="Opening your garden…" />
      </div>
    );
  }

  if (!user && !isDemoMode()) {
    return (
      <div className="flex h-dvh flex-1 items-center justify-center">
        <LoadingSpinner label="Redirecting to sign in…" />
      </div>
    );
  }

  return (
    <CelebrationProvider>
      <CelebrationBus />
      <GentleReminders />
      <OnboardingTour />
      {/* Mobile: one full-height scroll. Desktop: same, sidebar fixed. */}
      <div className="flex h-dvh max-h-dvh overflow-hidden">
        <Sidebar userLabel={user?.name || user?.email} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-[4.5rem] lg:pb-0">
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pt-14 pb-6 sm:px-6 lg:px-8 lg:pt-6 lg:pb-4">
            {children}
          </main>
        </div>
        <MobileNav onPlant={() => setPlantOpen(true)} />
        <AddGoalModal
          open={plantOpen}
          onClose={() => setPlantOpen(false)}
          onSubmit={async (data) => {
            await addGoal(data);
          }}
        />
      </div>
    </CelebrationProvider>
  );
}
