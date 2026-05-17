import encoding from 'k6/encoding';
import crypto from 'k6/crypto';

function base64UrlEncodeString(str) {
  return encoding.b64encode(str, 'rawurl');
}

function base64UrlEncodeBytes(bytes) {
  return encoding.b64encode(bytes, 'rawurl');
}

export function signJwtHs256(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncodeString(JSON.stringify(header));
  const encodedPayload = base64UrlEncodeString(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const sig = crypto.hmac('sha256', secret, signingInput, 'binary');
  const encodedSig = base64UrlEncodeBytes(sig);

  return `${signingInput}.${encodedSig}`;
}
