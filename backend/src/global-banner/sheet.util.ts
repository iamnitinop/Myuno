/**
 * Sheet fetching + parsing helpers for the Global Banner feature.
 *
 * The Google Sheet is published as CSV. Its "Promotion Text" / "Offer Product Text"
 * columns contain multi-line HTML with embedded commas and doubled ("") quotes, so
 * we need a proper CSV parser (not a naive split).
 */

export interface SheetRow {
    promotionText: string;
    offerProductText: string;
    saleActive: string; // raw value, e.g. "TRUE" / "FALSE"
    product: string;
    discount: string;
    contentId: string;
    url: string;
    imageUrl: string; // per-product offer image (from a column whose header contains "image")
}

/**
 * Parse CSV text into an array of string rows.
 * Handles quoted fields containing commas, newlines and doubled-quote ("") escapes.
 */
export function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let field = '';
    let row: string[] = [];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += c;
            }
        } else {
            if (c === '"') {
                inQuotes = true;
            } else if (c === ',') {
                row.push(field);
                field = '';
            } else if (c === '\n') {
                row.push(field);
                rows.push(row);
                row = [];
                field = '';
            } else if (c === '\r') {
                // ignore — handled by \n
            } else {
                field += c;
            }
        }
    }
    // flush trailing field/row
    if (field.length || row.length) {
        row.push(field);
        rows.push(row);
    }
    return rows;
}

/**
 * Normalize a page handle for matching: lowercase, trim, drop surrounding slashes,
 * and if a full URL/path is passed take the last non-empty path segment.
 * e.g. "https://x.com/pages/balaayah-lp/" -> "balaayah-lp"
 */
export function normalizeHandle(input: string): string {
    if (!input) return '';
    let h = String(input).trim().toLowerCase();
    // strip query/hash
    h = h.split('?')[0].split('#')[0];
    // if it looks like a URL or path, take the last meaningful segment
    if (h.includes('/')) {
        const parts = h.split('/').filter((p) => p && p.length);
        h = parts.length ? parts[parts.length - 1] : '';
    }
    return h.trim();
}

/**
 * Build a handle -> SheetRow map from parsed CSV rows, matching columns by header name
 * (robust to column reordering). First occurrence of a handle wins.
 */
export function buildSheetMap(rows: string[][]): Map<string, SheetRow> {
    const map = new Map<string, SheetRow>();
    if (!rows.length) return map;

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const idx = (name: string) => header.indexOf(name.toLowerCase());

    const cUrl = idx('url');
    const cHandle = idx('page handle');
    const cContentId = idx('content id');
    const cPromo = idx('promotion text');
    const cSale = idx('sale active');
    const cProduct = idx('page product');
    const cOffer = idx('offer product text');
    const cDiscount = idx('discount');
    // Image column: first header containing the word "image" (e.g. "Offer Image", "Image URL", "Banner Image")
    const cImage = header.findIndex((h) => h.includes('image'));

    const at = (row: string[], i: number) => (i >= 0 && i < row.length ? (row[i] || '').trim() : '');

    for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        const handle = normalizeHandle(at(row, cHandle));
        if (!handle) continue;
        if (map.has(handle)) continue; // first occurrence wins

        map.set(handle, {
            url: at(row, cUrl),
            contentId: at(row, cContentId),
            promotionText: cPromo >= 0 ? row[cPromo] || '' : '',
            offerProductText: cOffer >= 0 ? row[cOffer] || '' : '',
            saleActive: at(row, cSale),
            product: at(row, cProduct),
            discount: at(row, cDiscount),
            imageUrl: at(row, cImage),
        });
    }
    return map;
}

/**
 * Remove the first heading element (<h1>/<h2>/<h3>) from an HTML string, so the
 * sheet "Promotion Text" renders only its message lines (offer + disclaimer),
 * not the baked-in "LIMITED TIME OFFER" heading. Leaves the rest intact.
 */
export function stripLeadingHeading(html: string): string {
    if (!html) return html;
    return html.replace(/<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>/i, '').replace(/^\s+/, '');
}

