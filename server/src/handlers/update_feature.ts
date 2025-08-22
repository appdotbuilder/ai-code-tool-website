import { db } from '../db';
import { featuresTable } from '../db/schema';
import { type UpdateFeatureInput, type Feature } from '../schema';
import { eq } from 'drizzle-orm';

export const updateFeature = async (input: UpdateFeatureInput): Promise<Feature> => {
  try {
    // First check if the feature exists
    const existingFeature = await db.select()
      .from(featuresTable)
      .where(eq(featuresTable.id, input.id))
      .execute();

    if (existingFeature.length === 0) {
      throw new Error(`Feature with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData['name'] = input.name;
    }
    if (input.description !== undefined) {
      updateData['description'] = input.description;
    }
    if (input.icon !== undefined) {
      updateData['icon'] = input.icon;
    }
    if (input.is_highlighted !== undefined) {
      updateData['is_highlighted'] = input.is_highlighted;
    }
    if (input.sort_order !== undefined) {
      updateData['sort_order'] = input.sort_order;
    }
    if (input.is_active !== undefined) {
      updateData['is_active'] = input.is_active;
    }

    // Update the feature record
    const result = await db.update(featuresTable)
      .set(updateData)
      .where(eq(featuresTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Feature update failed:', error);
    throw error;
  }
};