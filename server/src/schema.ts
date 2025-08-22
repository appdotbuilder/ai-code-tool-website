import { z } from 'zod';

// Page schema for website pages (Home, Features, Pricing, About Us, Contact)
export const pageSchema = z.object({
  id: z.number(),
  slug: z.string(), // URL-friendly identifier (home, features, pricing, about, contact)
  title: z.string(),
  content: z.string(), // HTML/Markdown content
  meta_description: z.string().nullable(),
  meta_keywords: z.string().nullable(),
  is_published: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Page = z.infer<typeof pageSchema>;

// Input schema for creating pages
export const createPageInputSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  content: z.string(),
  meta_description: z.string().nullable(),
  meta_keywords: z.string().nullable(),
  is_published: z.boolean().default(false)
});

export type CreatePageInput = z.infer<typeof createPageInputSchema>;

// Input schema for updating pages
export const updatePageInputSchema = z.object({
  id: z.number(),
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  meta_description: z.string().nullable().optional(),
  meta_keywords: z.string().nullable().optional(),
  is_published: z.boolean().optional()
});

export type UpdatePageInput = z.infer<typeof updatePageInputSchema>;

// Blog post schema
export const blogPostSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string().nullable(),
  content: z.string(),
  author: z.string(),
  featured_image_url: z.string().nullable(),
  meta_description: z.string().nullable(),
  meta_keywords: z.string().nullable(),
  is_published: z.boolean(),
  published_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BlogPost = z.infer<typeof blogPostSchema>;

// Input schema for creating blog posts
export const createBlogPostInputSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().nullable(),
  content: z.string(),
  author: z.string().min(1),
  featured_image_url: z.string().url().nullable(),
  meta_description: z.string().nullable(),
  meta_keywords: z.string().nullable(),
  is_published: z.boolean().default(false),
  published_at: z.coerce.date().nullable()
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostInputSchema>;

// Input schema for updating blog posts
export const updateBlogPostInputSchema = z.object({
  id: z.number(),
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  excerpt: z.string().nullable().optional(),
  content: z.string().optional(),
  author: z.string().min(1).optional(),
  featured_image_url: z.string().url().nullable().optional(),
  meta_description: z.string().nullable().optional(),
  meta_keywords: z.string().nullable().optional(),
  is_published: z.boolean().optional(),
  published_at: z.coerce.date().nullable().optional()
});

export type UpdateBlogPostInput = z.infer<typeof updateBlogPostInputSchema>;

// Contact form submission schema
export const contactSubmissionSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  company: z.string().nullable(),
  message: z.string(),
  is_read: z.boolean(),
  created_at: z.coerce.date()
});

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;

// Input schema for contact form submissions
export const createContactSubmissionInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().nullable(),
  message: z.string().min(1)
});

export type CreateContactSubmissionInput = z.infer<typeof createContactSubmissionInputSchema>;

// Feature schema for AI tool features
export const featureSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  icon: z.string().nullable(), // Icon name or URL
  is_highlighted: z.boolean(), // Whether to show prominently on features page
  sort_order: z.number().int(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Feature = z.infer<typeof featureSchema>;

// Input schema for creating features
export const createFeatureInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().nullable(),
  is_highlighted: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true)
});

export type CreateFeatureInput = z.infer<typeof createFeatureInputSchema>;

// Input schema for updating features
export const updateFeatureInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  icon: z.string().nullable().optional(),
  is_highlighted: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional()
});

export type UpdateFeatureInput = z.infer<typeof updateFeatureInputSchema>;