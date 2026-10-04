'use client'

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { 
  CalendarDays, 
  FileText, 
  ListTodo, 
  UserCheck, 
  BookMarked,
  NotebookText,
  ChevronRight
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { useProfileStore } from "@/store/useProfileStore"
import { Settings } from "lucide-react"

const navItems = [
  { title: "Jadwal Kuliah", url: "/schedule", icon: CalendarDays },
  { title: "Jadwal UTS/UAS", url: "/exam-schedule", icon: FileText },
  { title: "Tugas", url: "/assignments", icon: ListTodo },
  { title: "Materi", url: "/materi", icon: BookMarked },
  { title: "Presensi", url: "/attendance", icon: UserCheck },
]

const CATATAN_SUBJECTS = [
  { name: 'Fisika & Kimia Dasar', slug: 'fisika-kimia' },
  { name: 'Konsep Sistem & Teknik SI', slug: 'konsep-si' },
  { name: 'Algoritma & Pemrograman', slug: 'algoritma' },
  { name: 'Matematika Dasar', slug: 'matematika' },
  { name: 'Digital Citizenship', slug: 'digital' },
  { name: 'Ilmu Sosial & Budaya Dasar', slug: 'isbd' },
  { name: 'Pendidikan Pancasila', slug: 'pancasila' },
  { name: 'Peng. Bisnis & Ekonomi Digital', slug: 'bisnis' },
]

function BackendStatus() {
  const [status, setStatus] = React.useState<'checking' | 'online' | 'offline'>('checking');

  React.useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('http://localhost:8080/health', { signal: AbortSignal.timeout(3000) });
        setStatus(res.ok ? 'online' : 'offline');
      } catch {
        setStatus('offline');
      }
    };
    check();
    const interval = setInterval(check, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground w-full">
      <div className={`size-1.5 rounded-full ${
        status === 'online' ? 'bg-green-500' :
        status === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
      }`} />
      <span>BAAK Engine {status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : '...'}</span>
    </div>
  );
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [catatanOpen, setCatatanOpen] = React.useState(false)
  const { kelas: profileKelas } = useProfileStore()

  const currentClass = (profileKelas || '1KA02').toUpperCase()


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center border-b flex flex-row items-center gap-3 overflow-hidden transition-all">
        <div className="relative size-10 group-data-[collapsible=icon]:size-7 shrink-0 transition-all duration-200">
          <Image 
            src="/image/logo/logo.png" 
            alt="Logo" 
            fill 
            className="object-contain"
            sizes="(max-width: 768px) 40px, 40px"
          />
        </div>
        <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
          <span className="font-semibold text-base tracking-tight">bingungundar</span>
          <span className="text-xs text-muted-foreground">{currentClass}</span>
        </div>
      </SidebarHeader>

      
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton isActive={pathname.startsWith(item.url)} tooltip={item.title}>
                <Link href={item.url} className="flex items-center gap-2 w-full">
                  <item.icon className="size-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {/* Catatan Sub-menu */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Catatan"
              isActive={pathname.startsWith('/catatan')}
              onClick={() => setCatatanOpen(o => !o)}
            >
              <NotebookText className="size-4 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden flex-1 text-left">Catatan</span>
              <ChevronRight
                className={`size-4 shrink-0 transition-transform group-data-[collapsible=icon]:hidden ${
                  catatanOpen ? 'rotate-90' : ''
                }`}
              />
            </SidebarMenuButton>
            
            {catatanOpen && (
              <SidebarMenuSub className="group-data-[collapsible=icon]:hidden ml-1 border-l border-sidebar-border pl-2 overflow-hidden">
                {CATATAN_SUBJECTS.map(subj => (
                  <SidebarMenuSubItem key={subj.slug} className="overflow-hidden">
                    <SidebarMenuSubButton
                      isActive={pathname === `/catatan/${subj.slug}`}
                      render={<Link href={`/catatan/${subj.slug}`} />}
                      className="text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent text-[13px] font-medium overflow-hidden"
                    >
                      <span className="block truncate w-full">{subj.name}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>

          <div className="mt-auto pt-4">
            <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname.startsWith('/settings')} tooltip="Pengaturan">
                <Link href="/settings" className="flex items-center gap-2 w-full">
                  <Settings className="size-4 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">Pengaturan</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </div>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t group-data-[collapsible=icon]:hidden flex flex-col gap-2">
        <Badge variant="outline" className="w-full justify-center text-center h-8">
          Semester Ganjil 2026/2027
        </Badge>
        <BackendStatus />
      </SidebarFooter>
    </Sidebar>
  )
}
