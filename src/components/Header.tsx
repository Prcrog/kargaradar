import { Link } from "@tanstack/react-router";
import { Truck } from "lucide-react";

export function Header({ dark = false }: { dark?: boolean }) {
  return (
    <header className={dark ? "absolute inset-x-0 top-0 z-10 text-navy-foreground" : "border-b bg-navy text-navy-foreground"}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Truck className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-extrabold leading-none tracking-tight">
            GUANABARA <span className="text-primary">PRIME</span>
            <span className="block text-[10px] font-semibold tracking-[0.25em] opacity-70">TRANSPORTES</span>
          </span>
        </Link>
        <Link to="/admin" className="text-sm font-medium opacity-80 hover:opacity-100">
          Área da transportadora
        </Link>
      </div>
    </header>
  );
}
