import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createPageInputSchema, 
  updatePageInputSchema,
  createBlogPostInputSchema,
  createContactSubmissionInputSchema,
  createFeatureInputSchema,
  updateFeatureInputSchema
} from './schema';

// Import handlers
import { createPage } from './handlers/create_page';
import { getPages, getPageBySlug, getPublishedPages } from './handlers/get_pages';
import { updatePage } from './handlers/update_page';
import { createBlogPost } from './handlers/create_blog_post';
import { getBlogPosts, getPublishedBlogPosts, getBlogPostBySlug } from './handlers/get_blog_posts';
import { createContactSubmission } from './handlers/create_contact_submission';
import { getContactSubmissions, getUnreadContactSubmissions, markContactSubmissionAsRead } from './handlers/get_contact_submissions';
import { createFeature } from './handlers/create_feature';
import { getFeatures, getActiveFeatures, getHighlightedFeatures } from './handlers/get_features';
import { updateFeature } from './handlers/update_feature';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Page management endpoints
  createPage: publicProcedure
    .input(createPageInputSchema)
    .mutation(({ input }) => createPage(input)),
  
  getPages: publicProcedure
    .query(() => getPages()),
  
  getPublishedPages: publicProcedure
    .query(() => getPublishedPages()),
  
  getPageBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => getPageBySlug(input.slug)),
  
  updatePage: publicProcedure
    .input(updatePageInputSchema)
    .mutation(({ input }) => updatePage(input)),

  // Blog post management endpoints
  createBlogPost: publicProcedure
    .input(createBlogPostInputSchema)
    .mutation(({ input }) => createBlogPost(input)),
  
  getBlogPosts: publicProcedure
    .query(() => getBlogPosts()),
  
  getPublishedBlogPosts: publicProcedure
    .query(() => getPublishedBlogPosts()),
  
  getBlogPostBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => getBlogPostBySlug(input.slug)),

  // Contact form endpoints
  createContactSubmission: publicProcedure
    .input(createContactSubmissionInputSchema)
    .mutation(({ input }) => createContactSubmission(input)),
  
  getContactSubmissions: publicProcedure
    .query(() => getContactSubmissions()),
  
  getUnreadContactSubmissions: publicProcedure
    .query(() => getUnreadContactSubmissions()),
  
  markContactSubmissionAsRead: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => markContactSubmissionAsRead(input.id)),

  // Feature management endpoints
  createFeature: publicProcedure
    .input(createFeatureInputSchema)
    .mutation(({ input }) => createFeature(input)),
  
  getFeatures: publicProcedure
    .query(() => getFeatures()),
  
  getActiveFeatures: publicProcedure
    .query(() => getActiveFeatures()),
  
  getHighlightedFeatures: publicProcedure
    .query(() => getHighlightedFeatures()),
  
  updateFeature: publicProcedure
    .input(updateFeatureInputSchema)
    .mutation(({ input }) => updateFeature(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();