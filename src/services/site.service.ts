import type {
  Coupon,
  CourseSchedule,
  ProfileChangeField,
  ProfileChangeRequest,
  SchedulePlan,
  SiteSettings,
  StudentPlanSchedule,
} from "@/types";
import { del, get, post, put } from "./http";

/**
 * Organisation settings, coupons, profile-change requests and the test
 * schedule. Every call goes to the real backend (no mock fallback): these
 * are all admin- or student-owned data.
 */
export const siteService = {
  /* ---- Organisation details (public read, admin write) ---- */
  getSettings: (): Promise<SiteSettings> => get<SiteSettings>("/site-settings"),
  getAdminSettings: (): Promise<SiteSettings> => get<SiteSettings>("/admin/site-settings"),
  updateSettings: (payload: Partial<SiteSettings>): Promise<SiteSettings> =>
    put<SiteSettings>("/admin/site-settings", payload),
  changeAdminPassword: (currentPassword: string, newPassword: string): Promise<void> =>
    put("/admin/me/password", { currentPassword, newPassword }),

  /* ---- Coupons (admin) ---- */
  listCoupons: (): Promise<Coupon[]> => get<Coupon[]>("/admin/coupons"),
  createCoupon: (payload: {
    code: string;
    percent: number;
    description?: string;
    maxUses?: number | null;
    expiresAt?: string | null;
  }): Promise<Coupon> => post<Coupon>("/admin/coupons", payload),
  updateCoupon: (
    id: string,
    payload: Partial<Pick<Coupon, "percent" | "description" | "status" | "maxUses" | "expiresAt">>,
  ): Promise<Coupon> => put<Coupon>(`/admin/coupons/${id}`, payload),
  deleteCoupon: (id: string): Promise<void> => del(`/admin/coupons/${id}`),

  /* ---- Profile change requests ---- */
  myChangeRequests: (): Promise<ProfileChangeRequest[]> =>
    get<ProfileChangeRequest[]>("/students/me/change-requests"),
  requestChange: (
    changes: Partial<Record<ProfileChangeField, string>>,
    reason: string,
  ): Promise<ProfileChangeRequest> => post<ProfileChangeRequest>("/students/me/change-requests", { changes, reason }),
  adminChangeRequests: (status?: "pending" | "approved" | "rejected"): Promise<ProfileChangeRequest[]> =>
    get<ProfileChangeRequest[]>(`/admin/change-requests${status ? `?status=${status}` : ""}`),
  approveChangeRequest: (id: string, adminNote?: string): Promise<void> =>
    post(`/admin/change-requests/${id}/approve`, { adminNote }),
  rejectChangeRequest: (id: string, adminNote?: string): Promise<void> =>
    post(`/admin/change-requests/${id}/reject`, { adminNote }),

  /* ---- Test schedule (upcoming tests only) ---- */
  courseSchedule: (slug: string, tier?: SchedulePlan): Promise<CourseSchedule> =>
    get<CourseSchedule>(`/courses/${encodeURIComponent(slug)}/schedule${tier ? `?tier=${encodeURIComponent(tier)}` : ""}`),
  myTestSchedule: (): Promise<StudentPlanSchedule[]> => get<StudentPlanSchedule[]>("/students/me/test-schedule"),
};
