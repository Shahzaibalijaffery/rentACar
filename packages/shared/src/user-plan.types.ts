export const USER_PLANS = ['FREE', 'LITE', 'PRO', 'BUSINESS'] as const;

export type UserPlan = (typeof USER_PLANS)[number];

export const DEFAULT_USER_PLAN: UserPlan = 'FREE';

const PLAN_RANK: Record<UserPlan, number> = {
  FREE: 0,
  LITE: 1,
  PRO: 2,
  BUSINESS: 3,
};

export function isUserPlan(value: unknown): value is UserPlan {
  return typeof value === 'string' && (USER_PLANS as readonly string[]).includes(value);
}

export function resolveUserPlan(value: unknown): UserPlan {
  return isUserPlan(value) ? value : DEFAULT_USER_PLAN;
}

export function getUserPlanLabel(plan: unknown): string {
  switch (resolveUserPlan(plan)) {
    case 'FREE':
      return 'Starter';
    case 'LITE':
      return 'Lite';
    case 'PRO':
      return 'Pro';
    case 'BUSINESS':
      return 'Business';
  }
}

/** Use this when a feature later requires Pro or Business. */
export function hasMinimumPlan(plan: UserPlan, required: UserPlan): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[required];
}
