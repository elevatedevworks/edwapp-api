import test from "node:test";
import assert from "node:assert/strict";
import {buildTestApp} from "../../helpers/app.js";
import {authHeader, loginAndGetToken} from "../../helpers/auth.js";
import { TEST_ACCOUNTS, TEST_USERS } from "../../helpers/fixtures.js";
import { deleteTestAccountsForUser, ensureTestAccount } from "../../helpers/accounts.js";


// GET /finance/accounts

test("GET /finance/accounts returns 401 without token", async () => {
    const app = await buildTestApp();

    try{
        const response = await app.inject({
            method: "GET",
            url: "/finance/accounts"
        })

        assert.equal(response.statusCode, 401);
    } finally {
        await app.close();
    }
});

test("GET /finance/accounts returns only the authenticated user's accounts", async() => {
    const app = await buildTestApp();

    try{
        await deleteTestAccountsForUser(TEST_USERS.admin.email);
        await deleteTestAccountsForUser(TEST_USERS.internal.email);

        await ensureTestAccount("admin", "checking");
        await ensureTestAccount("internal", "savings");

        const login = await loginAndGetToken(app, "admin");
        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "GET",
            url: "/finance/accounts",
            headers: authHeader(login.token!)
        });

        assert.equal(response.statusCode, 200);

        const body = response.json();
        assert.ok(Array.isArray(body.data));
        assert.equal(body.data.length, 1);
        assert.equal(body.data[0].name, TEST_ACCOUNTS.checking.name);
    } finally {
        await app.close();
    }
});


// GET /finance/accounts/:id

test("GET /finance/accounts/:id returns 401 without token", async() => {
    const app = await buildTestApp();

    try{
        const account = await ensureTestAccount("admin", "checking");

        if (!account) {
            throw new Error("Test account setup failed");
        }

        const response = await app.inject({
            method: "GET",
            url: `/finance/accounts/${account.id}`
        });

        assert.equal(response.statusCode, 401);
    } finally {
        await app.close();
    }
})

test("GET /finance/accounts/:id returns 200 for the owning user", async () => {
    const app = await buildTestApp();

    try{
        await deleteTestAccountsForUser(TEST_USERS.admin.email);

        const account = await ensureTestAccount("admin", "checking");
        
        if(!account){
            throw new Error("Test account setup failed");
        }

        const login = await loginAndGetToken(app, "admin");
        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "GET",
            url: `/finance/accounts/${account.id}`,
            headers: authHeader(login.token!)
        });

        assert.equal(response.statusCode, 200);

        const body = response.json();
        assert.equal(body.data.id, account.id);
        assert.equal(body.data.name, "Checking");
        assert.equal(body.data.ownerUserId, account.ownerUserId);
    } finally {
        await app.close();
    }
})

test("GET /finance/accounts/:id returns 404 for a different authenticated user", async() => {
    const app = await buildTestApp();

    try{
        await deleteTestAccountsForUser(TEST_USERS.admin.email);
        await deleteTestAccountsForUser(TEST_USERS.internal.email);

        const account = await ensureTestAccount("admin", "checking");

        if(!account){
            throw new Error("Test account setup failed");
        }

        const login = await loginAndGetToken(app, "internal");
        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "GET",
            url: `/finance/accounts/${account.id}`,
            headers: authHeader(login.token!),
        })

        assert.equal(response.statusCode, 404);
    } finally {
        await app.close();
    }
})

test("GET /finance/accounts/:id returns 400 for invalid account id", async() => {
    const app = await buildTestApp();

    try{
        const login = await loginAndGetToken(app, "admin");
        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "GET",
            url: "/finance/accounts/not-a-uuid",
            headers: authHeader(login.token!),
        });

        assert.equal(response.statusCode, 400);
    }finally{
        await app.close();
    }
})


// POST /finance/bills

test("POST /finance/accounts creates an account for the authenticated user", async () => {
    const app = await buildTestApp();

    try{
        await deleteTestAccountsForUser(TEST_USERS.admin.email);

        const login = await loginAndGetToken(app, "admin");

        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "POST",
            url: "/finance/accounts",
            headers: authHeader(login.token!),
            payload: TEST_ACCOUNTS.checking
        })

        assert.equal(response.statusCode, 201);

        const body = response.json();
        assert.equal(body.data.name, TEST_ACCOUNTS.checking.name);
        assert.equal(body.data.type, TEST_ACCOUNTS.checking.type);
        assert.equal(
            body.data.currentBalanceCents,
            TEST_ACCOUNTS.checking.currentBalanceCents
        )
        assert.ok(body.data.ownerUserId);
    } finally {
        await app.close();
    }
});



test("POST /finance/accounts returns 409 for duplicate account name for the same user", async() => {
    const app = await buildTestApp();

    try{
        await deleteTestAccountsForUser(TEST_USERS.admin.email);
        await ensureTestAccount("admin", "checking");

        const login = await loginAndGetToken(app, "admin");
        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "POST",
            url: "/finance/accounts",
            headers: authHeader(login.token!),
            payload: TEST_ACCOUNTS.checking,
        });

        assert.equal(response.statusCode, 409);
    } finally {
        await app.close();  
    }       
})



//1. Same account name for different users is allowed -> 201


// PATCH /finance/accounts/:id

//2. patch own account works -> 200
//3. patch other user's account -> 404
