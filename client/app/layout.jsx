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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  )
}
