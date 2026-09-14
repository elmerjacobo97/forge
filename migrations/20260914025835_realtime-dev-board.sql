-- Dev Board realtime: publica cambios de tickets y comentarios al canal por
-- usuario `dev-board:<user_id>` y restringe la suscripción al dueño.
--
-- Otros módulos que usen realtime deben añadir su propio patrón y su propia
-- política SELECT en realtime.channels; con RLS activo, lo no permitido se niega.

INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('dev-board:%', 'Dev Board live updates per user', true)
ON CONFLICT (pattern) DO UPDATE
SET description = EXCLUDED.description,
    enabled = EXCLUDED.enabled;

CREATE OR REPLACE FUNCTION public.publish_dev_board_ticket_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_ticket JSONB;
  v_from_column TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_ticket := to_jsonb(OLD);
  ELSE
    v_user_id := NEW.user_id;
    v_ticket := to_jsonb(NEW);
  END IF;

  v_from_column := CASE
    WHEN TG_OP = 'UPDATE' AND OLD.column_id IS DISTINCT FROM NEW.column_id THEN OLD.column_id
    ELSE NULL
  END;

  PERFORM realtime.publish(
    'dev-board:' || v_user_id::text,
    'dev-board:ticket',
    jsonb_build_object(
      'action', lower(TG_OP),
      'from_column', v_from_column,
      'ticket', v_ticket
    )
  );

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS dev_board_tickets_realtime ON public.dev_board_tickets;
CREATE TRIGGER dev_board_tickets_realtime
  AFTER INSERT OR UPDATE OR DELETE ON public.dev_board_tickets
  FOR EACH ROW EXECUTE FUNCTION public.publish_dev_board_ticket_change();

CREATE OR REPLACE FUNCTION public.publish_dev_board_comment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  PERFORM realtime.publish(
    'dev-board:' || NEW.user_id::text,
    'dev-board:comment',
    jsonb_build_object(
      'action', 'insert',
      'comment', to_jsonb(NEW)
    )
  );

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS dev_board_ticket_comments_realtime ON public.dev_board_ticket_comments;
CREATE TRIGGER dev_board_ticket_comments_realtime
  AFTER INSERT ON public.dev_board_ticket_comments
  FOR EACH ROW EXECUTE FUNCTION public.publish_dev_board_comment_change();

ALTER TABLE realtime.channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dev_board_channels_subscribe_own ON realtime.channels;
CREATE POLICY dev_board_channels_subscribe_own
  ON realtime.channels FOR SELECT
  TO authenticated
  USING (
    pattern = 'dev-board:%'
    AND split_part(realtime.channel_name(), ':', 2) = (SELECT auth.uid())::text
  );

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dev_board_messages_publish_own ON realtime.messages;
CREATE POLICY dev_board_messages_publish_own
  ON realtime.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    channel_name LIKE 'dev-board:%'
    AND split_part(channel_name, ':', 2) = (SELECT auth.uid())::text
  );
