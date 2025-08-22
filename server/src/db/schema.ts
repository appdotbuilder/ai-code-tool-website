import { serial, text, pgTable, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

// Pages table for website content (Home, Features, Pricing, About Us, Contact)
export const pagesTable = pgTable('pages', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(), // URL-friendly identifier
  title: text('title').notNull(),
  content: text('content').notNull(), // HTML/Markdown content
  meta_description: text('meta_description'), // Nullable for SEO
  meta_keywords: text('meta_keywords'), // Nullable for SEO
  is_published: boolean('is_published').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Blog posts table
export const blogPostsTable = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'), // Nullable short description
  content: text('content').notNull(),
  author: text('author').notNull(),
  featured_image_url: text('featured_image_url'), // Nullable image URL
  meta_description: text('meta_description'), // Nullable for SEO
  meta_keywords: text('meta_keywords'), // Nullable for SEO
  is_published: boolean('is_published').notNull().default(false),
  published_at: timestamp('published_at'), // Nullable, set when published
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Contact form submissions table
export const contactSubmissionsTable = pgTable('contact_submissions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company'), // Nullable company name
  message: text('message').notNull(),
  is_read: boolean('is_read').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Features table for AI tool capabilities
export const featuresTable = pgTable('features', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon'), // Nullable icon name or URL
  is_highlighted: boolean('is_highlighted').notNull().default(false), // Show prominently
  sort_order: integer('sort_order').notNull().default(0), // For ordering features
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schemas
export type Page = typeof pagesTable.$inferSelect;
export type NewPage = typeof pagesTable.$inferInsert;

export type BlogPost = typeof blogPostsTable.$inferSelect;
export type NewBlogPost = typeof blogPostsTable.$inferInsert;

export type ContactSubmission = typeof contactSubmissionsTable.$inferSelect;
export type NewContactSubmission = typeof contactSubmissionsTable.$inferInsert;

export type Feature = typeof featuresTable.$inferSelect;
export type NewFeature = typeof featuresTable.$inferInsert;

// Export all tables for proper query building and relation support
export const tables = {
  pages: pagesTable,
  blogPosts: blogPostsTable,
  contactSubmissions: contactSubmissionsTable,
  features: featuresTable
};