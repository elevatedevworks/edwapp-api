import test from "node:test";
import assert from "node:assert/strict";
import {buildTestApp} from "../../helpers/app.js";
import { authHeader, loginAndGetToken } from "../../helpers/auth.js";
import { deleteTestBillsForUser, ensureTestBill } from "../../helpers/bills.js";
import { TEST_BILLS, TEST_USERS } from "../../helpers/fixtures.js";
import { deleteTestAccountsForUser, ensureTestAccount } from "../../helpers/accounts.js";
import { deleteTestPaymentForUser, ensureTestPaymentScenario } from "../../helpers/payments.js";
import { loginSchema } from "../../../src/modules/core/auth/auth.schema.js";


// GET /finance/payments

test("GET /finance/payments returns 401 without token", async() => {
    const app = await buildTestApp();

    try{
        const response = await app.inject({
            method: "GET",
            url: "/finance/payments"
        })

        assert.equal(response.statusCode, 401);
    }finally{
        await app.close();
    }
})


// GET /finance/bills/:id

test("GET /finance/payments/:id returns 200 for authenticated user", async() => {
    const app = await buildTestApp();

    try{
        await deleteTestPaymentForUser(TEST_USERS.admin.email);

        const payment = await ensureTestPaymentScenario("admin");

        if(!payment){
            throw new Error("Test payment setup failed")
        }

        const login = await loginAndGetToken(app, "admin");
        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "GET",
            url: `/finance/payments/${payment.payment.id}`,
            headers: authHeader(login.token)
        });

        assert.equal(response.statusCode, 200);

        const body = response.json();
        assert.equal(body.data.id, payment.payment.id);
        assert.equal(body.data.ownerUserId, payment.payment.ownerUserId);
        assert.equal(body.data.accountId, payment.payment.accountId);
    } finally {
        await app.close();
    }
})

test("GET /finance/payments/:id returns 404 for another user's payment by id", async() => {
    const app = await buildTestApp();

    try{
        await deleteTestPaymentForUser(TEST_USERS.admin.email);
        await deleteTestPaymentForUser(TEST_USERS.internal.email);

        const payment = await ensureTestPaymentScenario("admin");

        if(!payment){
            throw new Error("Test payment setup failed");
        }

        const login = await loginAndGetToken(app, "internal");

        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "GET",
            url: `/finance/payments/${payment.payment.id}`,
            headers: authHeader(login.token!)
        });

        assert.equal(response.statusCode, 404);
    } finally {
        await app.close();
    }
})

// test("GET /finance/payments/:id returns 404 for another user's bill by id", async() => {
//     const app = await buildTestApp();

//     try{
//         await deleteTestBillsForUser(TEST_USERS.admin.email);
//         await deleteTestBillsForUser(TEST_USERS.internal.email);

//         const bill = await ensureTestBill("admin", "successMonthly");

//         if(!bill){
//             throw new Error("Test bill setup failed");
//         }

//         const login = await loginAndGetToken(app, "internal");

//         assert.equal(login.statusCode, 200);
//         assert.ok(login.token);

//         const response = await app.inject({
//             method: "GET",
//             url: `/finance/bills/${bill.id}`,
//             headers: authHeader(login.token!)
//         });

//         assert.equal(response.statusCode, 404);
//     } finally {
//         await app.close();
//     }
// });

test("GET /finance/payments/:id returns 401 without token", async() => {
    const app = await buildTestApp();

    try{
        await deleteTestPaymentForUser(TEST_USERS.admin.email);

        const payment = await ensureTestPaymentScenario("admin");

        if(!payment) {
            throw new Error("Test bill setup failed");
        }

        const response = await app.inject({
            method: "GET",
            url: `/finance/payments/${payment.payment.id}`
        })

        assert.equal(response.statusCode, 401);
    } finally {
        await app.close();
    }
});

test("GET /finance/payments/:id returns 400 for invalid UUID", async() => {
    const app = await buildTestApp();

    try{
        const login = await loginAndGetToken(app, "admin");
        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "GET",
            url: "/finance/payments/not-a-uuid",
            headers: authHeader(login.token!)
        })

        assert.equal(response.statusCode, 400);
    } finally {
        await app.close();
    }
})

// other user cannot fetch payment → 404
// POST /finance/payments creates payment → 201
// linked foreign account → 400
// linked foreign bill → 400
// creating payment updates account balance correctly