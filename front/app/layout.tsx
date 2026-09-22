import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Transformación de matrices",
  description:
    "Interfaz para la API de matrices en Go y la API de estadísticas en Node del reto técnico.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}

        <footer className="mt-auto border-t">
          <div className="mx-auto flex w-full max-w-5xl justify-center px-4 py-6 sm:px-6">
            <a
              href="https://rejcob.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              rejcob.dev
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
