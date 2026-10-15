import procionLogo from "@/assets/procion-sistemas.png.asset.json";

export function ProcionBadge() {
  return (
    <a
      href="https://www.procion.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Prócion Sistemas — www.procion.com"
      title="Prócion Sistemas"
      className="absolute top-[68px] left-6 z-50 inline-flex items-center rounded-full bg-white/95 px-3 py-1 shadow-md ring-1 ring-black/5 transition hover:bg-white"

    >
      <img src={procionLogo.url} alt="Prócion Sistemas" width={486} height={125} className="h-9 w-auto" />
    </a>
  );
}
