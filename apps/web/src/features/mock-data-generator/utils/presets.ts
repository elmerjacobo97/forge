import type { Preset } from "./types";

export const BUILTIN_PRESETS: Preset[] = [
  {
    id: "builtin-subscription-signup",
    name: "Subscription Signup",
    builtIn: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    schema: {
      fields: [
        { id: "sub-fullName", name: "Full Name", type: "fullName" },
        { id: "sub-company", name: "Company", type: "companyName" },
        { id: "sub-email", name: "Email", type: "email" },
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
        { id: "card-fullName", name: "Full Name", type: "fullName" },
        { id: "card-email", name: "Email", type: "email" },
        { id: "card-phone", name: "Phone", type: "phoneNumber" },
        { id: "card-job", name: "Job Title", type: "jobTitle" },
        { id: "card-company", name: "Company", type: "companyName" },
        { id: "card-bio", name: "Bio", type: "bio" },
        { id: "card-avatar", name: "Avatar URL", type: "avatarUrl" },
        { id: "card-country", name: "Country", type: "country" },
        { id: "card-city", name: "City", type: "city" },
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
        { id: "profile-username", name: "Username", type: "username" },
        { id: "profile-email", name: "Email", type: "email" },
        { id: "profile-firstName", name: "First Name", type: "firstName" },
        { id: "profile-lastName", name: "Last Name", type: "lastName" },
        { id: "profile-avatar", name: "Avatar URL", type: "avatarUrl" },
        { id: "profile-bio", name: "Bio", type: "bio" },
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
        { id: "addr-street", name: "Street Address", type: "streetAddress" },
        { id: "addr-city", name: "City", type: "city" },
        { id: "addr-country", name: "Country", type: "country" },
        { id: "addr-zip", name: "Zip Code", type: "zipCode" },
      ],
    },
  },
];
