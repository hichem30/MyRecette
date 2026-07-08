import type { Metadata } from "next";
import { Video, Search, Filter, MoreVertical, ChevronLeft, ChevronRight, Eye, Edit, Trash2, Heart, MessageSquare, PlayCircle, Clock, User, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "All Videos — sucre et sel Admin",
  description: "Manage and moderate all user-submitted recipe videos",
};

// Mock data for local development
const mockVideos = [
  {
    id: "v-001",
    recipe_id: "r-001",
    recipe_slug: "classic-french-ratatouille",
    recipe_title: { en: "Classic French Ratatouille" },
    user_id: "user-1",
    user_name: "Chef Marie",
    user_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    platform: "youtube",
    video_url: "https://youtube.com/watch?v=abc123",
    youtube_video_id: "abc123",
    facebook_video_id: null,
    thumbnail_url: "https://img.youtube.com/vi/abc123/maxresdefault.jpg",
    title: { en: "How to Make Authentic Ratatouille", es: "Cómo hacer Ratatouille auténtico" },
    description: { en: "Step-by-step guide to making the perfect French ratatouille." },
    like_count: 452,
    comment_count: 89,
    share_count: 23,
    view_count: 12456,
    is_approved: true,
    status: "approved",
    flagged_reason: null,
    created_at: "2024-06-20T10:30:00Z",
    updated_at: "2024-07-01T14:25:00Z"
  },
  {
    id: "v-002",
    recipe_id: "r-002",
    recipe_slug: "easy-chocolate-cake",
    recipe_title: { en: "Easy Chocolate Cake" },
    user_id: "user-2",
    user_name: "Sarah Johnson",
    user_avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
    platform: "youtube",
    video_url: "https://youtube.com/watch?v=def456",
    youtube_video_id: "def456",
    facebook_video_id: null,
    thumbnail_url: "https://img.youtube.com/vi/def456/maxresdefault.jpg",
    title: { en: "Moist Chocolate Cake in 5 Steps", es: "Pastel de chocolate húmedo en 5 pasos" },
    description: { en: "My secret tips for the perfect chocolate cake every time." },
    like_count: 892,
    comment_count: 156,
    share_count: 45,
    view_count: 23412,
    is_approved: true,
    status: "approved",
    flagged_reason: null,
    created_at: "2024-05-18T16:45:00Z",
    updated_at: "2024-06-28T09:10:00Z"
  },
  {
    id: "v-003",
    recipe_id: "r-003",
    recipe_slug: "spicy-thai-green-curry",
    recipe_title: { en: "Spicy Thai Green Curry" },
    user_id: "user-3",
    user_name: "Thai Kitchen",
    user_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    platform: "facebook",
    video_url: "https://facebook.com/watch?v=ghi789",
    youtube_video_id: null,
    facebook_video_id: "ghi789",
    thumbnail_url: "https://graph.facebook.com/ghi789/picture",
    title: { en: "Authentic Thai Green Curry Recipe", es: "Receta auténtica de curry verde tailandés" },
    description: { en: "Traditional Thai cooking techniques for green curry." },
    like_count: 341,
    comment_count: 67,
    share_count: 12,
    view_count: 8765,
    is_approved: true,
    status: "approved",
    flagged_reason: null,
    created_at: "2024-04-25T11:20:00Z",
    updated_at: "2024-05-15T13:30:00Z"
  },
  {
    id: "v-004",
    recipe_id: "r-004",
    recipe_slug: "quick-breakfast-smoothie",
    recipe_title: { en: "Quick Breakfast Smoothie" },
    user_id: "user-4",
    user_name: "Healthy Living",
    user_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
    platform: "youtube",
    video_url: "https://youtube.com/watch?v=jkl012",
    youtube_video_id: "jkl012",
    facebook_video_id: null,
    thumbnail_url: "https://img.youtube.com/vi/jkl012/maxresdefault.jpg",
    title: { en: "5-Minute Nutritious Breakfast Smoothie", es: "Batido nutritivo de desayuno en 5 minutos" },
    description: { en: "Quick, healthy breakfast option for busy mornings." },
    like_count: 128,
    comment_count: 45,
    share_count: 8,
    view_count: 4521,
    is_approved: false,
    status: "pending",
    flagged_reason: null,
    created_at: "2024-07-01T08:00:00Z",
    updated_at: "2024-07-01T08:00:00Z"
  },
  {
    id: "v-005",
    recipe_id: "r-005",
    recipe_slug: "homemade-pasta-carbonara",
    recipe_title: { en: "Homemade Pasta Carbonara" },
    user_id: "user-5",
    user_name: "Italian Nonna",
    user_avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80",
    platform: "youtube",
    video_url: "https://youtube.com/watch?v=mno345",
    youtube_video_id: "mno345",
    facebook_video_id: null,
    thumbnail_url: "https://img.youtube.com/vi/mno345/maxresdefault.jpg",
    title: { en: "Grandma's Secret Carbonara Recipe", es: "Receta secreta de carbonara de la abuela" },
    description: { en: "Family recipe passed down through generations." },
    like_count: 678,
    comment_count: 98,
    share_count: 34,
    view_count: 18234,
    is_approved: true,
    status: "approved",
    flagged_reason: null,
    created_at: "2024-03-15T12:15:00Z",
    updated_at: "2024-06-20T15:40:00Z"
  },
  {
    id: "v-006",
    recipe_id: null,
    recipe_slug: null,
    recipe_title: { en: "N/A" },
    user_id: "user-6",
    user_name: "Spam User",
    user_avatar: null,
    platform: "youtube",
    video_url: "https://youtube.com/watch?v=spam666",
    youtube_video_id: "spam666",
    facebook_video_id: null,
    thumbnail_url: "https://img.youtube.com/vi/spam666/maxresdefault.jpg",
    title: { en: "Unrelated Content - Buy My Product" },
    description: { en: "This is spam content that should be flagged." },
    like_count: 5,
    comment_count: 2,
    share_count: 0,
    view_count: 50,
    is_approved: false,
    status: "rejected",
    flagged_reason: "Inappropriate content - not recipe related",
    created_at: "2024-07-02T18:30:00Z",
    updated_at: "2024-07-02T19:00:00Z"
  }
];

