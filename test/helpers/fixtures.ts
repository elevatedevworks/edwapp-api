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

export const TEST_ACCOUNTS = {
  checking: {
    name: "Checking",
    type: "checking" as const,
    institution: "Chase",
    currentBalanceCents: 125000,
    isActive: true,
    notes: "Main checking account",
  },
  savings: {
    name: "Savings",
    type: "savings" as const,
    institution: "Capital One",
    currentBalanceCents: 500000,
    isActive: true,
    notes: "Emergency fund",
  },
};

type TestBillFixture = {
  name: string;
  vendor: string | null;
  amountDueCents: number;
  accountId: string | null;
  dueDate: string | null;
  dueDayOfMonth: number | null;
  frequency: "one_time" | "weekly" | "monthly" | "quarterly" | "annual";
  status: "active" | "paused" | "paid" | "archived";
  autopay: boolean;
  notes: string | null;
  isActive: boolean;
};

export const TEST_BILLS: Record<string, TestBillFixture> = {
  successMonthly: {
    name: "Bill - Montly - Success",
    vendor: "Acme 1",
    accountId: null,
    amountDueCents: 10000,
    dueDate: null,
    dueDayOfMonth: 1,
    frequency: "monthly" as const,
    status: "active" as const,
    autopay: false,
    notes: "Bill Test - Monthly bill",
    isActive: true,
  },
  oneTimeBillFail: {
    name: "Bill - One-Time - Fail",
    vendor: "Acme 1",
    accountId: null,
    amountDueCents: 10000,
    dueDate: null,
    dueDayOfMonth: null,
    frequency: "one_time" as const,
    status: "active" as const,
    autopay: false,
    notes: "Bill Test - One-Time - Fail",
    isActive: true,
  },
  monthlyBillFail: {
    name: "Bill - Monthly - Fail",
    vendor: "Acme 1",
    accountId: null,
    amountDueCents: 10000,
    dueDate: null,
    dueDayOfMonth: null,
    frequency: "monthly" as const,
    status: "active" as const,
    autopay: false,
    notes: "Bill Test - Monthly - Fail",
    isActive: true,
  }
}

export const TEST_PAYMENTS = {
success: {
        accountId: "7bcc4660-e590-4f09-a82b-525c0d77df50",
        billId: "700bc6f9-53c0-4c7f-bdc2-7b3ee3a1b70e",
        amountCents: 500,
        paymentDate: "2026-04-24",
        direction: "outflow",
        method: "cash",
        reference: "Test reference",
        notes: "Test notes"
  }
}

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