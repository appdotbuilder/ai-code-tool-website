import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactSubmissionsTable } from '../db/schema';
import { type CreateContactSubmissionInput } from '../schema';
import { getContactSubmissions, getUnreadContactSubmissions, markContactSubmissionAsRead } from '../handlers/get_contact_submissions';
import { eq } from 'drizzle-orm';

// Test data for contact submissions
const testSubmission1: CreateContactSubmissionInput = {
  name: 'John Doe',
  email: 'john@example.com',
  company: 'Acme Corp',
  message: 'I am interested in your AI tools.'
};

const testSubmission2: CreateContactSubmissionInput = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  company: null,
  message: 'Can you provide more information about pricing?'
};

describe('getContactSubmissions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no submissions exist', async () => {
    const result = await getContactSubmissions();
    expect(result).toEqual([]);
  });

  it('should return all contact submissions', async () => {
    // Create test submissions one by one to ensure proper timestamp ordering
    const firstSubmission = await db.insert(contactSubmissionsTable)
      .values({ ...testSubmission1, is_read: false })
      .returning()
      .execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondSubmission = await db.insert(contactSubmissionsTable)
      .values({ ...testSubmission2, is_read: true })
      .returning()
      .execute();

    const result = await getContactSubmissions();

    expect(result).toHaveLength(2);
    // Should be ordered by creation date (newest first)
    expect(result[0].id).toEqual(secondSubmission[0].id);
    expect(result[1].id).toEqual(firstSubmission[0].id);
    expect(result[0].name).toEqual('Jane Smith');
    expect(result[1].name).toEqual('John Doe');
    expect(result[0].email).toEqual('jane@example.com');
    expect(result[1].email).toEqual('john@example.com');
    expect(result[0].company).toBeNull();
    expect(result[1].company).toEqual('Acme Corp');
  });

  it('should return submissions ordered by creation date (newest first)', async () => {
    // Create submissions with slight delay to ensure different timestamps
    const firstSubmission = await db.insert(contactSubmissionsTable)
      .values({ ...testSubmission1, is_read: false })
      .returning()
      .execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondSubmission = await db.insert(contactSubmissionsTable)
      .values({ ...testSubmission2, is_read: false })
      .returning()
      .execute();

    const result = await getContactSubmissions();

    expect(result).toHaveLength(2);
    // Second submission should be first (newest)
    expect(result[0].id).toEqual(secondSubmission[0].id);
    expect(result[1].id).toEqual(firstSubmission[0].id);
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should include all fields correctly', async () => {
    await db.insert(contactSubmissionsTable)
      .values({ ...testSubmission1, is_read: false })
      .execute();

    const result = await getContactSubmissions();

    expect(result).toHaveLength(1);
    const submission = result[0];
    expect(submission.id).toBeDefined();
    expect(submission.name).toEqual('John Doe');
    expect(submission.email).toEqual('john@example.com');
    expect(submission.company).toEqual('Acme Corp');
    expect(submission.message).toEqual('I am interested in your AI tools.');
    expect(submission.is_read).toEqual(false);
    expect(submission.created_at).toBeInstanceOf(Date);
  });
});

describe('getUnreadContactSubmissions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no unread submissions exist', async () => {
    // Create only read submissions
    await db.insert(contactSubmissionsTable)
      .values({ ...testSubmission1, is_read: true })
      .execute();

    const result = await getUnreadContactSubmissions();
    expect(result).toEqual([]);
  });

  it('should return only unread contact submissions', async () => {
    // Create both read and unread submissions
    await db.insert(contactSubmissionsTable)
      .values([
        { ...testSubmission1, is_read: false },
        { ...testSubmission2, is_read: true }
      ])
      .execute();

    const result = await getUnreadContactSubmissions();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('John Doe');
    expect(result[0].is_read).toEqual(false);
  });

  it('should return unread submissions ordered by creation date (newest first)', async () => {
    // Create multiple unread submissions
    const firstSubmission = await db.insert(contactSubmissionsTable)
      .values({ ...testSubmission1, is_read: false })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const secondSubmission = await db.insert(contactSubmissionsTable)
      .values({ ...testSubmission2, is_read: false })
      .returning()
      .execute();

    const result = await getUnreadContactSubmissions();

    expect(result).toHaveLength(2);
    // Second submission should be first (newest)
    expect(result[0].id).toEqual(secondSubmission[0].id);
    expect(result[1].id).toEqual(firstSubmission[0].id);
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });
});

describe('markContactSubmissionAsRead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark a contact submission as read', async () => {
    // Create unread submission
    const created = await db.insert(contactSubmissionsTable)
      .values({ ...testSubmission1, is_read: false })
      .returning()
      .execute();

    const result = await markContactSubmissionAsRead(created[0].id);

    expect(result.id).toEqual(created[0].id);
    expect(result.is_read).toEqual(true);
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john@example.com');
  });

  it('should persist the read status in database', async () => {
    // Create unread submission
    const created = await db.insert(contactSubmissionsTable)
      .values({ ...testSubmission1, is_read: false })
      .returning()
      .execute();

    await markContactSubmissionAsRead(created[0].id);

    // Verify in database
    const submissions = await db.select()
      .from(contactSubmissionsTable)
      .where(eq(contactSubmissionsTable.id, created[0].id))
      .execute();

    expect(submissions).toHaveLength(1);
    expect(submissions[0].is_read).toEqual(true);
  });

  it('should work with already read submissions', async () => {
    // Create already read submission
    const created = await db.insert(contactSubmissionsTable)
      .values({ ...testSubmission1, is_read: true })
      .returning()
      .execute();

    const result = await markContactSubmissionAsRead(created[0].id);

    expect(result.id).toEqual(created[0].id);
    expect(result.is_read).toEqual(true);
  });

  it('should throw error for non-existent submission', async () => {
    await expect(markContactSubmissionAsRead(999)).rejects.toThrow(/not found/i);
  });

  it('should return complete submission data', async () => {
    const created = await db.insert(contactSubmissionsTable)
      .values({ ...testSubmission1, is_read: false })
      .returning()
      .execute();

    const result = await markContactSubmissionAsRead(created[0].id);

    expect(result.id).toBeDefined();
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john@example.com');
    expect(result.company).toEqual('Acme Corp');
    expect(result.message).toEqual('I am interested in your AI tools.');
    expect(result.is_read).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });
});