'use client';
import { useParams } from 'next/navigation';
import EventForm from '@/components/pages/EventForm';

export default function FormPage() {
  const params = useParams();
  const eventId = Array.isArray(params.eventId) ? params.eventId[0] : (params.eventId ?? '');
  return <EventForm eventId={eventId} />;
}
