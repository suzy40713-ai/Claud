import postgres from "postgres";

/**
 * Crée un client PostgreSQL configuré pour BookSync.
 * - `prepare: false` : compatible avec le pooler de Supabase (mode transaction).
 * - `search_path` inclut `extensions`, où Supabase installe les extensions (btree_gist…).
 * - Dates renvoyées en UTC ; les fuseaux horaires sont gérés explicitement dans le domaine.
 */
export function createSql(url: string, options: { max?: number } = {}) {
  return postgres(url, {
    max: options.max ?? 10,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
    connection: { search_path: "public, extensions", TimeZone: "UTC" },
    onnotice: () => {},
  });
}
