import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";

// public client config
export const config = {
  projectId: "cwx5k0kx",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
};

export const client = createClient(config);

// admin client (mutations only)
const adminConfig = {
  ...config,
  token: process.env.EXPO_SANITY_API_TOKEN,
};

export const adminClient = createClient(adminConfig);

// image url builder
const builder = createImageUrlBuilder(config);
export const urlFor = (source: any) => builder.image(source);
