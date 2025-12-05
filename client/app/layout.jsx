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
import Navbar from "@/components/Navbar"
import "./globals.css"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
