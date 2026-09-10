import type { ClassLevel, CourseSlug, Student } from "@/types";

interface Seed {
  name: string;
  city: string;
  state: string;
  school: string;
  className: ClassLevel;
  prefs: CourseSlug[];
  status?: Student["status"];
}

const SEEDS: Seed[] = [
  { name: "Aarav Sharma", city: "Jaipur", state: "Rajasthan", school: "Vidya Bhawan Sr. Sec. School", className: "Class 12", prefs: ["jee", "class-12"] },
  { name: "Ishita Verma", city: "Lucknow", state: "Uttar Pradesh", school: "City Montessori School", className: "Class 12", prefs: ["neet"] },
  { name: "Rahul Nair", city: "Kochi", state: "Kerala", school: "Bhavans Vidya Mandir", className: "Class 11", prefs: ["jee", "class-11"] },
  { name: "Sneha Patil", city: "Pune", state: "Maharashtra", school: "Abhinav Vidyalaya", className: "Class 11", prefs: ["neet", "class-11"] },
  { name: "Mohammed Faiz", city: "Hyderabad", state: "Telangana", school: "Little Flower High School", className: "Class 12", prefs: ["jee"] },
  { name: "Ananya Iyer", city: "Chennai", state: "Tamil Nadu", school: "PSBB Senior Secondary", className: "Class 12", prefs: ["neet"] },
  { name: "Kabir Singh Rathore", city: "Jodhpur", state: "Rajasthan", school: "Mayo College", className: "Dropper", prefs: ["jee"] },
  { name: "Priya Deshmukh", city: "Nagpur", state: "Maharashtra", school: "Centre Point School", className: "Class 11", prefs: ["class-11"] },
  { name: "Aditya Mishra", city: "Varanasi", state: "Uttar Pradesh", school: "Sunbeam School", className: "Class 12", prefs: ["devoter"] },
  { name: "Meera Krishnan", city: "Thiruvananthapuram", state: "Kerala", school: "Christ Nagar School", className: "Class 12", prefs: ["neet"] },
  { name: "Yash Agarwal", city: "Kolkata", state: "West Bengal", school: "South Point High School", className: "Class 11", prefs: ["jee", "class-11"] },
  { name: "Riya Chauhan", city: "Bhopal", state: "Madhya Pradesh", school: "Campion School", className: "Class 12", prefs: ["neet", "class-12"] },
  { name: "Devansh Joshi", city: "Ahmedabad", state: "Gujarat", school: "Udgam School for Children", className: "Class 11", prefs: ["class-11"] },
  { name: "Tanvi Reddy", city: "Bengaluru", state: "Karnataka", school: "National Public School", className: "Class 12", prefs: ["jee"] },
  { name: "Arjun Malhotra", city: "New Delhi", state: "Delhi", school: "DPS R.K. Puram", className: "Dropper", prefs: ["jee"] },
  { name: "Nikita Bansal", city: "Ludhiana", state: "Punjab", school: "Sacred Heart Convent", className: "Class 12", prefs: ["neet"] },
  { name: "Harshit Tripathi", city: "Prayagraj", state: "Uttar Pradesh", school: "Boys' High School", className: "Class 11", prefs: ["devoter"], status: "inactive" },
  { name: "Simran Kaur", city: "Chandigarh", state: "Chandigarh", school: "Carmel Convent School", className: "Class 12", prefs: ["class-12"] },
  { name: "Rohan Ghosh", city: "Guwahati", state: "Assam", school: "Don Bosco School", className: "Class 11", prefs: ["neet", "class-11"] },
  { name: "Aisha Khan", city: "Bhubaneswar", state: "Odisha", school: "Mother's Public School", className: "Class 12", prefs: ["jee", "class-12"] },
  { name: "Vikram Chouhan", city: "Indore", state: "Madhya Pradesh", school: "Emerald Heights School", className: "Dropper", prefs: ["neet"] },
  { name: "Lakshmi Prasad", city: "Vijayawada", state: "Andhra Pradesh", school: "Sri Chaitanya School", className: "Class 12", prefs: ["neet"] },
];

function mobile(index: number) {
  const base = 9820000000 + index * 1237891;
  return `+91 ${String(base).slice(0, 5)} ${String(base).slice(5, 10)}`;
}

function email(name: string, index: number) {
  const [first, ...rest] = name.toLowerCase().split(" ");
  return `${first}.${rest.join("")}${(index + 11) * 7}@example.com`;
}

function dob(index: number, className: ClassLevel) {
  const year = className === "Class 11" ? 2010 : className === "Class 12" ? 2009 : 2008;
  const month = ((index * 5) % 12) + 1;
  const day = ((index * 7) % 27) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export const STUDENTS: Student[] = SEEDS.map((seed, index) => ({
  id: `NIRV-2026-${String(1041 + index * 13).padStart(5, "0")}`,
  fullName: seed.name,
  email: email(seed.name, index),
  mobile: mobile(index),
  dateOfBirth: dob(index, seed.className),
  className: seed.className,
  school: seed.school,
  city: seed.city,
  state: seed.state,
  examPreference: seed.prefs,
  enrolledAt: `2026-0${((index % 6) + 1)}-${String(((index * 3) % 27) + 1).padStart(2, "0")}`,
  status: seed.status ?? "active",
  guardianName: `${seed.name.split(" ").slice(-1)[0]} (Parent)`,
  guardianMobile: mobile(index + 40),
  address: `${(index % 40) + 1}, Sector ${((index % 12) + 1)}, ${seed.city}, ${seed.state}`,
}));

/** The signed-in demo student used across the student portal. */
export const CURRENT_STUDENT: Student = STUDENTS[0];

export function getStudent(id: string) {
  return STUDENTS.find((s) => s.id === id);
}

export const CURRENT_ADMIN = {
  id: "ADM-001",
  name: "Nikhil Raghavan",
  email: "nikhil.raghavan@nirvona.edu.in",
  role: "super-admin" as const,
};
