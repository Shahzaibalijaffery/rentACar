import { resolveUserPlan, type UserPlan } from './user-plan.types';

export type UserPlanLimits = {
  maxListedVehicles: number;
  maxVehiclePhotos: number;
  maxHandoverPhotos: number;
};

/**
 * Change these numbers to update listing and photo caps everywhere.
 * Backend and mobile both read this table.
 */
export const USER_PLAN_LIMITS: Record<UserPlan, UserPlanLimits> = {
  FREE: {
    maxListedVehicles: 2,
    maxVehiclePhotos: 5,
    maxHandoverPhotos: 5,
  },
  LITE: {
    maxListedVehicles: 3,
    maxVehiclePhotos: 10,
    maxHandoverPhotos: 10,
  },
  PRO: {
    maxListedVehicles: 4,
    maxVehiclePhotos: 15,
    maxHandoverPhotos: 15,
  },
  BUSINESS: {
    maxListedVehicles: 10,
    maxVehiclePhotos: 25,
    maxHandoverPhotos: 25,
  },
};

export function getPlanLimits(plan: unknown): UserPlanLimits {
  return USER_PLAN_LIMITS[resolveUserPlan(plan)];
}
