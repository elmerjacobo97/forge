import { useEffect, useState } from "react";

import type { Ticket } from "../types/board";
import { checkStaleTickets, loadAlertedTickets, saveAlertedTickets } from "../utils/stale-alert";

export function useStaleTicketAlerts(tickets: Ticket[]) {
  const [alertedTickets] = useState(loadAlertedTickets);

  useEffect(() => {
    const check = () => {
      if (checkStaleTickets(tickets, alertedTickets)) {
        saveAlertedTickets(alertedTickets);
      }
    };

    check();
    const interval = window.setInterval(check, 60_000);
    return () => window.clearInterval(interval);
  }, [alertedTickets, tickets]);
}
