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
      <body style={{
        margin: 0,
        padding: 0,
        background: '#0B0E0C',
        color: '#F4F7F2',
        fontFamily: '"Funnel Sans Variable", "Funnel Sans", system-ui, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}>
        {children}
      </body>
    </html>
  )
}
