import { db } from '../db';
import { featuresTable } from '../db/schema';
import { type CreateFeatureInput, type Feature } from '../schema';

export const createFeature = async (input: CreateFeatureInput): Promise<Feature> => {
  try {
    // Insert feature record
    const result = await db.insert(featuresTable)
      .values({
        name: input.name,
        description: input.description,
        icon: input.icon,
        is_highlighted: input.is_highlighted,
        sort_order: input.sort_order,
        is_active: input.is_active
      })
      .returning()
      .execute();

    const feature = result[0];
    return feature;
  } catch (error) {
    console.error('Feature creation failed:', error);
    throw error;
  }
};