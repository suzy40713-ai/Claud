import { Platform } from "react-native";
import Purchases, { type PurchasesOffering } from "react-native-purchases";

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

let configured = false;

export function isRevenueCatConfigured() {
  return Boolean(API_KEY);
}

export function configurePurchases(appUserId: string) {
  if (!API_KEY || configured) return;
  Purchases.configure({ apiKey: API_KEY, appUserID: appUserId });
  configured = true;
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!isRevenueCatConfigured()) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(packageIdentifier: string, offering: PurchasesOffering) {
  const pkg = offering.availablePackages.find((p) => p.identifier === packageIdentifier);
  if (!pkg) {
    throw new Error("Offre introuvable");
  }
  return Purchases.purchasePackage(pkg);
}

export function restorePurchases() {
  return Purchases.restorePurchases();
}
