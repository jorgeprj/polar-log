import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
    metadataBase: new URL(defaultUrl),
    title: "PolarLog - Painel de Gerenciamento",
    description: "Gerenciamento de Logística para Polar",
};

const geistSans = Geist({
    variable: "--font-geist-sans",
    display: "swap",
    subsets: ["latin"],
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-br" suppressHydrationWarning>
            <body className={`${geistSans.className} antialiased font-sans`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
