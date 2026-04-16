import test from "node:test";
import assert from "node:assert/strict";
import {buildTestApp} from "../helpers/app.js";

test("POST /auth/login returns 401 for bad credentials", async () => {
    const app = await buildTestApp();

    try {
        const response = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: {
                email: "doesnotexist@example.com",
                password: "wrongpassword"
            }
        })

        assert.equal(response.statusCode, 401);
    }  finally {
        await app.close();
    }
});

test("GET /auth/me returns 401 without a token", async () => {
    const app = await buildTestApp();

    try {
        const response = await app.inject({
            method: "GET",
            url: "/auth/me"
        })

        assert.equal(response.statusCode, 401);
    } finally {
        await app.close();
    }
})

