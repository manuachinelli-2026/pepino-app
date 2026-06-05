import '@fontsource-variable/funnel-sans'
import '@fontsource-variable/jetbrains-mono'

export const metadata = {
  title: 'Pepino AI',
  description: 'Tu agente de atención al cliente',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{
        margin: 0,
        padding: 0,
        background: '#0B0E0C',
        color: '#F4F7F2',
        fontFamily: '"Funnel Sans Variable", "Funnel Sans", Inter, system-ui, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}>
        {children}
      </body>
    </html>
  )
}
