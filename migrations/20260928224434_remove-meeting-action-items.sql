-- Permanently remove Meetings next-step data; existing Dev Board tickets remain.
DROP FUNCTION IF EXISTS public.create_dev_board_ticket_from_meeting_action(UUID, UUID);
DROP TABLE IF EXISTS public.meeting_action_items;
