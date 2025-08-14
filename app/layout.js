import { Montserrat, Open_Sans } from "next/font/google"
import "./globals.css"
import { SpotifyAuthProvider } from "../lib/contexts/SpotifyAuthContext.jsx"

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["400", "600", "700", "900"],
})

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
  weight: ["400", "500", "600"],
})

export const metadata = {
  title: "MoodTunes - Music for Your Feelings",
  description: "Discover music that resonates with your mood",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${openSans.variable} antialiased`}>
      <body>
        <SpotifyAuthProvider>
          {children}
        </SpotifyAuthProvider>
      </body>
    </html>
  )
}
