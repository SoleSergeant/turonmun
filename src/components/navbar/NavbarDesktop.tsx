import React, { memo, useState, useCallback, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, ChevronDown, LogIn } from 'lucide-react';
import { useAuthState } from '@/hooks/useAuthState';
import { supabase } from '@/integrations/supabase/client';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from '@/lib/utils';

interface NavbarDesktopProps {
  scrolled: boolean;
  isHomePage: boolean;
  navLinks: any[];
}

// Memoize the dropdown item to prevent unnecessary re-renders
const DropdownItem = memo(({
  item,
  location,
  onClick
}: {
  item: any,
  location: any,
  onClick?: (path: string) => void
}) => {
  // Check if the current path matches this item's path
  const isActive = (() => {
    // For season pages
    if (item.path.startsWith('/seasons/')) {
      return location.pathname === item.path;
    }
    return location.pathname === item.path;
  })();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent immediate navigation
    if (onClick) {
      onClick(item.path);
    }
  };

  return (
    <li key={item.name}>
      <a
        href={item.path}
        className={cn(
          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-all duration-300 hover:bg-diplomatic-50",
          isActive
            ? "bg-diplomatic-50 text-diplomatic-700 font-medium"
            : "text-neutral-700"
        )}
        onClick={handleClick}
      >
        <div className="text-sm font-medium">{item.name}</div>
        <div className="line-clamp-2 text-xs text-neutral-500">
          {item.name}
        </div>
      </a>
    </li>
  );
});

DropdownItem.displayName = 'DropdownItem';

