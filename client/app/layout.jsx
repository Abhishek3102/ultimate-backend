// import { AuthProvider } from "@/contexts/AuthContext"
// import "./globals.css"

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body>
//         <AuthProvider>{children}</AuthProvider>
//       </body>
//     </html>
//   )
// }


import "./globals.css"

import { AuthProvider } from "@/components/AuthProvider"
import { SocketProvider } from "@/context/SocketContext"
import Navbar from "@/components/Navbar"
import ClientToaster from "@/components/ClientToaster"
import "./globals.css"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <SocketProvider>
            <Navbar />
            {children}
            <ClientToaster />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
