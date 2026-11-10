import type { APIRoute } from 'astro';
import { updates, site, absUrl, byCode } from '../../lib/data';

const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = () => {
  const name = site.SITE_NAME === 'TBD' ? 'Plug-in Solar Tracker' : site.SITE_NAME;
  const items = updates.slice(0, 50).map((u) => {
    const link = u.state ? absUrl(`/states/${byCode[u.state].slug}/`) : absUrl('/updates/');
    return `<item><title>${x(u.title)}</title><link>${link}</link><guid isPermaLink="false">${x(`${u.date}-${u.state ?? 'site'}-${u.kind}`)}</guid><pubDate>${new Date(u.date + 'T12:00:00Z').toUTCString()}</pubDate><description>${x(u.body)}</description></item>`;
  }).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${x(name)}: updates</title><link>${absUrl('/updates/')}</link><description>Plug-in solar law and kit data changes</description><language>en-us</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
