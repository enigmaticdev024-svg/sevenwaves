import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { adminUsers } from '@/db/schema'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  // JWT sessions — the only account is the seeded admin, so there is no need
  // for a database session store.
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 },
  pages: { signIn: '/admin/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null

        const user = await db.query.adminUsers.findFirst({
          where: eq(adminUsers.email, parsed.data.email.toLowerCase().trim()),
        })
        // Compare even when the user is missing so a bad email and a bad
        // password take the same amount of time.
        const hash =
          user?.passwordHash ??
          '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin'
        const ok = await bcrypt.compare(parsed.data.password, hash)
        if (!user || !ok) return null

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.uid = user.id
      return token
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string
      return session
    },
  },
})
