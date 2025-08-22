import { db } from '../db';
import { contactSubmissionsTable } from '../db/schema';
import { type CreateContactSubmissionInput, type ContactSubmission } from '../schema';

export const createContactSubmission = async (input: CreateContactSubmissionInput): Promise<ContactSubmission> => {
  try {
    // Insert contact submission record
    const result = await db.insert(contactSubmissionsTable)
      .values({
        name: input.name,
        email: input.email,
        company: input.company || null, // Handle optional company field
        message: input.message,
        is_read: false // New submissions are unread by default
        // created_at is handled by database default
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Contact submission creation failed:', error);
    throw error;
  }
};