// src/components/UserNameModal.tsx
import { useState, useEffect } from "react";
import { Button } from "./Button";
import { X, User, Sparkles } from "lucide-react";

interface UserNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userName: string) => void;
  initialUserName?: string;
}

export default function UserNameModal({
  isOpen,
  onClose,
  onSave,
  initialUserName = "",
}: UserNameModalProps) {
  const [userName, setUserName] = useState(initialUserName);
  const [error, setError] = useState("");

  useEffect(() => {
    // Update userName state when initialUserName changes
    setUserName(initialUserName);
  }, [initialUserName]);

  useEffect(() => {
    // Focus the input when modal opens
    if (isOpen) {
      const timer = setTimeout(() => {
        const input = document.getElementById("user-name-input");
        if (input) {
          input.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName.trim()) {
      setError("Vui lòng nhập tên của bạn");
      return;
    }

    onSave(userName.trim());
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl w-full max-w-md p-8 shadow-2xl border border-white/10 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-2 h-2 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
              {initialUserName ? "Đổi tên của bạn" : "Đặt tên của bạn"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-110"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="user-name-input"
              className="block text-sm font-medium text-white/90 mb-3"
            >
              Tên hiển thị trong phòng
            </label>
            <input
              id="user-name-input"
              type="text"
              placeholder="Nhập tên của bạn..."
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/20 transition-all backdrop-blur-sm"
              autoComplete="off"
            />
            {error && (
              <p className="text-red-400 text-sm mt-2 flex items-center">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></span>
                {error}
              </p>
            )}
            <p className="text-gray-400 text-sm mt-2">
              💡 Tên của bạn sẽ được lưu lại cho những lần sau
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              type="button"
              className="flex-1"
            >
              Hủy
            </Button>
            <Button type="submit" className="flex-1">
              {initialUserName ? "Cập nhật" : "Lưu & tiếp tục"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
