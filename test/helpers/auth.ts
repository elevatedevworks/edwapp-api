import type {FastifyInstance} from "fastify";
import { TEST_USERS } from "./fixtures";
import { ensureTestUser } from "./users";

export async function loginAndGetToken(
    app:FastifyInstance,
    userKey: keyof typeof TEST_USERS
) {
    const testUser = TEST_USERS[userKey];

    await ensureTestUser(userKey);

    const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {
            email: testUser.email,
            password: testUser.password
        }
    })

    const body = response.json();

    return {
        statusCode: response.statusCode,
        body,
        token: body?.data?.token as string | undefined
    };
}

export function authHeader(token: string) {
    return {
        authorization: `Bearer ${token}`
    }
}

export async function getAdminToken(app: FastifyInstance) {
  const login = await loginAndGetToken(app, "admin");

  if (!login.token) {
    throw new Error("Failed to get admin token");
  }

  return login.token;
}