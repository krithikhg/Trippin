'use client'

import {
  Home,
  Briefcase,
  Calendar,
  DollarSign,
  PieChart,
  BarChart3,
  Bell,
  Settings,
  User,
  ChevronUp,
  LogOut,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { logout } from '@/app/login/actions'

const mainItems = [
  { title: 'Home', url: '/home', icon: Home },
  { title: 'My Trips', url: '/trips', icon: Briefcase },
  { title: 'Itinerary', url: '/itinerary', icon: Calendar },
  { title: 'Expenses', url: '/expenses', icon: DollarSign },
  { title: 'Budget', url: '/budget', icon: PieChart },
  { title: 'Polls', url: '/polls', icon: BarChart3 },
]

const secondaryItems = [
  { title: 'Notifications', url: '/notifications', icon: Bell },
  { title: 'Settings', url: '/settings', icon: Settings },
]

type MenuProps = {
  userName: string
  userEmail: string
  avatarUrl: string | null
}

export function Menu({ userName, userEmail, avatarUrl }: MenuProps) {
  const pathname = usePathname()

  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/home" className="flex items-center gap-2 p-2">
          <Image
            src="/TrippinLogo.png"
            alt="Trippin"
            width={36}
            height={36}
            className="rounded"
          />
          <span className="text-2xl font-serif italic text-primary">
            Trippin
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto py-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl ?? ''} alt={userName} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left flex-1 min-w-0">
                    <span className="text-sm font-semibold truncate w-full">
                      {userName}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {userEmail}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="end"
                className="w-[--radix-popper-anchor-width] min-w-56"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{userName}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {userEmail}
                    </span>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                            <span>My Profile</span>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/notifications/preferences" className="cursor-pointer">
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notification Preferences</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Account Settings</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onSelect={() => logout()} 
                  className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}