import type { Achievement } from "@/lib/achievements";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AchievementsGrid({ achievements }: { achievements: readonly Achievement[] }) {
  const unlocked = achievements.filter((achievement) => achievement.unlocked).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {unlocked} of {achievements.length} unlocked
      </p>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {achievements.map((achievement) => (
          <li key={achievement.id}>
            <Card
              className={cn(
                "flex h-full items-start gap-3 p-4 transition-opacity",
                !achievement.unlocked && "opacity-60"
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full text-lg",
                  achievement.unlocked ? "bg-accent/12" : "bg-secondary grayscale"
                )}
                aria-hidden="true"
              >
                {achievement.emoji}
              </span>

              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug">
                  {achievement.title}
                  <span className="sr-only">
                    {achievement.unlocked ? " — unlocked" : " — locked"}
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{achievement.description}</p>

                {!achievement.unlocked && (
                  <div
                    className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary"
                    role="progressbar"
                    aria-valuenow={Math.round(achievement.progress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${achievement.title} progress`}
                  >
                    <span
                      className="block h-full rounded-full bg-accent transition-[width] duration-500"
                      style={{ width: `${Math.round(achievement.progress * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
