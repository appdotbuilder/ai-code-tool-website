import { db } from '../db';
import { featuresTable } from '../db/schema';
import { type Feature } from '../schema';
import { eq, asc, and } from 'drizzle-orm';

export const getFeatures = async (): Promise<Feature[]> => {
  try {
    const results = await db.select()
      .from(featuresTable)
      .orderBy(asc(featuresTable.sort_order), asc(featuresTable.name))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch features:', error);
    throw error;
  }
};

export const getActiveFeatures = async (): Promise<Feature[]> => {
  try {
    const results = await db.select()
      .from(featuresTable)
      .where(eq(featuresTable.is_active, true))
      .orderBy(asc(featuresTable.sort_order), asc(featuresTable.name))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch active features:', error);
    throw error;
  }
};

export const getHighlightedFeatures = async (): Promise<Feature[]> => {
  try {
    const results = await db.select()
      .from(featuresTable)
      .where(and(
        eq(featuresTable.is_highlighted, true),
        eq(featuresTable.is_active, true)
      ))
      .orderBy(asc(featuresTable.sort_order), asc(featuresTable.name))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch highlighted features:', error);
    throw error;
  }
};