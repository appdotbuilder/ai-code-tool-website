import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { featuresTable } from '../db/schema';
import { type CreateFeatureInput } from '../schema';
import { getFeatures, getActiveFeatures, getHighlightedFeatures } from '../handlers/get_features';

// Test data for features
const testFeatures: CreateFeatureInput[] = [
  {
    name: 'AI Text Generation',
    description: 'Generate high-quality text content with advanced AI models',
    icon: 'text-icon',
    is_highlighted: true,
    sort_order: 1,
    is_active: true
  },
  {
    name: 'Image Recognition',
    description: 'Analyze and classify images with machine learning',
    icon: 'image-icon',
    is_highlighted: false,
    sort_order: 2,
    is_active: true
  },
  {
    name: 'Voice Processing',
    description: 'Convert speech to text and text to speech',
    icon: null,
    is_highlighted: true,
    sort_order: 3,
    is_active: false
  },
  {
    name: 'Data Analytics',
    description: 'Advanced data analysis and visualization tools',
    icon: 'analytics-icon',
    is_highlighted: false,
    sort_order: 4,
    is_active: true
  },
  {
    name: 'Inactive Feature',
    description: 'This feature is currently inactive',
    icon: null,
    is_highlighted: false,
    sort_order: 5,
    is_active: false
  }
];

