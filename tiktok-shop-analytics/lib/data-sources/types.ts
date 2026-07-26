/**
 * Abstraction layer for ingesting store data, whatever the origin.
 *
 * Étape 3 ships a `CsvDataSource` (manual upload). Once the TikTok Shop
 * Partner API access is approved, a `TikTokShopApiDataSource` can implement
 * the same interface and be swapped in without touching the import
 * pipeline, the DB writes, or the dashboard.
 *
 * Row shapes are refined in Étape 2/3 once the Supabase schema (and its
 * generated types) exist; for now each entity maps to a plain record.
 */
export type ImportableEntity =
  | "orders"
  | "returns"
  | "ad_spend"
  | "platform_fees";

export interface FetchParams {
  storeId: string;
  /** Inclusive start of the period to fetch, ISO date. */
  since?: string;
  /** Inclusive end of the period to fetch, ISO date. */
  until?: string;
}

export interface DataSourceResult<Row = Record<string, unknown>> {
  entity: ImportableEntity;
  rows: Row[];
  /** Opaque cursor for sources that paginate (API-based sources). */
  nextCursor?: string;
}

/**
 * A DataSource knows how to produce normalized rows for one entity type,
 * regardless of whether they came from a CSV upload or a remote API.
 */
export interface DataSource {
  readonly id: string;
  readonly label: string;
  fetch(entity: ImportableEntity, params: FetchParams): Promise<DataSourceResult>;
}
