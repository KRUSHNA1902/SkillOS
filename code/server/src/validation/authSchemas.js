import { z } from 'zod';

/**
 * Validation schema for user registration (Sign-up).
 * Enforces valid email, strong password, and clean input constraints.
 */
export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(72, 'Password cannot exceed 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  fullName: z
    .string({ required_error: 'Full Name is required' })
    .trim()
    .min(2, 'Full Name must be at least 2 characters long')
    .max(100, 'Full Name cannot exceed 100 characters'),
  phone: z
    .string()
    .trim()
    .max(25, 'Phone number is too long')
    .optional()
    .nullable()
});

/**
 * Validation schema for user login (Sign-in).
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .max(72, 'Password cannot exceed 72 characters')
});

/**
 * Express middleware generator for validating request body against a Zod schema.
 */
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    // Return first validation error in a clean, user-friendly format
    const firstIssue = result.error.issues[0];
    return res.status(400).json({
      error: firstIssue.message,
      field: firstIssue.path.join('.')
    });
  }
  // Replace req.body with sanitized and trimmed data
  req.body = result.data;
  next();
};
