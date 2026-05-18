export const INJECTION_PAYLOADS = [
  { email: "test' OR '1'='1@finflow.test", password: "x' OR '1'='1" },
  { email: '"; DROP TABLE ahorradoresInteligentes;--@finflow.test', password: 'x' },
  { email: '<script>alert(1)</script>@finflow.test', password: '<script>alert(1)</script>' },
  { email: 'test@finflow.test', password: "' OR 1=1--" },
];

export const MALFORMED_TOKENS = [
  'not-a-jwt',
  'Bearer',
  'a.b',
  'a.b.c',
  'eyJhbGciOiJIUzI1NiJ9.invalid.signature',
];
