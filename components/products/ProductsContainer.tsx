import ProductsGrid from './ProductsGrid';
import ProductsList from './ProductsList';
import { LuLayoutGrid, LuList } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { fetchAllProducts } from '@/utils/actions';
import Link from 'next/link';
import PaginationContainer from '../global/PaginationContainer';

async function ProductsContainer({
  layout,
  search,
  page = 1,
}: {
  layout: string;
  search: string;
  page?: number;
}) {
  const { products, total, totalPages } = await fetchAllProducts({ search, page, pageSize: 12 });
  const searchTerm = search ? `&search=${encodeURIComponent(search)}` : '';
  const gridHref = `/products?layout=grid${searchTerm}`;
  const listHref = `/products?layout=list${searchTerm}`;

  return (
    <>
      {/* HEADER */}
      <section>
        <div className='flex justify-between items-center'>
          <h4 className='font-medium text-lg'>
            {total} product{total > 1 && 's'}
          </h4>
          <div className='flex gap-x-4'>
            <Button
              variant={layout === 'grid' ? 'default' : 'ghost'}
              size='icon'
              aria-label='Show products as a grid'
              asChild
            >
              <Link href={gridHref}>
                <LuLayoutGrid />
              </Link>
            </Button>
            <Button
              variant={layout === 'list' ? 'default' : 'ghost'}
              size='icon'
              aria-label='Show products as a list'
              asChild
            >
              <Link href={listHref}>
                <LuList />
              </Link>
            </Button>
          </div>
        </div>
        <Separator className='mt-4' />
      </section>
      {/* PRODUCTS */}
      <div>
        {total === 0 ? (
          <h5 className='text-2xl mt-16'>
            Sorry, no products matched your search...
          </h5>
        ) : layout === 'grid' ? (
          <ProductsGrid products={products} />
        ) : (
          <ProductsList products={products} />
        )}
        <PaginationContainer currentPage={page} totalPages={totalPages} />
      </div>
    </>
  );
}
export default ProductsContainer;
