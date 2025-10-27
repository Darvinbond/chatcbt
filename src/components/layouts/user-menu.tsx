"use client";

import { useAuth } from "@/components/providers/auth-provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface UserMenuProps {
  isCollapsed: boolean;
}

export function UserMenu({ isCollapsed }: UserMenuProps) {
  const { user } = useAuth();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="w-full m-0 flex items-center overflow-hidden text-ellipsis gap-2 p-2 rounded-lg hover:bg-zinc-200">
          <div className="size-8 aspect-square rounded-full bg-primary text-white flex items-center justify-center">
            {user?.user_metadata?.name?.[0].toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col items-start">
              <span className="text-sm font-[500] overflow-hidden text-ellipsis">
                {user?.user_metadata?.name || "-"}
              </span>
              <span className="text-[12px] text-zinc-600 overflow-hidden text-ellipsis">
                {user?.email}
              </span>
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 rounded-[16px] !p-0 bg-zinc-100 border-zinc-200">
        <div className="p-2">
          <div className="flex items-center select-none text-zinc-500 gap-2 mb-2">
            <div className="size-8 aspect-square rounded-full bg-zinc-200 flex items-center justify-center">
              {user?.user_metadata?.name?.[0].toUpperCase()}
            </div>
            <span className="text-sm">{user?.email}</span>
          </div>
          {/* {JSON.stringify(user)} */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-200 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm">Log out</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
