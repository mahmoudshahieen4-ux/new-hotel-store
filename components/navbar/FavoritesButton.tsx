import Link from 'next/link';
import { Button } from '../ui/button';
import { LuHeart } from 'react-icons/lu';
import { fetchFavoritesCount } from '@/utils/actions';

async function FavoritesButton() {
  const count = await fetchFavoritesCount();

  return (
    <Button
      asChild
      variant='outline'
      size='icon'
      className='flex justify-center items-center relative'
    >
      <Link href='/favorites' aria-label='Favorites'>
        <LuHeart />
        {count > 0 && (
          <span className='absolute -top-3 -right-3 bg-primary text-white rounded-full h-6 w-6 flex items-center justify-center text-xs'>
            {count}
          </span>
        )}
      </Link>
    </Button>
  );
}
export default FavoritesButton;