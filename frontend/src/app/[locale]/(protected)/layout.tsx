import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import { getProfileAction } from "@/actions/auth";

export default async function RootAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profileData = await getProfileAction();

  return (
    <div className="min-h-screen flex flex-col">
      <Providers user={profileData?.user ?? null}>
        {children}
      </Providers>
    </div>
  );
}