describe('getFeatures handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('getFeatures', () => {
    it('should return empty array when no features exist', async () => {
      const result = await getFeatures();
      expect(result).toEqual([]);
    });

    it('should return all features ordered by sort_order and name', async () => {
      // Create test features
      for (const feature of testFeatures) {
        await db.insert(featuresTable)
          .values({
            name: feature.name,
            description: feature.description,
            icon: feature.icon,
            is_highlighted: feature.is_highlighted,
            sort_order: feature.sort_order,
            is_active: feature.is_active
          })
          .execute();
      }

      const result = await getFeatures();

      // Should return all features
      expect(result).toHaveLength(5);
      
      // Verify ordering by sort_order
      expect(result[0].name).toEqual('AI Text Generation');
      expect(result[1].name).toEqual('Image Recognition');
      expect(result[2].name).toEqual('Voice Processing');
      expect(result[3].name).toEqual('Data Analytics');
      expect(result[4].name).toEqual('Inactive Feature');

      // Verify all fields are present
      result.forEach(feature => {
        expect(feature.id).toBeDefined();
        expect(feature.name).toBeDefined();
        expect(feature.description).toBeDefined();
        expect(feature.sort_order).toBeDefined();
        expect(typeof feature.is_active).toBe('boolean');
        expect(typeof feature.is_highlighted).toBe('boolean');
        expect(feature.created_at).toBeInstanceOf(Date);
        expect(feature.updated_at).toBeInstanceOf(Date);
      });
    });

    it('should handle features with same sort_order by ordering by name', async () => {
      // Create features with same sort_order
      await db.insert(featuresTable)
        .values([
          {
            name: 'Zebra Feature',
            description: 'Last alphabetically',
            sort_order: 1,
            is_active: true,
            is_highlighted: false
          },
          {
            name: 'Alpha Feature',
            description: 'First alphabetically',
            sort_order: 1,
            is_active: true,
            is_highlighted: false
          }
        ])
        .execute();

      const result = await getFeatures();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Alpha Feature');
      expect(result[1].name).toEqual('Zebra Feature');
    });
  });

  describe('getActiveFeatures', () => {
    it('should return empty array when no active features exist', async () => {
      // Create only inactive features
      await db.insert(featuresTable)
        .values({
          name: 'Inactive Feature',
          description: 'This feature is inactive',
          sort_order: 1,
          is_active: false,
          is_highlighted: false
        })
        .execute();

      const result = await getActiveFeatures();
      expect(result).toEqual([]);
    });

    it('should return only active features ordered by sort_order', async () => {
      // Create test features
      for (const feature of testFeatures) {
        await db.insert(featuresTable)
          .values({
            name: feature.name,
            description: feature.description,
            icon: feature.icon,
            is_highlighted: feature.is_highlighted,
            sort_order: feature.sort_order,
            is_active: feature.is_active
          })
          .execute();
      }

      const result = await getActiveFeatures();

      // Should return only active features (3 out of 5)
      expect(result).toHaveLength(3);
      
      // Verify only active features are returned
      result.forEach(feature => {
        expect(feature.is_active).toBe(true);
      });

      // Verify ordering
      expect(result[0].name).toEqual('AI Text Generation');
      expect(result[1].name).toEqual('Image Recognition');
      expect(result[2].name).toEqual('Data Analytics');
    });

    it('should properly handle all required fields for active features', async () => {
      await db.insert(featuresTable)
        .values({
          name: 'Test Active Feature',
          description: 'A test feature that is active',
          icon: 'test-icon',
          is_highlighted: true,
          sort_order: 1,
          is_active: true
        })
        .execute();

      const result = await getActiveFeatures();

      expect(result).toHaveLength(1);
      const feature = result[0];
      
      expect(feature.name).toEqual('Test Active Feature');
      expect(feature.description).toEqual('A test feature that is active');
      expect(feature.icon).toEqual('test-icon');
      expect(feature.is_highlighted).toBe(true);
      expect(feature.is_active).toBe(true);
      expect(feature.sort_order).toEqual(1);
      expect(feature.id).toBeDefined();
      expect(feature.created_at).toBeInstanceOf(Date);
      expect(feature.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('getHighlightedFeatures', () => {
    it('should return empty array when no highlighted active features exist', async () => {
      // Create features that are either not highlighted or not active
      await db.insert(featuresTable)
        .values([
          {
            name: 'Not Highlighted',
            description: 'Active but not highlighted',
            sort_order: 1,
            is_active: true,
            is_highlighted: false
          },
          {
            name: 'Highlighted but Inactive',
            description: 'Highlighted but inactive',
            sort_order: 2,
            is_active: false,
            is_highlighted: true
          }
        ])
        .execute();

      const result = await getHighlightedFeatures();
      expect(result).toEqual([]);
    });

    it('should return only highlighted AND active features', async () => {
      // Create test features
      for (const feature of testFeatures) {
        await db.insert(featuresTable)
          .values({
            name: feature.name,
            description: feature.description,
            icon: feature.icon,
            is_highlighted: feature.is_highlighted,
            sort_order: feature.sort_order,
            is_active: feature.is_active
          })
          .execute();
      }

      const result = await getHighlightedFeatures();

      // Should return only features that are both highlighted AND active (1 out of 5)
      expect(result).toHaveLength(1);
      
      const feature = result[0];
      expect(feature.name).toEqual('AI Text Generation');
      expect(feature.is_highlighted).toBe(true);
      expect(feature.is_active).toBe(true);
    });

    it('should order highlighted features by sort_order and name', async () => {
      // Create multiple highlighted and active features
      await db.insert(featuresTable)
        .values([
          {
            name: 'Feature Z',
            description: 'Last alphabetically, higher sort order',
            sort_order: 2,
            is_active: true,
            is_highlighted: true
          },
          {
            name: 'Feature A',
            description: 'First alphabetically, lower sort order',
            sort_order: 1,
            is_active: true,
            is_highlighted: true
          },
          {
            name: 'Feature B',
            description: 'Second alphabetically, same sort order as A',
            sort_order: 1,
            is_active: true,
            is_highlighted: true
          }
        ])
        .execute();

      const result = await getHighlightedFeatures();

      expect(result).toHaveLength(3);
      expect(result[0].name).toEqual('Feature A');
      expect(result[1].name).toEqual('Feature B');
      expect(result[2].name).toEqual('Feature Z');
    });

    it('should handle null icon values correctly', async () => {
      await db.insert(featuresTable)
        .values({
          name: 'Feature Without Icon',
          description: 'A highlighted feature with no icon',
          icon: null,
          is_highlighted: true,
          sort_order: 1,
          is_active: true
        })
        .execute();

      const result = await getHighlightedFeatures();

      expect(result).toHaveLength(1);
      expect(result[0].icon).toBeNull();
      expect(result[0].is_highlighted).toBe(true);
      expect(result[0].is_active).toBe(true);
    });
  });

  describe('database persistence', () => {
    it('should verify features are properly saved to database', async () => {
      const testFeature = testFeatures[0];
      
      // Insert feature using handler's expected input format
      await db.insert(featuresTable)
        .values({
          name: testFeature.name,
          description: testFeature.description,
          icon: testFeature.icon,
          is_highlighted: testFeature.is_highlighted,
          sort_order: testFeature.sort_order,
          is_active: testFeature.is_active
        })
        .execute();

      // Fetch using handler
      const results = await getFeatures();
      
      expect(results).toHaveLength(1);
      const savedFeature = results[0];
      
      expect(savedFeature.name).toEqual(testFeature.name);
      expect(savedFeature.description).toEqual(testFeature.description);
      expect(savedFeature.icon).toEqual(testFeature.icon);
      expect(savedFeature.is_highlighted).toEqual(testFeature.is_highlighted);
      expect(savedFeature.sort_order).toEqual(testFeature.sort_order);
      expect(savedFeature.is_active).toEqual(testFeature.is_active);
    });
  });
});