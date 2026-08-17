"use client";

import { useState } from "react";
import Composer from "@/components/feed/Composer";
import StoriesRow from "@/components/feed/StoriesRow";
import PostCard from "@/components/feed/PostCard";
import TrendingSidebar from "@/components/feed/TrendingSidebar";
import { posts as initialPosts } from "@/lib/mock-data";
import type { Post } from "@/types";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const handlePost = (contenu: string) => {
    const newPost: Post = {
      id: `p-local-${Date.now()}`,
      auteurType: "joueur",
      auteurId: "moi",
      auteurNom: "VousMeme",
      auteurAvatar: "moi",
      auteurVerifie: false,
      contenu,
      date: new Date().toISOString(),
      likes: 0,
      commentaires: 0,
      partages: 0,
    };
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="flex">
      <div className="min-w-0 flex-1">
        <div className="glass sticky top-0 z-30 hidden border-b border-surface-border px-4 py-3 lg:block">
          <h1 className="font-display text-lg font-bold">Accueil</h1>
        </div>
        <StoriesRow />
        <Composer onPost={handlePost} />
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        <div className="p-6 text-center text-xs text-muted">Vous avez tout vu, revenez plus tard 👋</div>
      </div>
      <TrendingSidebar />
    </div>
  );
}
