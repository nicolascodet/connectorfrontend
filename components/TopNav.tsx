"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings, Link as LinkIcon, MessageSquare } from 'lucide-react';

export default function TopNav() {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-white/70 backdrop-blur-md border-b border-gray-200/50">
      <Link href="/chat">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent cursor-pointer">
          CORTEX
        </h1>
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/chat">
          <Button variant="ghost" size="sm" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
        </Link>
        <Link href="/connections">
          <Button variant="ghost" size="sm" className="gap-2">
            <LinkIcon className="h-4 w-4" />
            Connections
          </Button>
        </Link>
      </div>
    </div>
  );
}
