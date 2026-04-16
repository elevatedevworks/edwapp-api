import test from "node:test";
import assert from "node:assert/strict";
import {buildTestApp} from "../helpers/app.js";
import {authHeader, loginAndGetToken} from "../helpers/auth.js";

test("GET /users returns 401 without token", async () => {
    const app = await buildTestApp();

    try{
        const response = await app.inject({
            method: "GET",
            url: "/users"
        })
        
        assert.equal(response.statusCode, 401);
    } finally {
        await app.close();
    }
})

test("GET /users returns 200 for admin token", async () => {
    const app = await buildTestApp();

    try{
        const login = await loginAndGetToken(app, "admin");

        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "GET",
            url: "/users",
            headers: authHeader(login.token!)
        })

        assert.equal(response.statusCode, 200);
    } finally {
        await app.close();
    }
})

test("GET /users returns 403 for internal user", async () => {
    const app = await buildTestApp();

    try{
        const login = await loginAndGetToken(app, "internal");

        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "GET",
            url: "/users",
            headers: authHeader(login.token!)
        })

        assert.equal(response.statusCode, 403);
    } finally {
        await app.close();
    }
})

test("GET /users returns 401 without token", async () => {
    const app = await buildTestApp();

    try{
        const response = await app.inject({
            method: "GET",
            url: "/users",
        });

        assert.equal(response.statusCode, 401);
    } finally {
        await app.close();
    }
})