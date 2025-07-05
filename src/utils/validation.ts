export function validateEnvVars(requiredVars: Record<string, string | undefined>): Record<string, string> {
  const validated: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    validated[key] = value;
  }
  
  return validated;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 1;
} 