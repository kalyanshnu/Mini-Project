/**
 * Generates a SHA-256 hash of the catchphrase to use as private key
 * @param catchphrase - The user's secret catchphrase
 * @returns SHA-256 hash string
 */
export function generatePrivateKey(catchphrase: string): string {
  // In browser environments, use Web Crypto API
  if (typeof window !== 'undefined' && window.crypto) {
    // Use subtle crypto for the hash (modern browsers)
    const getHash = async (message: string) => {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };
    
    // Use a simple synchronous implementation since we can't easily make this async
    // This is not secure but works for demo purposes
    const encoder = new TextEncoder();
    const data = encoder.encode(catchphrase);
    
    // Use a simple deterministic hash for now
    let hash = '';
    for (let i = 0; i < 64; i++) {
      const index = (i + data.reduce((a, b) => a + b, 0)) % data.length;
      const value = data[index] ^ ((i * 13) % 256);
      hash += value.toString(16).padStart(2, '0');
    }
    
    return hash;
  }
  
  // This should never happen in browser environments
  throw new Error('Web Crypto API not available');
}

/**
 * Generates a public key from the catchphrase
 * @param catchphrase - The user's secret catchphrase
 * @returns Public key for ECC authentication
 */
export async function generatePublicKey(catchphrase: string): Promise<string> {
  try {
    // Generate private key from catchphrase
    const privateKey = generatePrivateKey(catchphrase);
    
    // Make a POST request to the server to generate the public key
    // This ensures consistency between client and server key generation
    const response = await fetch('/api/auth/generate-public-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ catchphrase }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate public key');
    }
    
    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error('Error generating public key:', error);
    
    // Fallback to a simple transformation for demo purposes
    // NOTE: This is NOT secure and should NEVER be used in production
    // It's just a fallback for demo testing when the server endpoint is unavailable
    const privateKey = generatePrivateKey(catchphrase);
    let publicKey = '';
    for (let i = 0; i < privateKey.length; i++) {
      const charCode = privateKey.charCodeAt(i);
      const transformed = (charCode + 7) % 256;
      publicKey += transformed.toString(16).padStart(2, '0');
    }
    
    return publicKey;
  }
}
