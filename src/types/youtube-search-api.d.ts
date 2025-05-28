declare module "youtube-search-api" {
  export interface YouTubeVideo {
    id: string;
    type: string;
    title: string;
    description?: string;
    duration?: {
      simpleText: string;
    };
    thumbnails?: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    thumbnail?: {
      thumbnails: Array<{
        url: string;
        height: number;
        width: number;
      }>;
    };
    channelTitle?: string;
    channel?: string;
    publishedTime?: string;
    viewCount?: {
      text: string;
    };
    isLive?: boolean;
  }

  export interface SearchResults {
    items: YouTubeVideo[];
    nextPage?: {
      nextPageToken: string;
      nextPageContext: unknown;
    };
    estimatedResults?: string;
    refinements?: string[];
  }

  /**
   * Get list of videos, channels, or playlists by keyword
   */
  export function GetListByKeyword(
    keyword: string,
    withPlaylist?: boolean,
    limit?: number,
    options?: Array<{ type: string }>
  ): Promise<SearchResults>;

  /**
   * Get next page of results
   */
  export function NextPage(
    nextPage: SearchResults["nextPage"],
    withPlaylist?: boolean,
    limit?: number
  ): Promise<SearchResults>;

  /**
   * Get playlist data by ID
   */
  export function GetPlaylistData(
    playlistId: string,
    limit?: number
  ): Promise<SearchResults>;

  /**
   * Get suggestion data
   */
  export function GetSuggestData(limit?: number): Promise<SearchResults>;

  /**
   * Get channel by channel ID
   */
  export function GetChannelById(
    channelId: string
  ): Promise<Array<{ title: string; content: unknown }>>;

  /**
   * Get video details with suggestions
   */
  export function GetVideoDetails(videoId: string): Promise<
    YouTubeVideo & {
      suggestion: YouTubeVideo[];
    }
  >;

  /**
   * Get short video list
   */
  export function GetShortVideo(): Promise<YouTubeVideo[]>;
}
