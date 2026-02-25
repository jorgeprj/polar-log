interface HeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export default function Header({ title, actions }: HeaderProps) {
  return (
    <header className="h-20 bg-white border-b border-zinc-200 flex items-center justify-between px-10 sticky top-0 z-20">
      <h2 className="text-2xl font-bold tracking-tight text-black text-nowrap">{title}</h2>
      
      <div className="flex items-center gap-3 w-full">
        {actions}
      </div>
    </header>
  );
}