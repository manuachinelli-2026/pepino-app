import '@fontsource-variable/funnel-sans'
import '@fontsource-variable/jetbrains-mono'
import './globals.css'

export const metadata = {
  title: 'Pepino AI — Panel de agentes',
  description: 'Panel de gestión de agentes IA para tu negocio',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Leer tema antes de render para evitar flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          document.documentElement.setAttribute('data-theme', 'light');
        ` }} />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: 'var(--sans)',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}>
        {children}
      </body>
    </html>
  )
}
