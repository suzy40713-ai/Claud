"use client";

import Link from "next/link";
import { Bell, Heart, MessageCircle, Radio, Trophy, UserPlus } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Reveal from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

const NOTIFICATIONS = [
  {
    id: "n1",
    icon: Heart,
    color: "text-rose-400",
    seed: "j1",
    nom: "Kwame_Finisher",
    texte: "a aimé votre publication",
    date: "2 min",
    lu: false,
    href: "/",
  },
  {
    id: "n2",
    icon: UserPlus,
    color: "text-accent",
    seed: "african-fc",
    nom: "African FC",
    texte: "correspond à vos critères de recherche de club",
    date: "18 min",
    lu: false,
    href: "/african-fc",
  },
  {
    id: "n3",
    icon: MessageCircle,
    color: "text-sky-400",
    seed: "j2",
    nom: "Sekou_Playmaker",
    texte: "vous a envoyé un message",
    date: "1 h",
    lu: false,
    href: "/messages",
  },
  {
    id: "n4",
    icon: Radio,
    color: "text-live",
    seed: "african-fc",
    nom: "African FC",
    texte: "est en direct maintenant",
    date: "2 h",
    lu: true,
    href: "/live",
  },
  {
    id: "n5",
    icon: Trophy,
    color: "text-gold",
    seed: "c5",
    nom: "Atlas Warriors",
    texte: "vous défie au classement",
    date: "5 h",
    lu: true,
    href: "/classement",
  },
  {
    id: "n6",
    icon: UserPlus,
    color: "text-accent",
    seed: "c3",
    nom: "Nova United",
    texte: "a publié une nouvelle annonce de recrutement",
    date: "1 j",
    lu: true,
    href: "/recrutement",
  },
];

export default function NotificationsPage() {
  return (
    <div>
      <div className="glass sticky top-14 z-30 border-b border-surface-border px-4 py-3">
        <h1 className="flex items-center gap-2 font-display text-lg font-bold">
          <Bell className="h-5 w-5 text-accent" /> Notifications
        </h1>
      </div>

      <div className="divide-y divide-surface-border">
        {NOTIFICATIONS.map((n, i) => {
          const Icon = n.icon;
          return (
            <Reveal key={n.id} delay={i * 0.04} y={8}>
              <Link href={n.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/5",
                    !n.lu && "bg-accent/[0.04]"
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar type={n.seed === "african-fc" || n.seed.startsWith("c") ? "club" : "joueur"} nom={n.nom} seed={n.seed} size="md" />
                    <span className={cn("absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background", n.color)}>
                      <Icon className="h-3.5 w-3.5" fill="currentColor" />
                    </span>
                  </div>
                  <p className="min-w-0 flex-1 text-sm leading-snug">
                    <span className="font-semibold">{n.nom}</span> <span className="text-foreground/80">{n.texte}</span>
                  </p>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[11px] text-muted">{n.date}</span>
                    {!n.lu && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </div>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
