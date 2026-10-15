import procionLogo from "@/assets/procion-sistemas.png.asset.json";

export function ProcionBadge() {
  return (
    <a
      href="https://www.procion.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Prócion Sistemas — www.procion.com"
      title="Prócion Sistemas"
      className="absolute bottom-[180px] right-4 z-50 inline-flex items-center rounded-full bg-white/95 px-4 py-2 shadow-lg ring-1 ring-black/5 transition hover:bg-white hover:shadow-xl"


    >
      <img src={procionLogo.url} alt="Prócion Sistemas" width={486} height={125} className="h-9 w-auto" />
    </a>
  );
}
