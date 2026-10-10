import { deleteReviewAction, fetchProductReviewsByUser } from '@/utils/actions';
import ReviewCard from '@/components/reviews/ReviewCard';
import SectionTitle from '@/components/global/SectionTitle';
import FormContainer from '@/components/form/FormContainer';
import { IconButton } from '@/components/form/Buttons';
import PaginationContainer from '@/components/global/PaginationContainer';

async function ReviewsPage({ searchParams }: { searchParams?: { page?: string } }) {
  const page = Math.min(100000, Math.max(1, Number(searchParams?.page) || 1));
  const { reviews, total, totalPages } = await fetchProductReviewsByUser(page);
  if (total === 0) {
    return <SectionTitle text='you have no reviews yet' />;
  }

  return (
    <>
      <SectionTitle text='Your Reviews' />
      <section className='grid md:grid-cols-2 gap-8 mt-4'>
        {reviews.map((review) => {
          const { comment, rating } = review;
          const { name, image } = review.product;
          const reviewInfo = { comment, rating, name, image };
          return (
            <ReviewCard key={review.id} reviewInfo={reviewInfo}>
              <DeleteReview reviewId={review.id} />
            </ReviewCard>
          );
        })}
      </section>
      <PaginationContainer currentPage={page} totalPages={totalPages} />
    </>
  );
}

const DeleteReview = ({ reviewId }: { reviewId: string }) => {
  const deleteReview = deleteReviewAction.bind(null, { reviewId });
  return (
    <FormContainer action={deleteReview}>
      <IconButton actionType='delete' />
    </FormContainer>
  );
};

export default ReviewsPage;
