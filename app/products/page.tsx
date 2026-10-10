import ProductsContainer from '@/components/products/ProductsContainer';

function ProductsPage({
  searchParams,
}: {
  searchParams: { layout?: string; search?: string; page?: string };
}) {
  const layout = searchParams.layout || 'grid';
  const search = searchParams.search || '';
  const page = Number(searchParams.page) || 1;

  return <ProductsContainer layout={layout} search={search} page={page} />;
}
export default ProductsPage;
