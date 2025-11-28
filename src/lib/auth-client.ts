"use client"
import { createAuthClient } from "better-auth/react"
import { useEffect, useState } from "react"

export const authClient = createAuthClient({
   baseURL: typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL,
  fetchOptions: {
      headers: {
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem("bearer_token") : ""}`,
      },
      onSuccess: (ctx) => {
          const authToken = ctx.response.headers.get("set-auth-token")
          // Store the token securely (e.g., in localStorage)
          if(authToken){
            // Split token at "." and take only the first part
            const tokenPart = authToken.includes('.') ? authToken.split('.')[0] : authToken;
            localStorage.setItem("bearer_token", tokenPart);
          }
      }
  }
});

type SessionData = ReturnType<typeof authClient.useSession>

export function useSession(): SessionData {
   const [session, setSession] = useState<any>(null);
   const [isPending, setIsPending] = useState(true);
   const [error, setError] = useState<any>(null);

   const refetch = () => {
      setIsPending(true);
      setError(null);
      fetchSession();
   };

   const fetchSession = async () => {
      try {
         const res = await authClient.getSession({
            fetchOptions: {
               auth: {
                  type: "Bearer",
                  token: typeof window !== 'undefined' ? localStorage.getItem("bearer_token") || "" : "",
               },
            },
         });
         
         // Если есть сессия, загружаем роль из API профиля
         if (res.data?.user) {
            try {
               const profileRes = await fetch('/api/user/profile', {
                  headers: {
                     'Authorization': `Bearer ${localStorage.getItem("bearer_token")}`,
                  },
               });
               
               if (profileRes.ok) {
                  const profileData = await profileRes.json();
                  // Добавляем роль и другие данные профиля в сессию
                  setSession({
                     ...res.data,
                     user: {
                        ...res.data.user,
                        role: profileData.role,
                        phone: profileData.phone,
                        gender: profileData.gender,
                        image: profileData.image,
                     }
                  });
               } else {
                  setSession(res.data);
               }
            } catch (profileErr) {
               console.error('Failed to fetch profile:', profileErr);
               setSession(res.data);
            }
         } else {
            setSession(res.data);
         }
         
         setError(null);
      } catch (err) {
         setSession(null);
         setError(err);
      } finally {
         setIsPending(false);
      }
   };

   useEffect(() => {
      fetchSession();
   }, []);

   return { data: session, isPending, error, refetch };
}