const platforms = ["All", "YouTube", "Facebook"];
const statuses = ["All", "Approved", "Pending", "Rejected", "Flagged"];
const sortOptions = ["Newest", "Most Viewed", "Most Liked", "Most Commented", "Trending"];

function getPlatformIcon(platform: string) {
  switch (platform) {
    case "youtube": return <svg className="h-4 w-4 text-red-600" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
    case "facebook": return <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
    default: return <Video className="h-4 w-4" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">
        <CheckCircle className="h-3 w-3" /> Approved
      </span>;
    case "pending":
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
        <Clock className="h-3 w-3" /> Pending
      </span>;
    case "rejected":
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-medium">
        <XCircle className="h-3 w-3" /> Rejected
      </span>;
    case "flagged":
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-medium">
        <AlertTriangle className="h-3 w-3" /> Flagged
      </span>;
    default:
      return <span className="text-xs font-medium text-neutral-600">{status}</span>;
  }
}

function formatNumber(num: number) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "short", 
    day: "numeric" 
  });
}

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    platform?: string; 
    status?: string; 
    search?: string;
    sort?: string;
    page?: string; 
  }>;
}) {
  const { platform: platformFilter, status: statusFilter, search: searchQuery, sort: sortBy, page: pageParam } = await searchParams;
  
  const page = pageParam ? parseInt(pageParam) : 1;
  const perPage = 10;

  // Filter videos
  let filteredVideos = [...mockVideos];
  
  if (platformFilter && platformFilter !== "All") {
    filteredVideos = filteredVideos.filter(v => v.platform === platformFilter.toLowerCase());
  }
  
  if (statusFilter && statusFilter !== "All") {
    filteredVideos = filteredVideos.filter(v => v.status === statusFilter.toLowerCase());
  }
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredVideos = filteredVideos.filter(v => 
      v.title?.en?.toLowerCase().includes(query) ||
      v.description?.en?.toLowerCase().includes(query) ||
      v.user_name.toLowerCase().includes(query) ||
      v.recipe_title?.en?.toLowerCase().includes(query)
    );
  }

  // Sort videos
  switch (sortBy) {
    case "Most Viewed":
      filteredVideos.sort((a, b) => b.view_count - a.view_count);
      break;
    case "Most Liked":
      filteredVideos.sort((a, b) => b.like_count - a.like_count);
      break;
    case "Most Commented":
      filteredVideos.sort((a, b) => b.comment_count - a.comment_count);
      break;
    case "Trending":
      filteredVideos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    default: // Newest
      filteredVideos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const total = filteredVideos.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginatedVideos = filteredVideos.slice(start, end);

  // Calculate stats
  const totalVideos = mockVideos.length;
  const pendingVideos = mockVideos.filter(v => v.status === "pending").length;
  const approvedVideos = mockVideos.filter(v => v.status === "approved").length;
  const rejectedVideos = mockVideos.filter(v => v.status === "rejected").length;
  const totalViews = mockVideos.reduce((sum, v) => sum + v.view_count, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900 flex items-center gap-3">
            <Video className="h-8 w-8 text-recette-600" />
            All Videos
          </h1>
          <p className="text-neutral-500 mt-1">Manage and moderate user-submitted recipe videos</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <PlayCircle className="h-4 w-4 text-recette-600" />
            <span>Total Videos</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totalVideos}</div>
          <div className="text-sm text-green-600 mt-1">+{Math.floor(Math.random() * 10)} new this week</div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Pending Review</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{pendingVideos}</div>
          <div className="text-sm text-blue-600 mt-1">Needs approval</div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Approved</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{approvedVideos}</div>
          <div className="text-sm text-green-600 mt-1">+{Math.floor(Math.random() * 5)} today</div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <Eye className="h-4 w-4 text-purple-600" />
            <span>Total Views</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{formatNumber(totalViews)}</div>
          <div className="text-sm text-purple-600 mt-1">All videos</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search videos..."
              defaultValue={searchQuery || ""}
              className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
            />
          </div>

          <select
            defaultValue={platformFilter || "All"}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
          >
            {platforms.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            defaultValue={statusFilter || "All"}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            defaultValue={sortBy || "Newest"}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
          >
            {sortOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Apply Filters
          </Button>
          
          <Button variant="outline" className="gap-2">
            <MoreVertical className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Videos Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-neutral-900">Videos List</h2>
          <div className="text-sm text-neutral-500">
            Showing {start + 1}-{Math.min(end, total)} of {total} videos
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Video</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Recipe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Stats</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Platform</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {paginatedVideos.map((video: any) => (
                <tr key={video.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-neutral-100">
                        {video.thumbnail_url && (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title?.en || "Video"}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <PlayCircle className="h-6 w-6 text-white/80" />
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900 line-clamp-1">{video.title?.en}</div>
                        <div className="text-sm text-neutral-500 line-clamp-1">{video.description?.en}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden">
                        {video.user_avatar && (
                          <img
                            src={video.user_avatar}
                            alt={video.user_name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">{video.user_name}</div>
                        <div className="text-xs text-neutral-500">{video.user_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {video.recipe_slug ? (
                      <Link href={`/recipes/${video.recipe_slug}`} target="_blank" className="text-sm text-recette-600 hover:text-recette-700 font-medium">
                        {video.recipe_title?.en}
                      </Link>
                    ) : (
                      <span className="text-sm text-neutral-400">No recipe linked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-neutral-500" />
                        <span className="text-sm">{formatNumber(video.view_count)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span className="text-sm">{formatNumber(video.like_count)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-blue-500" />
                        <span className="text-sm">{formatNumber(video.comment_count)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {getPlatformIcon(video.platform)}
                      <span className="text-sm capitalize">{video.platform}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(video.status)}
                    {video.flagged_reason && (
                      <div className="text-xs text-orange-600 mt-1">{video.flagged_reason}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-recette-600 hover:text-recette-700">
                        <Eye className="h-4 w-4" />
                      </a>
                      <Link href={`/videos/${video.id}`} target="_blank" className="text-sm text-blue-600 hover:text-blue-700">
                        <PlayCircle className="h-4 w-4" />
                      </Link>
                      <Link href={`/admin/videos/${video.id}/edit`} className="text-sm text-blue-600 hover:text-blue-700">
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button className="text-sm text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-neutral-200 flex items-center justify-between">
            <div className="text-sm text-neutral-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={page === 1} className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-neutral-500">
                {page} / {totalPages}
              </span>
              <Button variant="outline" disabled={page === totalPages} className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}