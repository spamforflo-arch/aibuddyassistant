import { Settings, Volume2, VolumeX } from "lucide-react";
import ModeToggle from "./ModeToggle";

interface HeaderProps {
  isSearchMode: boolean;
  onToggleMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const Header = ({ isSearchMode, onToggleMode, isMuted, onToggleMute }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between p-4">
      <button
        onClick={onToggleMute}
        className="p-2 rounded-full bg-secondary hover:bg-muted transition-colors"
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-muted-foreground" />
        ) : (
          <Volume2 className="w-5 h-5 text-foreground" />
        )}
      </button>

      <ModeToggle isSearchMode={isSearchMode} onToggle={onToggleMode} />

      <button className="p-2 rounded-full bg-secondary hover:bg-muted transition-colors">
        <Settings className="w-5 h-5 text-muted-foreground" />
      </button>
    </header>
  );
};

export default Header;
