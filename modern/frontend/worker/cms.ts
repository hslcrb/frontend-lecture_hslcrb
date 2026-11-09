export interface CmsEnv { CMS_SERVICE?: { fetch: (request: Request) => Promise<Response> } }
type Kind = 'lecture-pages' | 'lecture-assets'

/** Private Worker-to-Worker service binding: no public CMS token is exposed. */
export async function loadPublishedContent(
  env: CmsEnv, kind: Kind, path: string,
): Promise<{ html?: string; source?: string } | null> {
  if (!env.CMS_SERVICE) return null
  const uri = new URL('https://cms.internal/api/' + kind)
  uri.searchParams.set('where[path][equals]', path)
  uri.searchParams.set('where[status][equals]', 'published')
  uri.searchParams.set('depth', '0')
  uri.searchParams.set('limit', '1')
  const response = await env.CMS_SERVICE.fetch(new Request(uri, { headers: { Accept: 'application/json' } }))
  if (!response.ok) throw new Error('CMS returned HTTP ' + response.status)
  const json = await response.json() as { docs?: Array<{ html?: string; source?: string }> }
  return json.docs?.[0] ?? null
}
