import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { contactSubmissionsTable } from '../db/schema';
import { type CreateContactSubmissionInput } from '../schema';
import { createContactSubmission } from '../handlers/create_contact_submission';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateContactSubmissionInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  company: 'Tech Corp',
  message: 'I am interested in your AI tool and would like to know more about pricing and features.'
};

// Test input without optional company field
const testInputWithoutCompany: CreateContactSubmissionInput = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  company: null,
  message: 'Hello, I have questions about your product.'
};

describe('createContactSubmission', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a contact submission with all fields', async () => {
    const result = await createContactSubmission(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.company).toEqual('Tech Corp');
    expect(result.message).toEqual(testInput.message);
    expect(result.is_read).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a contact submission without company', async () => {
    const result = await createContactSubmission(testInputWithoutCompany);

    // Basic field validation
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.company).toBeNull();
    expect(result.message).toEqual(testInputWithoutCompany.message);
    expect(result.is_read).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save contact submission to database', async () => {
    const result = await createContactSubmission(testInput);

    // Query using proper drizzle syntax
    const submissions = await db.select()
      .from(contactSubmissionsTable)
      .where(eq(contactSubmissionsTable.id, result.id))
      .execute();

    expect(submissions).toHaveLength(1);
    expect(submissions[0].name).toEqual('John Doe');
    expect(submissions[0].email).toEqual('john.doe@example.com');
    expect(submissions[0].company).toEqual('Tech Corp');
    expect(submissions[0].message).toEqual(testInput.message);
    expect(submissions[0].is_read).toEqual(false);
    expect(submissions[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple contact submissions independently', async () => {
    const result1 = await createContactSubmission(testInput);
    const result2 = await createContactSubmission(testInputWithoutCompany);

    // Verify both submissions exist in database
    const allSubmissions = await db.select()
      .from(contactSubmissionsTable)
      .execute();

    expect(allSubmissions).toHaveLength(2);
    
    // Find submissions by ID
    const submission1 = allSubmissions.find(s => s.id === result1.id);
    const submission2 = allSubmissions.find(s => s.id === result2.id);

    expect(submission1).toBeDefined();
    expect(submission1!.name).toEqual('John Doe');
    expect(submission1!.company).toEqual('Tech Corp');

    expect(submission2).toBeDefined();
    expect(submission2!.name).toEqual('Jane Smith');
    expect(submission2!.company).toBeNull();
  });

  it('should handle special characters in message content', async () => {
    const specialMessageInput: CreateContactSubmissionInput = {
      name: 'Test User',
      email: 'test@example.com',
      company: null,
      message: 'Special chars: éñçödìñg & "quotes" <html>tags</html> 日本語 emoji 🚀'
    };

    const result = await createContactSubmission(specialMessageInput);

    expect(result.message).toEqual(specialMessageInput.message);

    // Verify in database
    const submissions = await db.select()
      .from(contactSubmissionsTable)
      .where(eq(contactSubmissionsTable.id, result.id))
      .execute();

    expect(submissions[0].message).toEqual(specialMessageInput.message);
  });

  it('should set is_read to false by default', async () => {
    const result = await createContactSubmission(testInput);

    expect(result.is_read).toEqual(false);

    // Verify in database
    const submissions = await db.select()
      .from(contactSubmissionsTable)
      .where(eq(contactSubmissionsTable.id, result.id))
      .execute();

    expect(submissions[0].is_read).toEqual(false);
  });
});