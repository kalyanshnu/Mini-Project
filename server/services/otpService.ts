import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';

class OtpService {
  /**
   * Generates a new OTP secret
   * @returns Secret key for TOTP generation
   */
  generateSecret(): string {
    return speakeasy.generateSecret({ length: 20 }).base32;
  }

  /**
   * Generates a time-based OTP
   * @param secret - The user's OTP secret
   * @returns 6-digit OTP
   */
  generateOTP(secret: string): string {
    return speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      digits: 6,
      step: 300 // 5 minutes validity
    });
  }

  /**
   * Verifies a time-based OTP
   * @param secret - The user's OTP secret
   * @param token - The OTP token to verify
   * @returns Boolean indicating if the token is valid
   */
  verifyOTP(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      digits: 6,
      step: 300, // 5 minutes validity
      window: 1 // Allow 1 step backward/forward for clock drift
    });
  }

  /**
   * Generates a QR code URL for OTP setup
   * @param username - The user's username
   * @param secret - The user's OTP secret
   * @returns URL to use with authenticator apps
   */
  generateQRCodeUrl(username: string, secret: string): string {
    return speakeasy.otpauthURL({
      secret: secret,
      encoding: 'base32',
      label: encodeURIComponent(username),
      issuer: 'ECC Security System',
      algorithm: 'sha1',
      digits: 6
    });
  }
}

// In production, you would install the speakeasy package
// For now, mocking a minimal OTP service
const speakeasyMock = {
  generateSecret: (): { base32: string } => {
    return { base32: crypto.randomBytes(10).toString('base64') };
  },
  totp: function(options: any): string {
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    return mockOtp;
  }
};

// Add verify function to the mock
speakeasyMock.totp.verify = (options: any): boolean => {
  // Since this is a mock, we'll accept any 6-digit code
  // In a real implementation, this would check against actual TOTP algorithm
  return options.token.length === 6 && /^\d+$/.test(options.token);
};

speakeasyMock.otpauthURL = (options: any): string => {
  return `otpauth://totp/${options.issuer}:${options.label}?secret=${options.secret}&issuer=${options.issuer}`;
};

// Export a singleton instance with the mock
export const otpService = new OtpService();
