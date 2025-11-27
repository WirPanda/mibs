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
         // First get the basic session from better-auth
         const res = await authClient.getSession({
            fetchOptions: {
               auth: {
                  type: "Bearer",
                  token: typeof window !== 'undefined' ? localStorage.getItem("bearer_token") || "" : "",
               },
            },
         });
         
         // If session exists, fetch full user data including role
         if (res.data?.user) {
            const token = typeof window !== 'undefined' ? localStorage.getItem("bearer_token") : null;
            if (token) {
               const userRes = await fetch('/api/user/me', {
                  headers: {
                     Authorization: `Bearer ${token}`,
                  },
               });
               
               if (userRes.ok) {
                  const userData = await userRes.json();
                  // Merge user data with session
                  setSession({
                     ...res.data,
                     user: {
                        ...res.data.user,
                        ...userData,
                     },
                  });
               } else {
                  setSession(res.data);
               }
            } else {
               setSession(res.data);
            }
         } else {
            setSession(null);
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