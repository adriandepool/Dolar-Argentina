import React from 'react';
import { Heart, Github, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-[#070b13] py-10 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Info y créditos */}
        <div className="text-center md:text-left space-y-1">
          <p className="flex items-center justify-center md:justify-start gap-1 text-slate-300 font-medium">
            Desarrollado con <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> por{' '}
            <a
              href="https://github.com/adriandepool"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 transition-colors"
            >
              Adrián Reyes
            </a>
          </p>
          <p className="text-slate-500 text-[11px]">
            Fuentes de datos:{' '}
            <a
              href="https://dolarapi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-cyan-400 inline-flex items-center gap-0.5"
            >
              DolarAPI <ExternalLink className="w-2.5 h-2.5" />
            </a>{' '}
            y{' '}
            <a
              href="https://www.ambito.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-cyan-400 inline-flex items-center gap-0.5"
            >
              Ámbito Financiero <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </p>
        </div>

        {/* Links repositorio y disclaimer */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center">
          <span className="text-slate-500 text-[11px] max-w-xs sm:max-w-none">
            Información orientativa y de acceso público.
          </span>
          <a
            href="https://github.com/adriandepool/Dolar-Argentina"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Repo</span>
          </a>
        </div>

      </div>
    </footer>
  );
};
