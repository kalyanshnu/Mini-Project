import * as crypto from 'crypto';
import { createHash } from 'crypto';
import elliptic from 'elliptic';

class AuthService {
  private ec: elliptic.ec;
  
  constructor() {
    this.ec = new elliptic.ec('secp256k1');
  }

  /**
   * Generates a SHA-256 hash from the catchphrase
   * @param catchphrase - The user's secret catchphrase
   * @returns SHA-256 hash as a private key
   */
  generatePrivateKey(catchphrase: string): string {
    return createHash('sha256').update(catchphrase).digest('hex');
  }

  /**
   * Generates a public key from the catchphrase
   * @param catchphrase - The user's secret catchphrase
   * @returns Public key derived from the private key
   */
  async generatePublicKey(catchphrase: string): Promise<string> {
    // Generate private key from catchphrase
    const privateKey = this.generatePrivateKey(catchphrase);
    
    // Create key pair from private key
    const keyPair = this.ec.keyFromPrivate(privateKey, 'hex');
    
    // Get public key in hex format
    return keyPair.getPublic('hex');
  }

  /**
   * Generates a random session token
   * @returns Random token string
   */
  generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validates a session token
   * @param storedToken - The token stored in the database
   * @param providedToken - The token provided by the client
   * @returns Boolean indicating if the tokens match
   */
  validateSessionToken(storedToken: string, providedToken: string): boolean {
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(storedToken, 'hex'),
      Buffer.from(providedToken, 'hex')
    );
  }
}

// Export a singleton instance
export const authService = new AuthService();
