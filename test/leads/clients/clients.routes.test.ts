import test from "node:test";
import assert from "node:assert/strict";
import {buildTestApp} from "../../helpers/app";
import {authHeader, loginAndGetToken} from "../../helpers/auth";

test("GET /clients returns 401 without token", async () => {
    const app = await buildTestApp();

    try {
        const response = await app.inject({
            method: "GET",
            url: "/leads/clients"
        })

        assert.equal(response.statusCode, 401)
    } finally {
        await app.close();
    }
})

test("GET /clients returns 200 with valid token", async () => {
    const app = await buildTestApp();

    try{
        const login = await loginAndGetToken(app, "admin");

        assert.equal(login.statusCode, 200);
        assert.ok(login.token);

        const response = await app.inject({
            method: "GET",
            url: "/leads/clients",
            headers: authHeader(login.token!)
        })

        assert.equal(response.statusCode, 200);
    } finally {
        await app.close();
    }
})