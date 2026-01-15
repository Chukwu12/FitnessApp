import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";

// public client config (SAFE for Expo)
export const config = {
  projectId: process.env.EXPO_PUBLIC_SANITY_PROJECT_ID || "cwx5k0kx",
  dataset: process.env.EXPO_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
};

export const client = createClient(config);

// ❌ DO NOT create adminClient in Expo (never ship write tokens in the app)
// export const adminClient = ...

// image url builder
const builder = createImageUrlBuilder(config);
export const urlFor = (source: any) => builder.image(source);
