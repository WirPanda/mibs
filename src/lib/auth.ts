import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { NextRequest } from 'next/server';
import { headers } from "next/headers"
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
 
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
	}),
	emailAndPassword: {    
		enabled: true
	},
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: true,
				defaultValue: "user",
				input: false,
			}
		}
	},
	plugins: [bearer()]
});

// Session validation helper with role from database
export async function getCurrentUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    return null;
  }
  
  // Получаем роль из базы данных, так как better-auth не возвращает кастомные поля
  const userFromDb = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  
  if (userFromDb.length === 0) {
    return null;
  }
  
  return {
    ...session.user,
    role: userFromDb[0].role
  };
}