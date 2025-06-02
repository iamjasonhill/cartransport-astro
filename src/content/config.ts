import { defineCollection, z } from 'astro:content';

const routes = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    hero: z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      backgroundImage: z.string().optional(),
      ctaText: z.string().optional(),
      ctaLink: z.string().optional(),
    }),
    sections: z.array(z.any()).optional(),
    meta: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().optional(),
    }).optional(),
  }),
});

export const collections = {
  routes,
};
