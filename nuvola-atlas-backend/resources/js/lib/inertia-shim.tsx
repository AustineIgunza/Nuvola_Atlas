/**
 * Lightweight shim for @inertiajs/react when running as a standalone SPA.
 * Provides Link, usePage, and router with browser-native equivalents.
 */
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';

// usePage — returns current URL from window.location
export function usePage() {
  return {
    url: window.location.pathname,
    props: { errors: {}, auth: { user: null } },
  };
}

// Link — renders a plain <a> that uses pushState
interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  method?: string;
  as?: string;
  children?: ReactNode;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, method, as, children, onClick, ...rest }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (onClick) onClick(e);
      if (e.defaultPrevented) return;
      if (href.startsWith('http') || rest.target === '_blank') return;
      e.preventDefault();
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    };

    // If `as="button"`, render as button-like anchor
    return (
      <a ref={ref} href={href} onClick={handleClick} {...rest}>
        {children}
      </a>
    );
  }
);
Link.displayName = 'Link';

// router — basic navigation
export const router = {
  visit(url: string, options?: { preserveState?: boolean; preserveScroll?: boolean }) {
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  },
  post(url: string) {
    // For SPA, post actions (like sign-out) just navigate
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  },
};
