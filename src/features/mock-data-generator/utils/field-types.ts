import { faker } from "@faker-js/faker";
import type { FieldTypeId, SchemaField } from "./types";

export interface FieldTypeDef {
  id: FieldTypeId;
  label: string;
  hasOptions: boolean;
  generate(
    options: Record<string, unknown> | undefined,
    index?: number,
  ): string;
}

interface FieldTypeGroup {
  label: string;
  ids: FieldTypeId[];
}

function parseOptions<T extends Record<string, unknown>>(
  options: Record<string, unknown> | undefined,
  defaults: T,
): T {
  if (!options) return defaults;
  const merged = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (key in options) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (merged as any)[key] = options[key];
    }
  }
  return merged;
}

export const FIELD_TYPES: Record<FieldTypeId, FieldTypeDef> = {
  fullName: {
    id: "fullName",
    label: "Full Name",
    hasOptions: false,
    generate: () => faker.person.fullName(),
  },
  firstName: {
    id: "firstName",
    label: "First Name",
    hasOptions: false,
    generate: () => faker.person.firstName(),
  },
  lastName: {
    id: "lastName",
    label: "Last Name",
    hasOptions: false,
    generate: () => faker.person.lastName(),
  },
  email: {
    id: "email",
    label: "Email",
    hasOptions: false,
    generate: () => faker.internet.email(),
  },
  username: {
    id: "username",
    label: "Username",
    hasOptions: false,
    generate: () => faker.internet.username(),
  },
  password: {
    id: "password",
    label: "Password",
    hasOptions: false,
    generate: () => faker.internet.password(),
  },
  companyName: {
    id: "companyName",
    label: "Company Name",
    hasOptions: false,
    generate: () => faker.company.name(),
  },
  jobTitle: {
    id: "jobTitle",
    label: "Job Title",
    hasOptions: false,
    generate: () => faker.person.jobTitle(),
  },
  phoneNumber: {
    id: "phoneNumber",
    label: "Phone Number",
    hasOptions: false,
    generate: () => faker.phone.number(),
  },
  streetAddress: {
    id: "streetAddress",
    label: "Street Address",
    hasOptions: false,
    generate: () => faker.location.streetAddress(),
  },
  city: {
    id: "city",
    label: "City",
    hasOptions: false,
    generate: () => faker.location.city(),
  },
  country: {
    id: "country",
    label: "Country",
    hasOptions: false,
    generate: () => faker.location.country(),
  },
  zipCode: {
    id: "zipCode",
    label: "Zip Code",
    hasOptions: false,
    generate: () => faker.location.zipCode(),
  },
  avatarUrl: {
    id: "avatarUrl",
    label: "Avatar URL",
    hasOptions: false,
    generate: () => faker.image.avatar(),
  },
  imageUrl: {
    id: "imageUrl",
    label: "Image URL",
    hasOptions: false,
    generate: () => faker.image.url(),
  },
  bio: {
    id: "bio",
    label: "Bio",
    hasOptions: false,
    generate: () => faker.lorem.paragraph(),
  },
  loremWord: {
    id: "loremWord",
    label: "Lorem Word",
    hasOptions: false,
    generate: () => faker.lorem.word(),
  },
  loremSentence: {
    id: "loremSentence",
    label: "Lorem Sentence",
    hasOptions: false,
    generate: () => faker.lorem.sentence(),
  },
  loremParagraph: {
    id: "loremParagraph",
    label: "Lorem Paragraph",
    hasOptions: false,
    generate: () => faker.lorem.paragraph(),
  },
  integer: {
    id: "integer",
    label: "Integer",
    hasOptions: true,
    generate: (options) => {
      const opts = parseOptions(options, { min: 0, max: 100 });
      return String(
        faker.number.int({ min: Number(opts.min), max: Number(opts.max) }),
      );
    },
  },
  float: {
    id: "float",
    label: "Float",
    hasOptions: true,
    generate: (options) => {
      const opts = parseOptions(options, { min: 0, max: 100 });
      return String(
        faker.number.float({
          min: Number(opts.min),
          max: Number(opts.max),
          fractionDigits: 2,
        }),
      );
    },
  },
  sequentialId: {
    id: "sequentialId",
    label: "Sequential ID",
    hasOptions: true,
    generate: (options, index) => {
      const opts = parseOptions(options, { start: 1 });
      return String(Number(opts.start) + (index ?? 0));
    },
  },
  pastDate: {
    id: "pastDate",
    label: "Past Date",
    hasOptions: true,
    generate: (options) => {
      const opts = parseOptions(options, { years: 5 });
      return faker.date.past({ years: Number(opts.years) }).toISOString();
    },
  },
  futureDate: {
    id: "futureDate",
    label: "Future Date",
    hasOptions: true,
    generate: (options) => {
      const opts = parseOptions(options, { years: 5 });
      return faker.date.future({ years: Number(opts.years) }).toISOString();
    },
  },
  dateRange: {
    id: "dateRange",
    label: "Date Range",
    hasOptions: true,
    generate: (options) => {
      const opts = parseOptions(options, { startYear: 2020, endYear: 2025 });
      const from = new Date(Number(opts.startYear), 0, 1);
      const to = new Date(Number(opts.endYear), 11, 31);
      return faker.date.between({ from, to }).toISOString();
    },
  },
  customList: {
    id: "customList",
    label: "Custom List",
    hasOptions: true,
    generate: (options) => {
      const opts = parseOptions(options, { values: "" });
      const items = String(opts.values)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.length === 0) return "";
      return faker.helpers.arrayElement(items);
    },
  },
  boolean: {
    id: "boolean",
    label: "Boolean",
    hasOptions: false,
    generate: () => String(Math.random() >= 0.5),
  },
  uuid: {
    id: "uuid",
    label: "UUID",
    hasOptions: false,
    generate: () => crypto.randomUUID(),
  },
  url: {
    id: "url",
    label: "URL",
    hasOptions: false,
    generate: () => faker.internet.url(),
  },
  color: {
    id: "color",
    label: "Color",
    hasOptions: false,
    generate: () => faker.color.rgb(),
  },
};

