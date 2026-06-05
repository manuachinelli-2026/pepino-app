export const metadata = {
  title: 'Pepino AI — Chats',
  description: 'Panel de chats de Pepino AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Funnel+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{
        margin: 0, padding: 0,
        background: '#0B0E0C',
        color: '#F4F7F2',
        fontFamily: '"Funnel Sans", system-ui, sans-serif',
        WebkitFontSmoothing: 'antialiased',
        height: '100vh',
        overflow: 'hidden',
      }}>
        {children}
      </body>
    </html>
  )
}
