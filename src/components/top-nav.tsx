import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "./theme-provider";

export default function TopNav() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b">
      <div className="container mx-auto py-4 px-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">
          AI自动辩论软件
        </Link>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
            <span className="sr-only">切换主题</span>
          </Button>
        </div>
      </div>
    </header>
  );
}