export const FIELD_TYPE_GROUPS: FieldTypeGroup[] = [
  {
    label: "Person",
    ids: [
      "fullName",
      "firstName",
      "lastName",
      "email",
      "username",
      "password",
      "avatarUrl",
      "bio",
    ],
  },
  { label: "Company", ids: ["companyName", "jobTitle"] },
  {
    label: "Contact",
    ids: ["phoneNumber", "streetAddress", "city", "country", "zipCode"],
  },
  { label: "Internet", ids: ["imageUrl", "url"] },
  { label: "Lorem", ids: ["loremWord", "loremSentence", "loremParagraph"] },
  { label: "Numbers", ids: ["integer", "float", "sequentialId"] },
  { label: "Dates", ids: ["pastDate", "futureDate", "dateRange"] },
  { label: "Custom", ids: ["customList"] },
  { label: "Other", ids: ["boolean", "uuid", "color"] },
];

export function getFieldTypeLabel(id: FieldTypeId): string {
  return FIELD_TYPES[id]?.label ?? id;
}

export function fieldHasOptions(id: FieldTypeId): boolean {
  return FIELD_TYPES[id]?.hasOptions ?? false;
}

export function getFieldOptionKeys(id: FieldTypeId): string[] {
  switch (id) {
    case "integer":
    case "float":
      return ["min", "max"];
    case "sequentialId":
      return ["start"];
    case "pastDate":
    case "futureDate":
      return ["years"];
    case "dateRange":
      return ["startYear", "endYear"];
    case "customList":
      return ["values"];
    default:
      return [];
  }
}

export function getFieldDefaultOptions(
  id: FieldTypeId,
): Record<string, unknown> {
  switch (id) {
    case "integer":
    case "float":
      return { min: 0, max: 100 };
    case "sequentialId":
      return { start: 1 };
    case "pastDate":
    case "futureDate":
      return { years: 5 };
    case "dateRange":
      return { startYear: 2020, endYear: 2025 };
    case "customList":
      return { values: "" };
    default:
      return {};
  }
}

export function generateFieldValue(field: SchemaField, index?: number): string {
  return FIELD_TYPES[field.type].generate(field.options, index);
}
