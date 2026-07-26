export type ImportEntityKey = "orders" | "returns" | "ad_spend" | "platform_fees";

export type ImportFieldType = "text" | "number" | "date" | "enum";

export interface ImportFieldDef {
  key: string;
  label: string;
  required: boolean;
  type: ImportFieldType;
  enumValues?: readonly string[];
  defaultValue?: string;
  helpText?: string;
}

export interface ImportEntityDef {
  label: string;
  description: string;
  fields: ImportFieldDef[];
}

export const ORDER_STATUS_VALUES = [
  "pending",
  "completed",
  "cancelled",
  "refunded",
] as const;

export const PLATFORM_FEE_TYPE_VALUES = [
  "commission",
  "transaction_fee",
  "shipping_fee",
  "other",
] as const;

export const IMPORT_ENTITIES: Record<ImportEntityKey, ImportEntityDef> = {
  orders: {
    label: "Commandes",
    description:
      "Une ligne par commande. Le SKU sert à retrouver le produit dans votre catalogue.",
    fields: [
      { key: "sku", label: "SKU produit", required: true, type: "text" },
      {
        key: "product_name",
        label: "Nom du produit",
        required: false,
        type: "text",
        helpText:
          "Utilisé uniquement pour créer le produit automatiquement si le SKU est inconnu.",
      },
      {
        key: "cost_price",
        label: "Coût de revient unitaire",
        required: false,
        type: "number",
        helpText:
          "Utilisé uniquement pour créer le produit automatiquement si le SKU est inconnu.",
      },
      {
        key: "external_order_id",
        label: "N° de commande TikTok",
        required: false,
        type: "text",
        helpText: "Nécessaire si vous importerez des retours pour cette commande.",
      },
      {
        key: "quantity",
        label: "Quantité",
        required: false,
        type: "number",
        defaultValue: "1",
      },
      {
        key: "unit_sale_price",
        label: "Prix de vente unitaire",
        required: true,
        type: "number",
      },
      { key: "order_date", label: "Date de commande", required: true, type: "date" },
      {
        key: "status",
        label: "Statut",
        required: false,
        type: "enum",
        enumValues: ORDER_STATUS_VALUES,
        defaultValue: "completed",
      },
    ],
  },
  returns: {
    label: "Retours",
    description:
      "Une ligne par retour, rattachée à une commande via son n° de commande TikTok.",
    fields: [
      {
        key: "external_order_id",
        label: "N° de commande TikTok",
        required: true,
        type: "text",
        helpText: "Doit correspondre à une commande déjà importée.",
      },
      { key: "return_date", label: "Date du retour", required: true, type: "date" },
      { key: "reason", label: "Raison", required: false, type: "text" },
      {
        key: "refunded_amount",
        label: "Montant remboursé",
        required: true,
        type: "number",
      },
    ],
  },
  ad_spend: {
    label: "Dépenses publicitaires",
    description: "Une ligne par campagne et par période.",
    fields: [
      { key: "campaign_name", label: "Nom de la campagne", required: true, type: "text" },
      {
        key: "sku",
        label: "SKU produit",
        required: false,
        type: "text",
        helpText: "Optionnel : lie la dépense à un produit existant.",
      },
      {
        key: "platform",
        label: "Plateforme",
        required: false,
        type: "text",
        defaultValue: "tiktok_ads",
      },
      { key: "amount", label: "Montant dépensé", required: true, type: "number" },
      { key: "period_start", label: "Début de période", required: true, type: "date" },
      { key: "period_end", label: "Fin de période", required: true, type: "date" },
    ],
  },
  platform_fees: {
    label: "Frais de plateforme",
    description:
      "Une ligne par frais, rattaché soit à une commande, soit à une période.",
    fields: [
      {
        key: "external_order_id",
        label: "N° de commande TikTok",
        required: false,
        type: "text",
      },
      {
        key: "fee_type",
        label: "Type de frais",
        required: true,
        type: "enum",
        enumValues: PLATFORM_FEE_TYPE_VALUES,
      },
      { key: "amount", label: "Montant", required: true, type: "number" },
      {
        key: "period_start",
        label: "Début de période",
        required: false,
        type: "date",
        helpText: "Requis si aucun n° de commande n'est fourni.",
      },
      {
        key: "period_end",
        label: "Fin de période",
        required: false,
        type: "date",
        helpText: "Requis si aucun n° de commande n'est fourni.",
      },
    ],
  },
};
