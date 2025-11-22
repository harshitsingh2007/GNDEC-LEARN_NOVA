import { useMemo } from "react";

type VideoPlayerProps = {
  url?: string;
  title?: string;
  className?: string;
  onEnded?: () => void;
};

const isFileSource = (url: string) =>
  /\.(mp4|webm|ogg)(\?|$)/i.test(url) || url.startsWith("blob:");

const extractYoutubeId = (url: string) => {
  if (!url) return "";

  const normalized = url.trim();
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/live\/([A-Za-z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) return match[1];
  }

  try {
    const parsed = new URL(normalized);
    const vParam = parsed.searchParams.get('v');
    if (vParam && vParam.length === 11) return vParam;
  } catch (err) {
    // ignore URL parsing errors
  }

  return "";
};

const buildYoutubeEmbed = (url: string) => {
  const videoId = extractYoutubeId(url);
  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&color=white&iv_load_policy=3&fs=1&playsinline=1`;
  }

  // If the URL is already an embeddable link, keep it as-is
  if (/youtube\.com\/.+embed\//.test(url)) {
    return url;
  }

  return "";
};

const extractDriveId = (url: string) => {
  if (!url) return "";

  const directMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (directMatch?.[1]) return directMatch[1];

  const openMatch = url.match(/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch?.[1]) return openMatch[1];

  const queryMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryMatch?.[1]) return queryMatch[1];

  return "";
};

const buildDrivePreview = (url: string) => {
  const id = extractDriveId(url);
  if (!id) return "";
  return `https://drive.google.com/file/d/${id}/preview`;
};

const normalizeVideoUrl = (url: string) => {
  if (!url) return "";
  const lower = url.toLowerCase();
  if (lower.includes("youtube") || lower.includes("youtu.be")) {
    const youtubeUrl = buildYoutubeEmbed(url);
    if (youtubeUrl) return youtubeUrl;
  }
  if (url.includes("drive.google.com")) {
    const driveUrl = buildDrivePreview(url);
    if (driveUrl) return driveUrl;
  }
  if (url.includes("vimeo.com") && !url.includes("player.vimeo.com")) {
    const id = url.split("/").pop();
    return id ? `https://player.vimeo.com/video/${id}` : url;
  }
  return url;
};

const VideoPlayer = ({ url, title, className, onEnded }: VideoPlayerProps) => {
  const sanitizedUrl = useMemo(() => (url ? url.trim() : ""), [url]);
  const isFile = useMemo(() => sanitizedUrl && isFileSource(sanitizedUrl), [sanitizedUrl]);

  if (!sanitizedUrl) {
    return (
      <div className={`flex aspect-video w-full items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 ${className ?? ""}`}>
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-700">
            <svg className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No video available</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Add a video URL to get started</p>
        </div>
      </div>
    );
  }

  if (isFile) {
    return (
      <div className={`relative w-full overflow-hidden rounded-xl bg-black shadow-lg ${className ?? ""}`}>
        <video
          key={sanitizedUrl}
          controls
          controlsList="nodownload"
          className="aspect-video w-full object-contain"
          src={sanitizedUrl}
          title={title || "Course lesson"}
          playsInline
          onEnded={onEnded}
        />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
            <p className="text-white text-sm font-medium truncate">{title || "Course Video"}</p>
          </div>
        </div>
      </div>
    );
  }

  const embedUrl = normalizeVideoUrl(sanitizedUrl);

  return (
    <div className={`relative w-full overflow-hidden rounded-xl bg-black shadow-lg ${className ?? ""}`}>
      <iframe
        key={embedUrl}
        src={embedUrl}
        title={title || "Course lesson"}
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
      {title && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
            <p className="text-white text-sm font-medium truncate">{title}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;