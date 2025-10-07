'use client';

import { useAuth } from '@/contexts/authContext';
import { useEffect, useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Sidebar } from '@/components/sidebar';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import MenuIcon from '@mui/icons-material/Menu';
import { Button } from '@heroui/react';
import { Spinner } from '@heroui/spinner';

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isNavVisible, setIsNavVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsNavVisible(isDesktop);
  }, [isDesktop]);

  const toggleNav = () => {
    setIsNavVisible((prev) => !prev);
  };

  return (
    <div className='min-h-screen flex flex-col'>
      <div className='fixed top-0 w-full bg-slate-700 text-white h-10 flex items-center shadow-md z-50'>
        <div className='flex-1'>
          <Link href='/'>
            <h1 className='px-4 text-left text-xl font-bold'>V U T L E R</h1>
          </Link>
        </div>
        <div className='flex items-center gap-2 px-2'>
          <ProfileDropdown />
          <Button
            variant='light'
            isIconOnly
            onPress={toggleNav}
            className='text-white text-2xl focus:outline-none'
          >
            <MenuIcon />
          </Button>
        </div>
      </div>
      <div className='flex-1 flex relative mt-10'>
        <Sidebar
          isNavVisible={isNavVisible}
          toggleNav={toggleNav}
          isDesktop={isDesktop}
        />
        {!isDesktop && isNavVisible && (
          <div
            className='fixed inset-0 bg-black opacity-50 z-30'
            onClick={toggleNav}
          ></div>
        )}
        <main
          className={`flex-1 flex flex-col p-4 transition-all duration-300 ${isDesktop ? 'mr-14' : 'mr-0'
            }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className='min-h-screen flex flex-col justify-center items-center'>
        <Spinner size='lg' />
        <p className='mt-4 text-gray-600'>로딩 중...</p>
      </div>
    );
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
