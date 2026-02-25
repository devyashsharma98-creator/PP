'use client';
import { useParams } from 'next/navigation';
import VotePage from '@/components/pages/VotePage';

export default function VotePageRoute() {
  const params = useParams();
  const eventId = Array.isArray(params.eventId) ? params.eventId[0] : (params.eventId ?? '');
  return <VotePage eventId={eventId} />;
}
