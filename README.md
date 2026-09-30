# Dólar Argentina 🇦🇷 💵

Dashboard financiero en tiempo real para el seguimiento de las cotizaciones del dólar en Argentina, análisis histórico interactivo, calculadora de conversión y sistema de alertas sonoras y de escritorio por umbrales de precio.

➡️ **[Ver Demo en Vivo](https://adriandepool.github.io/Dolar-Argentina/)**

---

## ✨ Novedades y Características

- ⚡ **Cotizaciones en Tiempo Real:** Valores de compra y venta actualizados para Dólar Oficial, Blue, MEP (Bolsa), CCL (Contado con Liquidación), Mayorista, Cripto y Tarjeta.
- 🔔 **Sistema de Alertas Inteligente:**
  - Configura alertas para cuando cualquier dólar **suba de un valor** o **baje de un valor**.
  - Avisos sonoros mediante Web Audio API (chime financiero) y notificaciones de escritorio nativas (Web Notifications API).
  - Almacenamiento persistente en `localStorage`.
- 📈 **Gráfico Histórico Interactivo:**
  - Alterna dinámicamente entre Dólar Blue, Oficial y MEP.
  - Filtros de período: **30 Días**, **3 Meses** o **1 Año**.
  - Tarjetas con métricas instantáneas del período: Mínimo, Máximo, Promedio y Variación porcentual (%).
- 🧮 **Calculadora / Conversor de Moneda:**
  - Conversión bidireccional inmediata (USD ↔ ARS).
  - Comparativa simultánea de rendimiento frente a todos los tipos de cambio.
- 🛡️ **Protección contra Rate Limits (Costo $0):**
  - Polling programado (cada 2 minutos) con temporizador visual y botón de refresco manual con debounce.
  - Caché local con TTL (Time-To-Live).
  - **Page Visibility API:** Pausa las consultas si el usuario minimiza o cambia de pestaña para no saturar la API ni consumir recursos.
- 🚀 **Despliegue Automático con GitHub Actions:**
  - Cada `git push` a `main` compila y publica automáticamente en GitHub Pages sin servicios de terceros ni costos.

---

## 🛠️ Stack Tecnológico

- **Framework:** [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Estilos:** [Tailwind CSS v3](https://tailwindcss.com/)
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Gráficos:** [Chart.js](https://www.chartjs.org/) + [react-chartjs-2](https://react-chartjs-2.js.org/)
- **CI/CD:** [GitHub Actions](https://github.com/features/actions) con despliegue a **GitHub Pages**

---

## 🌐 Fuentes de Datos

- **Cotizaciones en Vivo:** [DolarAPI](https://dolarapi.com/)
- **Series Históricas:** [Ámbito Financiero](https://www.ambito.com/)

---

## 💻 Desarrollo Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/adriandepool/Dolar-Argentina.git
cd Dolar-Argentina

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

Abre tu navegador en `http://localhost:5173`.

---

## 🚀 Despliegue en GitHub Pages

El proyecto incluye el flujo de trabajo automatizado en `.github/workflows/deploy.yml`.

Para activarlo en tu repositorio:
1. En GitHub, ve a **Settings** de tu repositorio.
2. En el menú izquierdo, haz clic en **Pages**.
3. En la sección **Build and deployment** > **Source**, selecciona **GitHub Actions** en lugar de "Deploy from a branch".
4. ¡Listo! Cada vez que hagas `git push main`, GitHub Actions compilará la aplicación y la publicará automáticamente.

---

## 👨‍💻 Autor

Proyecto desarrollado y modernizado por **Adrián Reyes**.  
Si te resulta útil, ¡no dudes en dejar una ⭐ en el repositorio!
