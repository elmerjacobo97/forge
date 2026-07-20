export type FieldTypeId =
  | "fullName"
  | "firstName"
  | "lastName"
  | "email"
  | "username"
  | "password"
  | "companyName"
  | "jobTitle"
  | "phoneNumber"
  | "streetAddress"
  | "city"
  | "country"
  | "zipCode"
  | "avatarUrl"
  | "imageUrl"
  | "bio"
  | "loremWord"
  | "loremSentence"
  | "loremParagraph"
  | "integer"
  | "float"
  | "sequentialId"
  | "pastDate"
  | "futureDate"
  | "dateRange"
  | "customList"
  | "boolean"
  | "uuid"
  | "url"
  | "color";

export type OutputFormat = "json" | "ndjson" | "csv";

export interface SchemaField {
  id: string;
  name: string;
  type: FieldTypeId;
  options?: Record<string, unknown>;
}

export interface Schema {
  fields: SchemaField[];
}

export interface Preset {
  id: string;
  name: string;
  schema: Schema;
  builtIn: boolean;
  createdAt: string;
}
