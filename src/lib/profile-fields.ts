import type { ProfileChangeField } from "@/types";

/** Profile details a student can ask an admin to change, in display order. */
export const FIELD_LABELS: Record<ProfileChangeField, string> = {
  fullName: "Full name",
  email: "Email address",
  mobile: "Mobile number",
  dateOfBirth: "Date of birth",
  gender: "Gender",
  className: "Class",
  school: "School / college",
  city: "City",
  state: "State",
  address: "Address",
  guardianName: "Guardian name",
  guardianMobile: "Guardian mobile",
};

export const FIELD_ORDER = Object.keys(FIELD_LABELS) as ProfileChangeField[];
