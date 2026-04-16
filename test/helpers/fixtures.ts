export const TEST_USERS = {
  admin: {
    email: "test-admin@edwapp.local",
    password: "TestAdmin123!",
    name: "Test Admin",
    role: "admin" as const,
    isActive: true,
  },
  internal: {
    email: "test-internal@edwapp.local",
    password: "TestInternal123!",
    name: "Test Internal",
    role: "internal" as const,
    isActive: true,
  },
  client: {
    email: "test-client@edwapp.local",
    password: "TestClient123!",
    name: "Test Client",
    role: "client" as const,
    isActive: true,
  },
};

export const TEST_CLIENTS = {
  primary: {
    name: "Acme Test Client",
    slug: "acme-test-client",
    companyType: "accounting",
    primaryContactName: "Alice Example",
    primaryContactEmail: "alice@example.com",
    primaryContactPhone: "555-111-2222",
    websiteUrl: "https://example.com",
    status: "active" as const,
    notes: "Seeded test client",
  },
  secondary: {
    name: "Beta Test Client",
    slug: "beta-test-client",
    companyType: "internal",
    primaryContactName: "Bob Example",
    primaryContactEmail: "bob@example.com",
    primaryContactPhone: "555-333-4444",
    websiteUrl: "https://beta.example.com",
    status: "lead" as const,
    notes: "Secondary seeded test client",
  },
};

export const INVALID_PAYLOADS = {
  userMissingPassword: {
    email: "broken@example.com",
    name: "Broken User",
    role: "internal" as const,
  },
  clientMissingName: {
    slug: "missing-name-client",
  },
  clientInvalidSlug: {
    name: "Bad Slug Client",
    slug: "Bad Slug Client",
  },
};