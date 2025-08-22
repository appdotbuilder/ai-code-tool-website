import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { featuresTable } from '../db/schema';
import { type CreateFeatureInput } from '../schema';
import { createFeature } from '../handlers/create_feature';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateFeatureInput = {
  name: 'AI Text Generation',
  description: 'Generate high-quality content using advanced AI algorithms',
  icon: 'text-icon',
  is_highlighted: true,
  sort_order: 10,
  is_active: true
};

// Minimal test input with defaults
const minimalInput: CreateFeatureInput = {
  name: 'Basic Feature',
  description: 'A simple feature description',
  icon: null,
  is_highlighted: false, // Zod default
  sort_order: 0, // Zod default
  is_active: true // Zod default
};

describe('createFeature', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a feature with all fields', async () => {
    const result = await createFeature(testInput);

    // Verify all fields are correctly set
    expect(result.name).toEqual('AI Text Generation');
    expect(result.description).toEqual('Generate high-quality content using advanced AI algorithms');
    expect(result.icon).toEqual('text-icon');
    expect(result.is_highlighted).toBe(true);
    expect(result.sort_order).toEqual(10);
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a feature with minimal input and defaults', async () => {
    const result = await createFeature(minimalInput);

    // Verify fields and defaults
    expect(result.name).toEqual('Basic Feature');
    expect(result.description).toEqual('A simple feature description');
    expect(result.icon).toBeNull();
    expect(result.is_highlighted).toBe(false);
    expect(result.sort_order).toEqual(0);
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save feature to database', async () => {
    const result = await createFeature(testInput);

    // Query the database to verify persistence
    const features = await db.select()
      .from(featuresTable)
      .where(eq(featuresTable.id, result.id))
      .execute();

    expect(features).toHaveLength(1);
    const savedFeature = features[0];
    expect(savedFeature.name).toEqual('AI Text Generation');
    expect(savedFeature.description).toEqual('Generate high-quality content using advanced AI algorithms');
    expect(savedFeature.icon).toEqual('text-icon');
    expect(savedFeature.is_highlighted).toBe(true);
    expect(savedFeature.sort_order).toEqual(10);
    expect(savedFeature.is_active).toBe(true);
    expect(savedFeature.created_at).toBeInstanceOf(Date);
    expect(savedFeature.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null icon correctly', async () => {
    const inputWithNullIcon: CreateFeatureInput = {
      ...testInput,
      icon: null
    };

    const result = await createFeature(inputWithNullIcon);

    expect(result.icon).toBeNull();

    // Verify in database
    const features = await db.select()
      .from(featuresTable)
      .where(eq(featuresTable.id, result.id))
      .execute();

    expect(features[0].icon).toBeNull();
  });

  it('should create multiple features with different sort orders', async () => {
    const feature1 = await createFeature({
      ...testInput,
      name: 'Feature 1',
      sort_order: 1
    });

    const feature2 = await createFeature({
      ...testInput,
      name: 'Feature 2',
      sort_order: 2
    });

    // Verify both features were created with correct sort orders
    expect(feature1.sort_order).toEqual(1);
    expect(feature2.sort_order).toEqual(2);
    expect(feature1.id).not.toEqual(feature2.id);

    // Verify in database
    const allFeatures = await db.select()
      .from(featuresTable)
      .execute();

    expect(allFeatures).toHaveLength(2);
    const sortOrders = allFeatures.map(f => f.sort_order).sort();
    expect(sortOrders).toEqual([1, 2]);
  });

  it('should handle highlighted and non-highlighted features', async () => {
    const highlightedFeature = await createFeature({
      ...testInput,
      name: 'Highlighted Feature',
      is_highlighted: true
    });

    const normalFeature = await createFeature({
      ...testInput,
      name: 'Normal Feature',
      is_highlighted: false
    });

    expect(highlightedFeature.is_highlighted).toBe(true);
    expect(normalFeature.is_highlighted).toBe(false);

    // Verify in database
    const features = await db.select()
      .from(featuresTable)
      .execute();

    const highlighted = features.find(f => f.name === 'Highlighted Feature');
    const normal = features.find(f => f.name === 'Normal Feature');

    expect(highlighted?.is_highlighted).toBe(true);
    expect(normal?.is_highlighted).toBe(false);
  });
});