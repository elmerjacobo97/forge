import type { Preset } from "./types";

export const BUILTIN_PRESETS: Preset[] = [
  {
    id: "builtin-subscription-signup",
    name: "Subscription Signup",
    builtIn: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    schema: {
      fields: [
        { name: "Full Name", type: "fullName" },
        { name: "Company", type: "companyName" },
        { name: "Email", type: "email" },
      ],
    },
  },
  {
    id: "builtin-business-card",
    name: "Digital Business Card / Bio",
    builtIn: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    schema: {
      fields: [
        { name: "Full Name", type: "fullName" },
        { name: "Email", type: "email" },
        { name: "Phone", type: "phoneNumber" },
        { name: "Job Title", type: "jobTitle" },
        { name: "Company", type: "companyName" },
        { name: "Bio", type: "bio" },
        { name: "Avatar URL", type: "avatarUrl" },
        { name: "Country", type: "country" },
        { name: "City", type: "city" },
      ],
    },
  },
  {
    id: "builtin-user-profile",
    name: "User Profile",
    builtIn: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    schema: {
      fields: [
        { name: "Username", type: "username" },
        { name: "Email", type: "email" },
        { name: "First Name", type: "firstName" },
        { name: "Last Name", type: "lastName" },
        { name: "Avatar URL", type: "avatarUrl" },
        { name: "Bio", type: "bio" },
      ],
    },
  },
  {
    id: "builtin-address",
    name: "Address",
    builtIn: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    schema: {
      fields: [
        { name: "Street Address", type: "streetAddress" },
        { name: "City", type: "city" },
        { name: "Country", type: "country" },
        { name: "Zip Code", type: "zipCode" },
      ],
    },
  },
];
