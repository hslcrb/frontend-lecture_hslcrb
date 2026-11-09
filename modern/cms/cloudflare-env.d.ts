interface CloudflareEnv {
  D1: import('@cloudflare/workers-types').D1Database
  R2: import('@cloudflare/workers-types').R2Bucket
  PAYLOAD_SECRET: string
}
