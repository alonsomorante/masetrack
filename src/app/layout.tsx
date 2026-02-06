import type { Metadata } from 'next'
import { Chakra_Petch, Roboto_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

const chakra = Chakra_Petch({
  subsets: ['latin'],
  variable: '--font-chakra',
  weight: ['400', '500', '600', '700'],
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'MASETRACK',
  description: 'SISTEMA DE CONTROL DE ENTRENAMIENTO',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${chakra.variable} ${robotoMono.variable} font-mono antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
