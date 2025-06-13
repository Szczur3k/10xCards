import { z } from 'zod';

// Email validation schema
export const emailSchema = z
  .string()
  .email('Nieprawidłowy format adresu email')
  .min(1, 'Adres email jest wymagany')
  .max(255, 'Adres email nie może przekraczać 255 znaków')
  .toLowerCase()
  .trim();

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Hasło musi mieć co najmniej 8 znaków')
  .max(128, 'Hasło nie może przekraczać 128 znaków')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Hasło musi zawierać co najmniej jedną małą literę, jedną wielką literę i jedną cyfrę'
  );

// JWT token validation schema
export const jwtTokenSchema = z
  .string()
  .min(1, 'Token autoryzacji jest wymagany')
  .regex(
    /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
    'Nieprawidłowy format tokenu JWT'
  );

// Signup request validation schema
export const signupRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

// Signin request validation schema  
export const signinRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Hasło jest wymagane')
});

// Authorization header validation schema
export const authorizationHeaderSchema = z
  .string()
  .regex(
    /^Bearer\s+[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
    'Nieprawidłowy format nagłówka Authorization. Oczekiwany format: Bearer {token}'
  );

/**
 * Type inference from schemas
 */
export type SignupRequestInput = z.infer<typeof signupRequestSchema>;
export type SigninRequestInput = z.infer<typeof signinRequestSchema>;

/**
 * Validation function for signup request
 */
export const validateSignupRequest = async (data: unknown) => {
  try {
    return signupRequestSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string[]> = {};
      
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!formattedErrors[field]) {
          formattedErrors[field] = [];
        }
        formattedErrors[field].push(err.message);
      });
      
      throw {
        type: 'VALIDATION_ERROR',
        message: 'Nieprawidłowe dane rejestracji',
        details: formattedErrors,
        statusCode: 400
      };
    }
    throw error;
  }
};

/**
 * Validation function for signin request
 */
export const validateSigninRequest = async (data: unknown) => {
  try {
    return signinRequestSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string[]> = {};
      
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!formattedErrors[field]) {
          formattedErrors[field] = [];
        }
        formattedErrors[field].push(err.message);
      });
      
      throw {
        type: 'VALIDATION_ERROR',
        message: 'Nieprawidłowe dane logowania',
        details: formattedErrors,
        statusCode: 400
      };
    }
    throw error;
  }
};

/**
 * Validation function for Authorization header
 */
export const validateAuthorizationHeader = (authHeader: string | undefined) => {
  if (!authHeader) {
    throw {
      type: 'UNAUTHORIZED',
      message: 'Nagłówek Authorization jest wymagany',
      statusCode: 401
    };
  }

  try {
    return authorizationHeaderSchema.parse(authHeader);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        type: 'UNAUTHORIZED',
        message: 'Nieprawidłowy format nagłówka Authorization',
        details: { authorization: [error.errors[0]?.message || 'Nieprawidłowy format'] },
        statusCode: 401
      };
    }
    throw error;
  }
};

/**
 * Extract JWT token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string): string => {
  const validatedHeader = validateAuthorizationHeader(authHeader);
  return validatedHeader.replace('Bearer ', '');
}; 