// Simple Link replacement for single language mode
import Link from 'next/link';

export { Link };

export function usePathname() {
  // In single language mode, we can use usePathname from next/navigation
  const { usePathname: nextUsePathname } = require('next/navigation');
  return nextUsePathname();
}

export function useRouter() {
  const { useRouter: nextUseRouter } = require('next/navigation');
  return nextUseRouter();
}