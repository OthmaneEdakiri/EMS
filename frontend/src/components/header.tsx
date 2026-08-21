"use client"

import { Link, usePathname, useRouter } from "@/i18n/navigation"
import { useTransition } from "react"
import { useTranslations } from "next-intl"
import {
  Receipt,
  Plus,
  UserCircle,
  User,
  Settings,
  LogOut,
  Languages,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { logoutAction } from "@/actions/auth"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const tNav = useTranslations('navbar');
  const tHeader = useTranslations('header');

  const navItems = [
  { href: "/invoices", label: tNav("invoices") },
  { href: "/customers", label: tNav("customers") },
  { href: "/products", label: tNav("products-services") },
]


  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction()
      router.push("/login")
    })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Receipt className="size-5" />
          EMS
        </Link>
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  pathname.startsWith(item.href)
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/invoices/create"
              className={cn(buttonVariants({ variant: "default" }), "gap-1.5")}
            >
              <Plus className="size-4" />
              {tNav("create-invoices")}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "size-8 rounded-full p-0",
                )}
              >
                <UserCircle className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                >
                  <User className="size-4" />
                  {tHeader('profile')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/settings/team")}
                >
                  <Settings className="size-4" />
                  {tHeader('teamSettings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isPending}
                >
                  <LogOut className="size-4" />
                  {tHeader('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
