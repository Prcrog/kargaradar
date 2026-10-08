import { Link } from "@tanstack/react-router";
import { Radar } from "lucide-react";

export function Header({ dark = false }: { dark?: boolean }) {
  return (
    <header className={dark ? "absolute inset-x-0 top-0 z-10 text-navy-foreground" : "border-b bg-navy text-navy-foreground"}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Radar className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-extrabold leading-none tracking-tight">
            Karga<span className="text-primary">Radar</span>
          </span>
        </Link>
        <Link to="/admin" className="text-sm font-medium opacity-80 hover:opacity-100">
          Área da transportadora
        </Link>
      </div>
    </header>
  );
}
