import { z } from 'zod';

// Base validation schemas
export const authValidationSchemas = {
  email: z.string()
    .email('Nieprawidłowy format email')
    .max(255, 'Email nie może być dłuższy niż 255 znaków')
    .transform(email => email.toLowerCase().trim()),
  
  password: z.string()
    .min(8, 'Hasło musi mieć minimum 8 znaków')
    .max(128, 'Hasło nie może być dłuższe niż 128 znaków')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.,/])[A-Za-z\d@$!%*?&.,/]/,
      'Hasło musi zawierać małe i wielkie litery, cyfry oraz znaki specjalne (@$!%*?&.,/)'
    ),
  
  confirmPassword: z.string(),
  

} satisfies Record<string, z.ZodSchema>;

// Signin schema
export const signinSchema = z.object({
  email: authValidationSchemas.email,
  password: z.string().min(1, 'Hasło jest wymagane')
});

// Signup schema with password confirmation
export const signupSchema = z.object({
  email: authValidationSchemas.email,
  password: authValidationSchemas.password,
  confirmPassword: authValidationSchemas.confirmPassword
}).refine(data => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword']
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: authValidationSchemas.email
});

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().uuid('Nieprawidłowy token resetujący'),
  password: authValidationSchemas.password,
  confirmPassword: authValidationSchemas.confirmPassword
}).refine(data => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword']
});



// Validation functions with error handling
export async function validateSigninRequest(data: unknown) {
  try {
    return signinSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        type: 'VALIDATION_ERROR',
        message: 'Nieprawidłowe dane wejściowe',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })),
        statusCode: 400
      };
    }
    throw error;
  }
}

export async function validateSignupRequest(data: unknown) {
  try {
    return signupSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        type: 'VALIDATION_ERROR',
        message: 'Nieprawidłowe dane rejestracji',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })),
        statusCode: 400
      };
    }
    throw error;
  }
}

export async function validateForgotPasswordRequest(data: unknown) {
  try {
    return forgotPasswordSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        type: 'VALIDATION_ERROR',
        message: 'Nieprawidłowy adres email',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })),
        statusCode: 400
      };
    }
    throw error;
  }
}

export async function validateResetPasswordRequest(data: unknown) {
  try {
    return resetPasswordSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        type: 'VALIDATION_ERROR',
        message: 'Nieprawidłowe dane resetowania hasła',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        })),
        statusCode: 400
      };
    }
    throw error;
  }
}



// JWT token validation schema
export const jwtTokenSchema = z
  .string()
  .min(1, 'Token autoryzacji jest wymagany')
  .regex(
    /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
    'Nieprawidłowy format tokenu JWT'
  );

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
export type SignupRequestInput = z.infer<typeof signupSchema>;
export type SigninRequestInput = z.infer<typeof signinSchema>;

/**
 * Extract JWT token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string): string => {
  const validatedHeader = validateAuthorizationHeader(authHeader);
  return validatedHeader.replace('Bearer ', '');
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