/**
 * Remove inline style="" / class="" / align="" attributes from the sheet HTML so
 * the dashboard editor's typography (font size, color, alignment, etc.) fully
 * controls the rendered message. Keeps tags/structure (<p>, <strong>, <em>, <br>).
 */
export function stripInlineStyles(html: string): string {
    if (!html) return html;
    return html
        .replace(/\sstyle\s*=\s*"(?:[^"\\]|\\.)*"/gi, '')
        .replace(/\sstyle\s*=\s*'(?:[^'\\]|\\.)*'/gi, '')
        .replace(/\sclass\s*=\s*"(?:[^"\\]|\\.)*"/gi, '')
        .replace(/\sclass\s*=\s*'(?:[^'\\]|\\.)*'/gi, '')
        .replace(/\salign\s*=\s*"[^"]*"/gi, '');
}

/** Full clean for the sheet offer message: drop the leading heading + inline styles. */
export function cleanOfferHtml(html: string): string {
    return stripInlineStyles(stripLeadingHeading(html || ''));
}

/** Extract the gid (sheet tab id) from a URL's query or hash; default "0". */
function extractGid(url: string): string {
    const m = url.match(/[?&#]gid=([0-9]+)/);
    return m ? m[1] : '0';
}

/**
 * Coerce any Google Sheets URL into a CSV export URL. Handles:
 *  - Published: /spreadsheets/d/e/<TOKEN>/pubhtml|pub  ->  /pub?...&output=csv
 *  - Standard:  /spreadsheets/d/<ID>/edit#gid=N        ->  /d/<ID>/export?format=csv&gid=N
 * Non-Google or already-CSV URLs are returned unchanged.
 */
export function toCsvUrl(sheetUrl: string): string {
    if (!sheetUrl) return sheetUrl;
    let url = sheetUrl.trim();
    if (!url.includes('docs.google.com')) return url;

    const gid = extractGid(url);

    // Published-to-web form: /spreadsheets/d/e/<TOKEN>/...
    const pubMatch = url.match(/\/spreadsheets\/d\/e\/([^/]+)/);
    if (pubMatch) {
        url = url.replace('/pubhtml', '/pub');
        if (/output=csv/i.test(url)) return url;
        url += (url.includes('?') ? '&' : '?') + 'output=csv';
        return url;
    }

    // Standard spreadsheet form: /spreadsheets/d/<ID>/...
    const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (idMatch) {
        const id = idMatch[1];
        return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
    }

    return url;
}

interface CacheEntry {
    map: Map<string, SheetRow>;
    expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function ttlMs(): number {
    // Short by default so sheet edits reflect on live pages within seconds. Override with
    // GLOBAL_BANNER_CACHE_SECONDS (e.g. set to 2-3 during a live sale, or higher to save cost).
    const secs = Number(process.env.GLOBAL_BANNER_CACHE_SECONDS || 10);
    return (isNaN(secs) ? 10 : secs) * 1000;
}

/**
 * Fetch + parse + cache the sheet for a given published CSV URL.
 * Returns a handle -> SheetRow map. Throws on fetch/parse failure (caller handles).
 */
export async function getSheetMap(
    sheetUrl: string,
    now: number,
    forceRefresh = false,
): Promise<Map<string, SheetRow>> {
    const csvUrl = toCsvUrl(sheetUrl);
    const cached = cache.get(csvUrl);
    if (!forceRefresh && cached && cached.expiresAt > now) {
        return cached.map;
    }

    // no-store so when we DO fetch, we get Google's freshest published CSV
    // (avoids any intermediary HTTP caching between us and Google).
    const res = await fetch(csvUrl, { redirect: 'follow', cache: 'no-store' as RequestCache });
    if (!res.ok) {
        throw new Error(`Sheet fetch failed: HTTP ${res.status}`);
    }
    const text = await res.text();
    const map = buildSheetMap(parseCsv(text));

    cache.set(csvUrl, { map, expiresAt: now + ttlMs() });
    return map;
}

/** Clear cached sheet data (all, or a single URL). Cache is keyed by the CSV URL. */
export function clearSheetCache(sheetUrl?: string): void {
    if (sheetUrl) cache.delete(toCsvUrl(sheetUrl));
    else cache.clear();
}
