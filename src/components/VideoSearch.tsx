"use client";

import { useState } from "react";
import { Search, Loader2, Plus, Link, Youtube } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/Button";
import { extractYouTubeVideoId, isValidYouTubeUrl } from "@/lib/utils";
import { getYouTubeVideoDetails } from "@/lib/socket";

interface VideoSearchResult {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
}

interface VideoSearchProps {
  onSearch: (query: string) => Promise<VideoSearchResult[]>;
  onAddVideo: (video: VideoSearchResult) => void;
  isSearching: boolean;
}

const VideoSearch = ({
  onSearch,
  onAddVideo,
  isSearching,
}: VideoSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [searchResults, setSearchResults] = useState<VideoSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);
  const [isAddingFromUrl, setIsAddingFromUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "url">("search");

  const handleAddFromUrl = async () => {
    if (!youtubeUrl.trim()) return;

    try {
      setUrlError(null);
      setIsAddingFromUrl(true);

      const videoId = extractYouTubeVideoId(youtubeUrl.trim());
      if (!videoId) {
        setUrlError("URL YouTube không hợp lệ. Vui lòng kiểm tra lại.");
        return;
      }

      const videoDetails = await getYouTubeVideoDetails(videoId);

      // Add video to queue
      onAddVideo(videoDetails);
      setRecentlyAdded((prev) => [...prev, videoDetails.id]);

      // Clear URL input
      setYoutubeUrl("");

      // Remove from recently added after 3 seconds
      setTimeout(() => {
        setRecentlyAdded((prev) => prev.filter((id) => id !== videoDetails.id));
      }, 3000);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Add from URL error:", error);
      setUrlError(
        error.message || "Không thể thêm video từ URL. Vui lòng thử lại."
      );
    } finally {
      setIsAddingFromUrl(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setError(null);

      // Set loading state
      setSearchResults([]);

      const results = await onSearch(searchQuery.trim());

      // Check for empty results
      if (!results || results.length === 0) {
        setError("Không tìm thấy kết quả. Vui lòng thử từ khóa khác.");
        setSearchResults([]);
        return;
      }

      // Update with results
      setSearchResults(results);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Search error in component:", error);
      setSearchResults([]);
      setError(error.message || "Lỗi tìm kiếm. Vui lòng thử lại.");
    }
  };

  const handleAddVideo = (video: VideoSearchResult) => {
    onAddVideo(video);
    setRecentlyAdded((prev) => [...prev, video.id]);

    // Remove from recently added after 3 seconds
    setTimeout(() => {
      setRecentlyAdded((prev) => prev.filter((id) => id !== video.id));
    }, 3000);
  };

  return (
    <div className="w-full bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all shadow-lg">
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === "search"
                ? "bg-violet-500 text-white shadow-lg"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Search className="w-4 h-4" />
            Tìm kiếm
          </button>
          <button
            onClick={() => setActiveTab("url")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === "url"
                ? "bg-violet-500 text-white shadow-lg"
                : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Link className="w-4 h-4" />
            Nhập link
          </button>
        </div>

        {/* Search Tab */}
        {activeTab === "search" && (
          <>
            <div className="flex space-x-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Tìm kiếm video YouTube..."
                className="flex-1 px-2 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-violet-400 focus:bg-white/20 focus:ring-2 focus:ring-violet-400/30 transition-all"
                autoFocus
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                className="min-w-[60px]"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-white text-sm animate-pulse">
                <p className="flex items-center">
                  <span className="bg-red-500 rounded-full w-2 h-2 mr-2 animate-ping"></span>
                  {error}
                </p>
              </div>
            )}
          </>
        )}

        {/* URL Tab */}
        {activeTab === "url" && (
          <>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddFromUrl()}
                  placeholder="Dán link YouTube vào đây..."
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-violet-400 focus:bg-white/20 focus:ring-2 focus:ring-violet-400/30 transition-all"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleAddFromUrl}
                disabled={isAddingFromUrl || !isValidYouTubeUrl(youtubeUrl)}
                className="min-w-[100px]"
              >
                {isAddingFromUrl ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Thêm
                  </>
                )}
              </Button>
            </div>

            {/* URL validation hint */}
            {youtubeUrl && !isValidYouTubeUrl(youtubeUrl) && (
              <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-200 text-sm">
                <p className="flex items-center">
                  <Youtube className="w-4 h-4 mr-2 flex-shrink-0" />
                  Hỗ trợ các định dạng: youtube.com/watch?v=..., youtu.be/...,
                  youtube.com/embed/...
                </p>
              </div>
            )}

            {urlError && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-white text-sm animate-pulse">
                <p className="flex items-center">
                  <span className="bg-red-500 rounded-full w-2 h-2 mr-2 animate-ping"></span>
                  {urlError}
                </p>
              </div>
            )}
          </>
        )}

        {/* Search Results - Only show in search tab */}
        {activeTab === "search" && searchResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <div className="bg-violet-500/20 p-1.5 rounded-lg">
                  <Search className="w-4 h-4 text-violet-400" />
                </div>
                Kết quả tìm kiếm
                <span className="bg-violet-500/20 text-violet-300 text-xs px-2 py-1 rounded-full">
                  {searchResults.length} video
                </span>
              </h3>
            </div>

            <div className="max-h-[660px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
              {searchResults.map((video, index) => {
                const isJustAdded = recentlyAdded.includes(video.id);

                return (
                  <div
                    key={video.id}
                    className={`group relative flex items-start space-x-4 rounded-xl p-4 transition-all duration-300 transform hover:scale-[1.02] ${
                      isJustAdded
                        ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 shadow-lg shadow-green-500/10"
                        : "bg-gradient-to-r from-white/5 to-white/10 hover:from-white/10 hover:to-white/15 border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-white/5"
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: "fadeInUp 0.5s ease-out forwards",
                    }}
                  >
                    {/* Thumbnail with enhanced styling */}
                    <div className="relative flex-shrink-0 group">
                      <div className="relative overflow-hidden rounded-lg shadow-lg">
                        <Image
                          src={
                            video.thumbnail ||
                            "https://via.placeholder.com/120x90.png?text=No+Thumbnail"
                          }
                          alt={video.title}
                          width={160}
                          height={90}
                          className="w-24 h-auto rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-1 right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded font-medium shadow-md">
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            YouTube
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <h4
                          className="text-white text-sm font-medium leading-snug line-clamp-2 group-hover:text-violet-200 transition-colors"
                          title={`${video.title}`}
                        >
                          {video.title}
                        </h4>
                        <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          {video.channelTitle}
                        </p>
                      </div>

                      {/* Action button with enhanced styling */}
                      <div className="flex items-center justify-end">
                        <Button
                          variant={isJustAdded ? "primary" : "secondary"}
                          size="sm"
                          onClick={() => handleAddVideo(video)}
                          title={
                            isJustAdded
                              ? "Đã thêm vào hàng chờ"
                              : "Thêm vào hàng chờ"
                          }
                          className={`transition-all duration-300 ${
                            isJustAdded
                              ? "bg-green-500 text-white shadow-lg shadow-green-500/25 pointer-events-none"
                              : "bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 hover:text-white border border-violet-500/30 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/25"
                          }`}
                        >
                          {isJustAdded ? (
                            <span className="flex items-center gap-2">
                              <div className="relative">
                                <div className="w-3 h-3 bg-white rounded-full animate-ping absolute"></div>
                                <div className="w-3 h-3 bg-white rounded-full relative"></div>
                              </div>
                              <span className="text-xs font-medium">
                                Đã thêm
                              </span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Plus className="w-4 h-4" />
                              <span className="text-xs font-medium">Thêm</span>
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Subtle gradient overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoSearch;
