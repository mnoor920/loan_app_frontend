import { Ubuntu } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ActivationProvider } from '@/contexts/ActivationContext';

const ubuntu = Ubuntu({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="" suppressHydrationWarning>
      <body className={ubuntu.className}>
        <AuthProvider>
          <ActivationProvider>
            {children}
          </ActivationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}