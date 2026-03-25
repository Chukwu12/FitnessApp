require("dotenv/config");
const { createClient } = require("@sanity/client");

const rawToken =
  process.env.SANITY_API_TOKEN ||
  process.env.SANITY_WRITE_TOKEN ||
  process.env.SANITY_TOKEN;

const normalizedToken = rawToken
  ? rawToken.trim().replace(/^['\"]|['\"]$/g, "")
  : undefined;

module.exports = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || "production",
  token: normalizedToken,
  apiVersion: "2024-01-01",
  useCdn: false,
});
