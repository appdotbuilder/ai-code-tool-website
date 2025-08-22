import { db } from '../db';
import { contactSubmissionsTable } from '../db/schema';
import { type ContactSubmission } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getContactSubmissions = async (): Promise<ContactSubmission[]> => {
  try {
    // Get all contact submissions ordered by creation date (newest first)
    const result = await db.select()
      .from(contactSubmissionsTable)
      .orderBy(desc(contactSubmissionsTable.created_at))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to get contact submissions:', error);
    throw error;
  }
};

export const getUnreadContactSubmissions = async (): Promise<ContactSubmission[]> => {
  try {
    // Get only unread contact submissions ordered by creation date (newest first)
    const result = await db.select()
      .from(contactSubmissionsTable)
      .where(eq(contactSubmissionsTable.is_read, false))
      .orderBy(desc(contactSubmissionsTable.created_at))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to get unread contact submissions:', error);
    throw error;
  }
};

export const markContactSubmissionAsRead = async (id: number): Promise<ContactSubmission> => {
  try {
    // Update the submission to mark as read and return the updated record
    const result = await db.update(contactSubmissionsTable)
      .set({ is_read: true })
      .where(eq(contactSubmissionsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Contact submission with id ${id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Failed to mark contact submission as read:', error);
    throw error;
  }
};