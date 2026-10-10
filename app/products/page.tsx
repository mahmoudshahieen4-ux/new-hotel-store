import ProductsContainer from '@/components/products/ProductsContainer';

async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ layout?: string; search?: string; page?: string }>;
}) {
  const resolved = await searchParams;
  const layout = resolved.layout || 'grid';
  const search = resolved.search || '';
  const page = Number(resolved.page) || 1;

  return <ProductsContainer layout={layout} search={search} page={page} />;
}
export default ProductsPage;
