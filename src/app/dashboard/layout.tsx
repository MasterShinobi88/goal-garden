"use client";

import { useState } from "react";
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthUser();
  const { addGoal } = useGoals(user?.id);
  const [plantOpen, setPlantOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-dvh flex-1 items-center justify-center">
        <LoadingSpinner label="Opening your garden…" />
      </div>
    );
  }

  return (
    <CelebrationProvider>
      <CelebrationBus />
      <GentleReminders />
      <OnboardingTour />
      {/* Fixed viewport: only the page body (below fixed chrome) should scroll */}
      <div className="flex h-dvh max-h-dvh overflow-hidden">
        <Sidebar userLabel={user?.name || user?.email} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-[4.5rem] lg:pb-0">
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-14 pb-3 sm:px-6 lg:px-8 lg:pt-6 lg:pb-4">
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
