alter type public.topic_status add value if not exists 'pending_review';
alter type public.topic_status add value if not exists 'rejected';
