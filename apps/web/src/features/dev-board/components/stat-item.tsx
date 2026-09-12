import { Item, ItemContent, ItemMedia } from "@/components/ui/item";

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

export function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <Item size="sm">
      <ItemMedia
        variant="icon"
        className="size-8 rounded-full bg-muted text-muted-foreground"
      >
        {icon}
      </ItemMedia>
      <ItemContent>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
      </ItemContent>
    </Item>
  );
}
