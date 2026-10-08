import { ChartPie, TrendingUp } from "lucide-react";
import type { CategoryBreakdown } from "@/lib/score";
import { pluralize } from "@/lib/utils";
import { CategoryDonut } from "@/components/charts/category-donut";
import { Sparkline, type SparkPoint } from "@/components/charts/sparkline";
import { EmptyState } from "@/components/empty-state";
import { ProfileSection } from "@/components/profile/profile-section";

type CategoryCardProps = {
  breakdown: CategoryBreakdown[];
  delay?: number;
  className?: string;
};

export function CategoryCard({ breakdown, delay, className }: CategoryCardProps) {
  return (
    <ProfileSection
      id="profile-categories"
      title="Spending by category"
      description="Where the money went."
      icon={ChartPie}
      delay={delay}
      className={className}
      bodyClassName="flex items-center"
    >
      <CategoryDonut breakdown={breakdown} className="w-full" />
    </ProfileSection>
  );
}

type HistoryCardProps = {
  /** Score history with `at` as epoch milliseconds. */
  points: SparkPoint[];
  name: string;
  isOwner: boolean;
  delay?: number;
  className?: string;
};

export function HistoryCard({ points, name, isOwner, delay, className }: HistoryCardProps) {
  const changes = Math.max(0, points.length - 1);

  return (
    <ProfileSection
      id="profile-history"
      title="Score over time"
      description={changes > 0 ? `${pluralize(changes, "change")} since joining.` : "Nothing yet."}
      icon={TrendingUp}
      delay={delay}
      className={className}
      bodyClassName={points.length < 2 ? "flex items-center" : "flex flex-col justify-end"}
    >
      {points.length < 2 ? (
        <EmptyState
          bare
          emoji="📈"
          title="Flat line"
          description={
            isOwner
              ? "Your first product draws the first step."
              : `${name}'s chart is waiting for a first purchase.`
          }
          className="w-full py-6"
        />
      ) : (
        <Sparkline
          points={points}
          height={160}
          showScale
          label={`${isOwner ? "Your" : `${name}'s`} Apple Score over time`}
        />
      )}
    </ProfileSection>
  );
}
