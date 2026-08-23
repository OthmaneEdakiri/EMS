"use client";

import { UserProvider, type User } from "@/contexts/user-context";

export function Providers({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  return <UserProvider initialUser={user}>{children}</UserProvider>;
}
