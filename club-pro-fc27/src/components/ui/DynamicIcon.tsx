"use client";

import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";

type IconName = keyof typeof Icons;

export default function DynamicIcon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[
    name as IconName
  ];
  if (!Cmp) return null;
  return <Cmp {...props} />;
}
