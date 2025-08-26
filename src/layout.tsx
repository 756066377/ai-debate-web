import { Outlet } from "react-router-dom";
import TopNav from "./components/top-nav";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <main className="flex-1 container mx-auto py-6 px-4">
        <Outlet />
      </main>
      <footer className="py-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          AI自动辩论软件 &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}