import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { NextRequest } from 'next/server';
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
	trustedOrigins: [
		process.env.BETTER_AUTH_URL || "http://localhost:3000",
	],
	plugins: [bearer()],
	passwordReset: {
		sendPasswordResetEmail: async ({ user, url }, _request) => {
			// Для разработки просто выводим ссылку в консоль
			console.log("=".repeat(80));
			console.log("🔐 ССЫЛКА ДЛЯ ВОССТАНОВЛЕНИЯ ПАРОЛЯ");
			console.log("=".repeat(80));
			console.log("Пользователь:", user.email);
			console.log("Ссылка для восстановления:", url);
			console.log("=".repeat(80));
			
			// В продакшене здесь нужно отправить email через Resend/SendGrid
			// await resend.emails.send({
			//   from: "noreply@ldc.ru",
			//   to: user.email,
			//   subject: "Восстановление пароля",
			//   html: `<a href="${url}">Восстановить пароль</a>`,
			// });
		},
	},
});

// Session validation helper - fixed to include role from database
export async function getCurrentUser(request: NextRequest) {
  // Преобразуем NextRequest headers в обычный объект Headers
  const headersObj = new Headers();
  request.headers.forEach((value, key) => {
    headersObj.set(key, value);
  });
  
  const session = await auth.api.getSession({ 
    headers: headersObj
  });
  
  if (!session?.user) {
    return null;
  }
  
  // Получаем полные данные пользователя из базы, включая роль
  const [fullUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);
  
  if (!fullUser) {
    return null;
  }
  
  // Возвращаем пользователя с ролью
  return {
    ...session.user,
    role: fullUser.role,
    phone: fullUser.phone,
    organization: fullUser.organization,
    position: fullUser.position,
  };
}