const NavbarDesktop: React.FC<NavbarDesktopProps> = ({ scrolled, isHomePage, navLinks }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const { user } = useAuthState();
  const [isChair, setIsChair] = useState(() => {
    // Initialize from cache if available
    const cached = localStorage.getItem('userRole');
    return cached === 'chair' || cached === 'co-chair' || cached === 'co_chair' || cached === 'superadmin';
  });

  // Check if user is a chair (with caching)
  useEffect(() => {
    const checkChairRole = async () => {
      if (!user?.email) {
        setIsChair(false);
        localStorage.removeItem('userRole');
        return;
      }

      // Check cache first
      const cachedRole = localStorage.getItem('userRole');
      const cacheTime = localStorage.getItem('userRoleTime');
      const now = Date.now();

      // Use cache if less than 5 minutes old
      if (cachedRole && cacheTime && (now - parseInt(cacheTime)) < 300000) {
        setIsChair(cachedRole === 'chair' || cachedRole === 'co-chair' || cachedRole === 'co_chair' || cachedRole === 'superadmin');
        return;
      }

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', user.email)
        .single();

      const role = (adminUser as any)?.role || 'delegate';
      localStorage.setItem('userRole', role);
      localStorage.setItem('userRoleTime', now.toString());
      setIsChair(role === 'chair' || role === 'co-chair' || role === 'co_chair' || role === 'superadmin');
    };

    checkChairRole();
  }, [user?.email]); // Only re-run when email changes

  // Handle delayed navigation with transition
  const handleNavigation = useCallback((path: string) => {
    if (isNavigating) return; // Prevent multiple clicks

    setIsNavigating(true);

    // Add a small delay before navigation to allow for transition
    setTimeout(() => {
      navigate(path);
      setIsNavigating(false);
    }, 300); // Increased delay for smoother transition
  }, [navigate, isNavigating]);

  const handleDashboardClick = (e: React.MouseEvent) => {
    const role = localStorage.getItem('userRole') || 'delegate';
    const adminRoles = ['superadmin', 'admin'];
    const chairRoles = ['chair', 'co-chair', 'co_chair', 'director'];

    if (adminRoles.includes(role.toLowerCase())) {
      e.preventDefault();
      window.open('https://admin.turonmun.com', '_blank');
    } else if (chairRoles.includes(role.toLowerCase())) {
      e.preventDefault();
      window.open('https://chair.turonmun.com', '_blank');
    } else {
      // For delegates, just let the Link handle it normally
      // But we can also use navigate here if needed
    }
  };

  return (
    <div className="hidden md:flex md:items-center md:space-x-6">
      {navLinks.map((link) => {
        // Handle dropdown navigation items
        if (link.hasDropdown && link.dropdownItems) {
          return (
            <NavigationMenu key={link.name} className="z-50">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      "nav-link text-sm font-medium px-4 h-10 rounded-md transition-all duration-300 flex items-center gap-1",
                      location.pathname === link.path || location.pathname.startsWith(link.path) || location.pathname.startsWith('/seasons/')
                        ? scrolled
                          ? 'text-white font-semibold bg-diplomatic-800/80'
                          : isHomePage
                            ? 'text-gold-400 font-semibold bg-white/10'
                            : 'text-gold-400 font-semibold bg-diplomatic-700'
                        : scrolled
                          ? 'text-white hover:text-gold-400 hover:bg-diplomatic-800/50'
                          : isHomePage
                            ? 'text-white/90 hover:text-white hover:bg-white/10'
                            : 'text-white/90 hover:text-white hover:bg-diplomatic-700/80'
                    )}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      boxShadow: 'none'
                    }}
                  >
                    {link.name}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="shadow-gold">
                    <ul className="grid w-[240px] gap-1 p-2 bg-white">
                      {link.dropdownItems.map((item: any) => (
                        <DropdownItem
                          key={item.name}
                          item={item}
                          location={location}
                          onClick={handleNavigation}
                        />
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          );
        }

        // Regular navigation links (non-dropdown)
        return (
          <div key={link.name} className="relative group">
            <Link
              to={link.path}
              className={cn(
                "nav-link text-sm font-medium h-10 px-4 rounded-md transition-all duration-300 flex items-center justify-center",
                location.pathname === link.path || (link.path === '/resources' && location.pathname.startsWith('/resources'))
                  ? scrolled
                    ? 'text-white font-semibold bg-diplomatic-800/80'
                    : isHomePage
                      ? 'text-gold-400 font-semibold bg-white/10'
                      : 'text-gold-400 font-semibold bg-diplomatic-700'
                  : scrolled
                    ? 'text-white hover:text-gold-400 hover:bg-diplomatic-800/50'
                    : isHomePage
                      ? 'text-white/90 hover:text-white hover:bg-white/10'
                      : 'text-white/90 hover:text-white hover:bg-diplomatic-700/80'
              )}
            >
              {link.name}
            </Link>
          </div>
        );
      })}

      {/* Action Buttons Group */}
      <div className="flex items-center gap-3 ml-4">
        {user ? (
          // Logged In - Show Dashboard Button
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/dashboard"
              onClick={handleDashboardClick}
              className="bg-gold-400 hover:bg-gold-400/90 text-diplomatic-900 text-sm font-medium h-10 px-6 rounded-md transition-all duration-300 flex items-center gap-2 shadow-gold hover:-translate-y-0.5"
            >
              <LogIn size={16} />
              <span>Dashboard</span>
            </Link>
          </motion.div>
        ) : (
          // Not Logged In - Show Login & Signup
          <>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/login"
                className={cn(
                  "text-sm font-medium h-10 px-4 rounded-md transition-all duration-300 flex items-center gap-2",
                  scrolled
                    ? "text-white hover:text-gold-400 hover:bg-white/10"
                    : "text-diplomatic-800 hover:text-diplomatic-900 hover:bg-diplomatic-50"
                )}
              >
                <LogIn size={16} />
                <span className="hidden sm:inline">Login</span>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/signup"
                className="bg-gold-400 hover:bg-gold-400/90 text-diplomatic-900 text-sm font-medium h-10 px-6 rounded-md transition-all duration-300 flex items-center gap-2 shadow-gold hover:-translate-y-0.5"
              >
                <span>Sign Up</span>
              </Link>
            </motion.div>
          </>
        )}

      </div>
    </div>
  );
};

export default memo(NavbarDesktop);
