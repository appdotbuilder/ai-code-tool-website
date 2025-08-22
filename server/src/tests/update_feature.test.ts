import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { featuresTable } from '../db/schema';
import { type CreateFeatureInput, type UpdateFeatureInput } from '../schema';
import { updateFeature } from '../handlers/update_feature';
import { eq } from 'drizzle-orm';

// Helper function to create a test feature
const createTestFeature = async (overrides?: Partial<CreateFeatureInput>) => {
  const testData: CreateFeatureInput = {
    name: 'Test Feature',
    description: 'A feature for testing',
    icon: 'test-icon',
    is_highlighted: false,
    sort_order: 1,
    is_active: true,
    ...overrides
  };

  const result = await db.insert(featuresTable)
    .values(testData)
    .returning()
    .execute();

  return result[0];
};

describe('updateFeature', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a feature', async () => {
    const feature = await createTestFeature();

    const updateInput: UpdateFeatureInput = {
      id: feature.id,
      name: 'Updated Feature Name',
      description: 'Updated description',
      icon: 'updated-icon',
      is_highlighted: true,
      sort_order: 10,
      is_active: false
    };

    const result = await updateFeature(updateInput);

    expect(result.id).toEqual(feature.id);
    expect(result.name).toEqual('Updated Feature Name');
    expect(result.description).toEqual('Updated description');
    expect(result.icon).toEqual('updated-icon');
    expect(result.is_highlighted).toEqual(true);
    expect(result.sort_order).toEqual(10);
    expect(result.is_active).toEqual(false);
    expect(result.created_at).toEqual(feature.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > feature.updated_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    const feature = await createTestFeature({
      name: 'Original Name',
      description: 'Original description',
      is_highlighted: false
    });

    const updateInput: UpdateFeatureInput = {
      id: feature.id,
      name: 'Updated Name Only',
      is_highlighted: true
    };

    const result = await updateFeature(updateInput);

    expect(result.name).toEqual('Updated Name Only');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.is_highlighted).toEqual(true);
    expect(result.icon).toEqual(feature.icon); // Unchanged
    expect(result.sort_order).toEqual(feature.sort_order); // Unchanged
    expect(result.is_active).toEqual(feature.is_active); // Unchanged
  });

  it('should handle null values correctly', async () => {
    const feature = await createTestFeature({
      icon: 'original-icon'
    });

    const updateInput: UpdateFeatureInput = {
      id: feature.id,
      icon: null
    };

    const result = await updateFeature(updateInput);

    expect(result.icon).toBeNull();
    expect(result.name).toEqual(feature.name); // Unchanged
  });

  it('should update sort_order to zero', async () => {
    const feature = await createTestFeature({
      sort_order: 5
    });

    const updateInput: UpdateFeatureInput = {
      id: feature.id,
      sort_order: 0
    };

    const result = await updateFeature(updateInput);

    expect(result.sort_order).toEqual(0);
  });

  it('should persist changes to database', async () => {
    const feature = await createTestFeature();

    const updateInput: UpdateFeatureInput = {
      id: feature.id,
      name: 'Database Test Feature',
      is_active: false
    };

    await updateFeature(updateInput);

    // Verify changes were saved to database
    const savedFeature = await db.select()
      .from(featuresTable)
      .where(eq(featuresTable.id, feature.id))
      .execute();

    expect(savedFeature).toHaveLength(1);
    expect(savedFeature[0].name).toEqual('Database Test Feature');
    expect(savedFeature[0].is_active).toEqual(false);
    expect(savedFeature[0].updated_at).toBeInstanceOf(Date);
    expect(savedFeature[0].updated_at > feature.updated_at).toBe(true);
  });

  it('should throw error for non-existent feature', async () => {
    const updateInput: UpdateFeatureInput = {
      id: 99999,
      name: 'Non-existent Feature'
    };

    expect(updateFeature(updateInput)).rejects.toThrow(/feature with id 99999 not found/i);
  });

  it('should handle empty update gracefully', async () => {
    const feature = await createTestFeature();

    const updateInput: UpdateFeatureInput = {
      id: feature.id
    };

    const result = await updateFeature(updateInput);

    // Only updated_at should change
    expect(result.name).toEqual(feature.name);
    expect(result.description).toEqual(feature.description);
    expect(result.icon).toEqual(feature.icon);
    expect(result.is_highlighted).toEqual(feature.is_highlighted);
    expect(result.sort_order).toEqual(feature.sort_order);
    expect(result.is_active).toEqual(feature.is_active);
    expect(result.created_at).toEqual(feature.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > feature.updated_at).toBe(true);
  });
});