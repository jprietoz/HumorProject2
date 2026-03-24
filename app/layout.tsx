import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Humor Admin",
  description: "Admin panel for The Humor Project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('admin-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}else if(t==='system'||!t){/* no attribute = let CSS media query decide */}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}