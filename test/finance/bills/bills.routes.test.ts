import test from "node:test";
import assert from "node:assert/strict";
import {buildTestApp} from "../../helpers/app.js";
import { authHeader, loginAndGetToken } from "../../helpers/auth.js";
import { deleteTestBillsForUser, ensureTestBill } from "../../helpers/bills.js";
import { TEST_BILLS, TEST_USERS } from "../../helpers/fixtures.js";
import { deleteTestAccountsForUser, ensureTestAccount } from "../../helpers/accounts.js";


// GET /finance/bills

test("GET /finance/bills returns 401 without token", async() => {
    const app = await buildTestApp();

    try{
        const response = await app.inject({
            method: "GET",
            url: "/finance/bills"
        })

        assert.equal(response.statusCode, 401);
    }finally{
        await app.close();
    }
})

test("GET /finance/bills returns 200 for authenticated user", async() => {
    const app = await buildTestApp();

    try{
        await deleteTestBillsForUser(TEST_USERS.admin.email);
        await deleteTestBillsForUser(TEST_USERS.internal.email);

        await ensureTestBill("admin", "successMonthly");
        await ensureTestBill("internal", "successMonthly");

        const login = await loginAndGetToken(app, "admin");
        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "GET",
            url: "/finance/bills",
            headers: authHeader(login.token)
        });

        assert.equal(response.statusCode, 200);

        const body = response.json();
        assert.ok(Array.isArray(body.data));
        assert.equal(body.data.length, 1);
        assert.equal(body.data[0].name, TEST_BILLS.successMonthly.name);
    } finally {
        await app.close();
    }
})



// GET /finance/bills/:id

test("GET /finance/bills/:id returns 404 for another user's bill by id", async() => {
    const app = await buildTestApp();

    try{
        await deleteTestBillsForUser(TEST_USERS.admin.email);
        await deleteTestBillsForUser(TEST_USERS.internal.email);

        const bill = await ensureTestBill("admin", "successMonthly");

        if(!bill){
            throw new Error("Test bill setup failed");
        }

        const login = await loginAndGetToken(app, "internal");

        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "GET",
            url: `/finance/bills/${bill.id}`,
            headers: authHeader(login.token!)
        });

        assert.equal(response.statusCode, 404);
    } finally {
        await app.close();
    }
});

test("GET /finance/bills/:id returns 401 without token", async() => {
    const app = await buildTestApp();

    try{
        await deleteTestBillsForUser(TEST_USERS.admin.email);

        const bill = await ensureTestBill("admin", "successMonthly");

        if(!bill) {
            throw new Error("Test bill setup failed");
        }

        const response = await app.inject({
            method: "GET",
            url: `/finance/bills/${bill.id}`
        })
    } finally {
        await app.close();
    }
});

test("GET /finance/bills/:id returns 200 for authenticated user", async() => {
    const app = await buildTestApp();

    try{
        await deleteTestBillsForUser(TEST_USERS.admin.email);

        const bill = await ensureTestBill("admin", "successMonthly");

        if(!bill){
            throw new Error("Test bill setup failed");
        }

        const login = await loginAndGetToken(app, "admin");
        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "GET",
            url: `/finance/bills/${bill.id}`,
            headers: authHeader(login.token!)
        });

        assert.equal(response.statusCode, 200);

        const body = response.json();
        assert.equal(body.data.id, bill.id);
        assert.equal(body.data.name, bill.name);
        assert.equal(body.data.ownerUserId, bill.ownerUserId);
    } finally {
        await app.close();
    }
});

test("GET /finance/bills/:id returns 400 for invalid UUID", async() => {
    const app = await buildTestApp();

    try{
        const login = await loginAndGetToken(app, "admin");
        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "GET",
            url: "/finance/bills/not-a-uuid",
            headers: authHeader(login.token!)
        })

        assert.equal(response.statusCode, 400);
    } finally {
        await app.close();
    }
})


// POST /finance/bills

test ("POST /finance/bills creates a bill for the authenticated user", async () => {
    const app = await buildTestApp();

    try{
        await deleteTestBillsForUser(TEST_USERS.admin.email);

        const login = await loginAndGetToken(app, "admin");

        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "POST",
            url: "/finance/bills",
            headers: authHeader(login.token!),
            payload: TEST_BILLS.successMonthly
        })

        assert.equal(response.statusCode, 201);

        const body = response.json();
        assert.equal(body.data.name, TEST_BILLS.successMonthly.name);
        assert.equal(body.data.vendor, TEST_BILLS.successMonthly.vendor);
        assert.equal(body.data.amountDueCents, TEST_BILLS.successMonthly.amountDueCents);
        assert.ok(body.data.ownerUserId);
    }finally{
        await app.close();
    }
})

test("POST /finance/bills returns 409 for duplicated bill name for the same user", async() => {
    const app = await buildTestApp();

    try{
        await deleteTestBillsForUser(TEST_USERS.admin.email);
        await ensureTestBill("admin", "successMonthly")

        const login = await loginAndGetToken(app, "admin");
        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "POST",
            url: "/finance/bills",
            headers: authHeader(login.token!),
            payload: TEST_BILLS.successMonthly,
        })

        assert.equal(response.statusCode, 409);
    } finally {
        await app.close();
    }
})

test("POST /finance/bills returns 400 for one-time bill without dueDate", async() => {
    const app = await buildTestApp();

    try{
        await deleteTestBillsForUser(TEST_USERS.admin.email);

        const login =  await loginAndGetToken(app, "admin");

        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "POST",
            url: "/finance/bills",
            headers: authHeader(login.token!),
            payload: TEST_BILLS.oneTimeBillFail
        })

        assert.equal(response.statusCode, 400);

        const body = response.json();
        assert.equal(body.error, "One-time bills require a due date");

    }finally {
        await app.close();
    }
})

test("POST /finance/bills returns 400 for monthly bill without dueDayOfMonth", async() => {
    const app = await buildTestApp();

    try{
        await deleteTestBillsForUser(TEST_USERS.admin.email);

        const login =  await loginAndGetToken(app, "admin");

        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "POST",
            url: "/finance/bills",
            headers: authHeader(login.token!),
            payload: TEST_BILLS.monthlyBillFail
        })

        assert.equal(response.statusCode, 400);

        const body = response.json();
        assert.equal(body.error, "Monthly bills require a due day of month");

    }finally {
        await app.close();
    }
})

test("POST /finance/bills returns 400 for bill with linked account not owned by user", async() => {
    const app = await buildTestApp();

    try{
        await deleteTestAccountsForUser(TEST_USERS.admin.email);
        await deleteTestAccountsForUser(TEST_USERS.internal.email);

        const adminAccount = await ensureTestAccount("admin", "checking");

        if(!adminAccount){
            throw new Error("Admin account setup failed");
        }

        const login = await loginAndGetToken(app, "internal");
        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "POST",
            url: "/finance/bills",
            headers: authHeader(login.token!),
            payload: {
                name: "Netflix",
                vendor: "Netflix",
                accountId: adminAccount.id,
                amountDueCents: 1599,
                dueDayOfMonth: 15,
                frequency: "monthly",
            },
        });

        assert.equal(response.statusCode, 400);

        const body = response.json();
        assert.equal(body.error, "Linked account not found");
    } finally {
        await app.close();
    }
})

// PATCH /finance/bills/:id


// 4. PATCH /finance/bills/:id success → 200

// You want at least one happy-path update test.

// 5. PATCH /finance/bills/:id other user’s bill → 404

// Important ownership test for updates.

// 6. PATCH /finance/bills/:id linked foreign account → 400

// Important because create and update should both enforce that.