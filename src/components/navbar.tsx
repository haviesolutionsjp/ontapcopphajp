"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, GraduationCap, Home, Sparkles, LogIn, LogOut, History, User as UserIcon, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, loginWithGoogle, logout } = useAuth();

  const navItems = [
    { href: "/", label: "Trang chủ", icon: Home },
    ...(isAdmin ? [{ href: "/dashboard", label: "Thêm đề thi (Dashboard)", icon: Server, isAdminOnly: true }] : []),
    { href: "/vocab", label: "Từ vựng (143)", icon: BookOpen },
    { href: "/vocab-quiz", label: "Luyện từ vựng", icon: Sparkles },
    ...(user ? [{ href: "/history", label: "Lịch sử thi", icon: History }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 h-16 sm:px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                Cốp Pha Japan
              </span>
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 hidden sm:inline-flex text-[10px] py-0 px-2 font-bold">
                Năm 1
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-none">Ôn thi chuyển giai đoạn型枠</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isAdminBadge = (item as any).isAdminOnly;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? isAdminBadge
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                      : "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                    : isAdminBadge
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : isAdminBadge ? "text-emerald-600" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* User Auth Section */}
          <div className="ml-2 pl-2 border-l border-slate-200">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className={`h-9 w-9 border ${isAdmin ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-indigo-200"}`}>
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold leading-none">{user.displayName || "Thực tập sinh"}</p>
                        {isAdmin && (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0 font-bold border border-emerald-200">
                            👑 Admin Root
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs leading-none text-slate-500 truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer font-bold text-emerald-700 bg-emerald-50 focus:bg-emerald-100">
                        <Server className="mr-2 h-4 w-4 text-emerald-600" />
                        <span>Thêm đề thi mới (Dashboard)</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/history" className="cursor-pointer">
                      <History className="mr-2 h-4 w-4 text-indigo-600" />
                      <span>Lịch sử thi của tôi</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={loginWithGoogle}
                size="sm"
                className="bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs px-3 sm:px-4 py-2 shadow-sm transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Đăng nhập</span>
              </Button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
