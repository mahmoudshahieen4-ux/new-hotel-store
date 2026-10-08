import Container from '../global/Container';
import CartButton from './CartButton';
import FavoritesButton from './FavoritesButton';
import DarkMode from './DarkMode';
import LinksDropdown from './LinksDropdown';
import MobileSidebar from './MobileSideBar';
import Logo from './Logo';
import NavSearch from './NavSearch';
import { Suspense } from 'react';
function Navbar() {
  return (
    <nav>
      <Container className='flex justify-between items-center flex-no-wrap py-8 gap-2 md:gap-4 border-b'>
        <Logo />
        <Suspense>
          <NavSearch />
        </Suspense>
        <div className='links flex gap-4 items-center'>
          <div className='gap-4 hidden  md:flex '>
          <CartButton />
          <FavoritesButton />
          <DarkMode />
          </div>
          <div className='hidden md:inline-flex'>
            <LinksDropdown />
          </div>
          <div className='md:hidden'>
            <MobileSidebar />
          </div>
        </div>
      </Container>
    </nav>
  );
}
export default Navbar;
