import { ReviewInbox } from "@/features/dev-board/components/review-inbox";
import { listReviewInbox } from "@/features/dev-board/services/review-inbox-service";

export default async function ReviewInboxPage() {
  const items = await listReviewInbox();
  return <ReviewInbox items={items} />;
}
