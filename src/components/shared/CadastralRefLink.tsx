import { useState } from 'react';

interface Props {
  refCat: string;
  label?: string;       // defaults to "Ref. cat.: {refCat}"
  className?: string;
}

const CATASTRO_SEARCH = 'https://www1.sedecatastro.gob.es/Cartografia/mapa.aspx?buscar=S';

export default function CadastralRefLink({ refCat, label, className }: Props) {
  const [copied, setCopied] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(refCat);
    setCopied(true);
    setTimeout(() => window.open(CATASTRO_SEARCH, '_blank', 'noreferrer'), 1000);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <span className="relative inline-flex items-center">
      <button
        onClick={handleClick}
        title={`Copiar "${refCat}" y abrir buscador Catastro`}
        className={className ?? 'text-[#1a61a6] hover:underline cursor-pointer'}
      >
        {label ?? `Ref. cat.: ${refCat}`}
      </button>
      {copied && (
        <span className="absolute bottom-full left-0 mb-1 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-[9999] pointer-events-none">
          ✓ Copiado al portapapeles
        </span>
      )}
    </span>
  );
}
