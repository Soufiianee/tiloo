import type { APIRoute } from 'astro';
import { absUrl } from '../lib/data';

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${absUrl('/sitemap.xml')}\n`, { headers: { 'Content-Type': 'text/plain' } });
