const baseURL = process.env.NEXT_PUBLIC_SCHEDULE_SERVER;

export async function getYoutubeVideoInfo(videoId: string) {
  const params = new URLSearchParams({ videoId });
  const url = `${baseURL}/v1.0/scheduler/youtube/video-info?${params}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error(`Error fetching youtube video info: ${err}`);
    throw err;
  }
}
