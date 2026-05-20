/**
 * CensusMapper API client — pulls 2021 Census data for a batch of Dissemination Areas.
 *
 * Why CensusMapper (not StatCan WDS directly): StatCan's SDMX API is opaque and
 * times out; CensusMapper wraps the same underlying data in one well-behaved
 * REST endpoint that takes many regions per call.
 *
 * Endpoint:
 *   POST https://censusmapper.ca/api/v1/data.csv
 *   form: api_key, dataset=CA21, level=DA, regions=JSON, vectors=JSON
 *
 * Response: CSV. Columns are GeoUID, Type, Region Name, Area (sq km), Population,
 *           Dwellings, Households, then one column per requested vector.
 *           The vector columns are named like:  "v_CA21_906: Median total income..."
 *
 * Get a key (free) at https://censusmapper.ca/api → sign in → API Access.
 * Stored in .env as CENSUSMAPPER_API_KEY (must include the "CensusMapper_" prefix).
 */

const ENDPOINT = 'https://censusmapper.ca/api/v1/data.csv';

// Vector IDs — verified live against the CA21 catalogue (vector_info/CA21.csv)
export const VECTORS = {
  income:           'v_CA21_906',  // Median total income of household in 2020 ($)
  tenureTotal:      'v_CA21_4237', // Total - Private households by tenure (denom)
  owner:            'v_CA21_4238', // Owner households
  structuralTotal:  'v_CA21_434',  // Total - Occupied private dwellings by structural type
  singleDetached:   'v_CA21_435',  // Single-detached house
  ageTotal:         'v_CA21_4263', // Total - Occupied private dwellings by period of construction
  ageBefore1960:    'v_CA21_4264', // 1960 or before
  age1961to1980:    'v_CA21_4265', // 1961 to 1980
};

const VECTOR_LIST = Object.values(VECTORS);

/**
 * Fetch profiles for a batch of DGUIDs in ONE POST.
 * @param {string[]} dguids — full DGUIDs from StatCan (e.g. "2021S051235180319")
 * @returns {Promise<Array<{dguid, population, medianHouseholdIncome, ownerOccupancyRate, oldHomesRate, singleDetachedRate}>>}
 */
export async function fetchProfiles(dguids, apiKey) {
  if (!apiKey) throw new Error('Missing CENSUSMAPPER_API_KEY');
  if (!dguids?.length) return [];

  // CensusMapper wants DAUIDs (last 8 digits of the DGUID), not full DGUIDs.
  const dauids = dguids.map(toDauid).filter(Boolean);
  if (!dauids.length) return [];

  const body = new URLSearchParams({
    api_key: apiKey,
    dataset: 'CA21',
    level: 'DA',
    regions: JSON.stringify({ DA: dauids }),
    vectors: JSON.stringify(VECTOR_LIST),
  });

  const res = await fetch(ENDPOINT, { method: 'POST', body });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`CensusMapper ${res.status}: ${text.slice(0, 200)}`);
  }

  const csv = await res.text();
  const rows = parseCsv(csv);
  if (rows.length < 2) return [];

  const header = rows[0];
  const dataRows = rows.slice(1);

  // Map header columns to vector IDs by extracting "v_CA21_NNN" from the column name.
  const colIndex = {};
  header.forEach((name, i) => {
    if (name === 'GeoUID') colIndex.geoUid = i;
    if (name.startsWith('Population')) colIndex.population = i;
    const m = name.match(/v_CA21_\d+/);
    if (m) colIndex[m[0]] = i;
  });

  return dataRows.map((cells) => {
    const dauid = String(cells[colIndex.geoUid]).trim();
    const dguid = `2021S0512${dauid}`;
    const n = (v) => numeric(cells[colIndex[v]]);

    const population = numeric(cells[colIndex.population]) || 0;
    const income = n(VECTORS.income);
    const tenureTotal = n(VECTORS.tenureTotal);
    const owner = n(VECTORS.owner);
    const structuralTotal = n(VECTORS.structuralTotal);
    const singleDetached = n(VECTORS.singleDetached);
    const ageTotal = n(VECTORS.ageTotal);
    const oldHomes = n(VECTORS.ageBefore1960) + n(VECTORS.age1961to1980);

    return {
      dguid,
      population,
      medianHouseholdIncome: income || 0,
      ownerOccupancyRate: tenureTotal ? owner / tenureTotal : 0,
      oldHomesRate: ageTotal ? oldHomes / ageTotal : 0,
      singleDetachedRate: structuralTotal ? singleDetached / structuralTotal : 0,
    };
  });
}

export function toDauid(dguid) {
  // DA DGUID format: 2021S0512XXXXXXXX  (last 8 chars = DAUID)
  if (typeof dguid !== 'string') return null;
  const m = dguid.match(/(\d{8})$/);
  return m ? m[1] : null;
}

export function numeric(v) {
  if (v == null || v === '' || v === 'x' || v === 'F') return 0;
  const n = Number(String(v).replace(/[,$\s"]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Minimal RFC-4180-ish CSV parser. Handles quoted fields with commas and
 * embedded "" escapes. Sufficient for CensusMapper's well-formed output.
 */
export function parseCsv(text) {
  const out = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cell += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); out.push(row); row = []; cell = ''; }
      else if (c === '\r') { /* skip */ }
      else { cell += c; }
    }
  }
  if (cell.length || row.length) { row.push(cell); out.push(row); }
  return out.filter((r) => r.length > 1);
}
