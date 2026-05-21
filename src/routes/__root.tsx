import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-md w-full border-none shadow-2xl text-center overflow-hidden">
        <div className="h-2 bg-slate-900 w-full" />
        <CardContent className="py-12 space-y-6">
          <div className="text-8xl font-black text-slate-100 absolute inset-x-0 top-10 pointer-events-none select-none">404</div>
          <div className="relative space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Không tìm thấy trang</h2>
            <p className="text-slate-500 font-medium px-8">
              Đường dẫn bạn đang truy cập không tồn tại hoặc đã bị di chuyển.
            </p>
          </div>
          <Button asChild className="bg-slate-900 hover:bg-indigo-600 text-white rounded-xl h-12 px-8 font-bold transition-all relative z-10">
            <Link to="/">Quay về trang chủ</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-md w-full border-none shadow-2xl text-center overflow-hidden">
        <div className="h-2 bg-red-600 w-full" />
        <CardContent className="py-12 space-y-6">
          <div className="p-4 bg-red-50 text-red-600 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Đã có lỗi xảy ra</h1>
            <p className="text-slate-500 font-medium px-8">
              Hệ thống gặp sự cố không mong muốn. Vui lòng thử tải lại trang.
            </p>
          </div>
          <div className="flex flex-col gap-2 px-8 pt-2">
            <Button
              onClick={() => {
                router.invalidate();
                reset();
              }}
              className="bg-slate-900 hover:bg-indigo-600 text-white rounded-xl h-12 font-bold transition-all"
            >
              Thử lại ngay
            </Button>
            <Button asChild variant="ghost" className="text-slate-400 font-bold h-12">
              <Link to="/">Về trang chủ</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ôn tập cốp pha năm 1" },
      { name: "description", content: "JLPT Ace is a website for practicing Japanese language proficiency tests with interactive quizzes." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Ôn tập cốp pha năm 1" },
      { property: "og:description", content: "JLPT Ace is a website for practicing Japanese language proficiency tests with interactive quizzes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Ôn tập cốp pha năm 1" },
      { name: "twitter:description", content: "JLPT Ace is a website for practicing Japanese language proficiency tests with interactive quizzes." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/878763b8-7280-47d7-9979-ec55b1940a47/id-preview-be1b8938--25ab887b-5d8c-41a4-9d72-8119d839cfa1.lovable.app-1779289542633.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/878763b8-7280-47d7-9979-ec55b1940a47/id-preview-be1b8938--25ab887b-5d8c-41a4-9d72-8119d839cfa1.lovable.app-1779289542633.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
