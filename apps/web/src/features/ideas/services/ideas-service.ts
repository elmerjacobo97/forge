import "server-only";

import { z } from "zod";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import type { IdeaFilters } from "../schemas/idea-filters";
import type { Idea } from "../types";
import { buildIdeaSearchFilter } from "../utils/query-filters";

const ideaRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  status: z.enum(["seed", "exploring", "building", "parked", "shipped"]),
  category: z.enum(["app", "web", "mobile", "business", "other"]),
  tags: z.array(z.string()),
  links: z.array(z.string()),
  created_at: z.string(),
});

export type IdeaInput = Omit<Idea, "id" | "createdAt">;

const ideaSelect = "id,title,content,status,category,tags,links,created_at";

function toIdea(value: unknown): Idea {
  const row = ideaRowSchema.parse(value);
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    status: row.status,
    category: row.category,
    tags: row.tags,
    links: row.links,
    createdAt: row.created_at,
  };
}

function toIdeaPayload(idea: IdeaInput) {
  return {
    title: idea.title,
    content: idea.content,
    status: idea.status,
    category: idea.category,
    tags: idea.tags,
    links: idea.links,
  };
}

function failure(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

export interface IdeasPage {
  ideas: Idea[];
  tags: string[];
  total: number;
}

const ideaTagsRowSchema = z.object({
  tags: z.array(z.string()),
});

export const ideasService = {
  async fetchIdeasPage(filters: IdeaFilters, visible: number): Promise<IdeasPage> {
    const insforge = await createInsForgeServerClient();
    let query = insforge.database.from("ideas").select(ideaSelect, { count: "exact" });

    if (filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.category !== "all") {
      query = query.eq("category", filters.category);
    }

    if (filters.tag !== "all") {
      query = query.contains("tags", [filters.tag]);
    }

    const search = filters.q.trim();
    if (search) {
      query = query.or(buildIdeaSearchFilter(search));
    }

    const [pageResult, tagsResult] = await Promise.all([
      query
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(0, visible - 1),
      insforge.database.from("ideas").select("tags"),
    ]);
    if (pageResult.error) throw failure(pageResult.error, "Failed to load ideas.");
    if (tagsResult.error) throw failure(tagsResult.error, "Failed to load idea tags.");

    const ideas = ideaRowSchema.array().parse(pageResult.data).map(toIdea);
    const tags = Array.from(
      new Set(
        ideaTagsRowSchema
          .array()
          .parse(tagsResult.data)
          .flatMap((row) => row.tags),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return {
      ideas,
      tags,
      total: pageResult.count ?? 0,
    };
  },

  async createIdea(idea: IdeaInput): Promise<Idea> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("ideas")
      .insert([toIdeaPayload(idea)])
      .select(ideaSelect)
      .single();
    if (error) throw failure(error, "Failed to create idea.");
    return toIdea(data);
  },

  async updateIdea(ideaId: string, idea: IdeaInput): Promise<Idea> {
    const insforge = await createInsForgeServerClient();
    const { data, error } = await insforge.database
      .from("ideas")
      .update(toIdeaPayload(idea))
      .eq("id", ideaId)
      .select(ideaSelect)
      .single();
    if (error) throw failure(error, "Failed to update idea.");
    return toIdea(data);
  },

  async deleteIdea(ideaId: string): Promise<void> {
    const insforge = await createInsForgeServerClient();
    const { error } = await insforge.database.from("ideas").delete().eq("id", ideaId);
    if (error) throw failure(error, "Failed to delete idea.");
  },
};
