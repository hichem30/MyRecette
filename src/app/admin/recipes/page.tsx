import type { Metadata } from "next";
import { BookOpen, Search, Filter, MoreVertical, ChevronLeft, ChevronRight, Eye, Edit, Trash2, Heart, Clock, User, Tag, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "All Recipes — sucre et sel Admin",
  description: "Manage and moderate all user-submitted recipes",
};

// Mock data for local development
const mockRecipes = [
  {
    id: "r-001",
    slug: "classic-french-ratatouille",
    title: { en: "Classic French Ratatouille", es: "Ratatouille Clásico Francés", fr: "Ratatouille Française Classique", ar: "راتاتوي فرنسية كلاسيكية" },
    description: { en: "A traditional French vegetable stew that's both rustic and elegant." },
    author_id: "user-1",
    author_name: "Chef Marie",
    author_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    main_image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80",
    prep_time: 20,
    cook_time: 45,
    servings: 4,
    difficulty: "medium",
    rating: 4.8,
    review_count: 247,
    favorite_count: 1284,
    ingredient_count: 12,
    category: "Dinner",
    cuisine: "French",
    dietary_tags: ["Vegetarian", "Gluten-Free", "Healthy"],
    status: "published",
    is_approved: true,
    created_at: "2024-06-15T10:30:00Z",
    updated_at: "2024-07-01T14:25:00Z"
  },
  {
    id: "r-002",
    slug: "easy-chocolate-cake",
    title: { en: "Easy Chocolate Cake", es: "Pastel de Chocolate Fácil", fr: "Gâteau au Chocolat Facile", ar: "كيك الشوكولاتة السهل" },
    description: { en: "Moist and delicious chocolate cake that anyone can make." },
    author_id: "user-2",
    author_name: "Sarah Johnson",
    author_avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80",
    main_image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80",
    prep_time: 15,
    cook_time: 35,
    servings: 8,
    difficulty: "easy",
    rating: 4.9,
    review_count: 382,
    favorite_count: 2156,
    ingredient_count: 8,
    category: "Dessert",
    cuisine: "American",
    dietary_tags: ["Vegetarian", "Nut-Free"],
    status: "published",
    is_approved: true,
    created_at: "2024-05-22T16:45:00Z",
    updated_at: "2024-06-28T09:10:00Z"
  },
  {
    id: "r-003",
    slug: "spicy-thai-green-curry",
    title: { en: "Spicy Thai Green Curry", es: "Curry Verde Tailandés Picante", fr: "Curry Vert Thaï Épicé", ar: "كاري تايلاندي أخضر حار" },
    description: { en: "Authentic Thai green curry with fresh herbs and spices." },
    author_id: "user-3",
    author_name: "Thai Kitchen",
    author_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    main_image: "https://images.unsplash.com/photo-1607293189738-0d53a2993b13?auto=format&fit=crop&w=400&q=80",
    prep_time: 25,
    cook_time: 30,
    servings: 4,
    difficulty: "medium",
    rating: 4.7,
    review_count: 189,
    favorite_count: 945,
    ingredient_count: 14,
    category: "Dinner",
    cuisine: "Thai",
    dietary_tags: ["Gluten-Free", "Dairy-Free"],
    status: "published",
    is_approved: true,
    created_at: "2024-04-10T11:20:00Z",
    updated_at: "2024-05-15T13:30:00Z"
  },
  {
    id: "r-004",
    slug: "quick-breakfast-smoothie",
    title: { en: "Quick Breakfast Smoothie", es: "Batido Rápido de Desayuno", fr: "Smoothie Petit Déjeuner Rapide", ar: "سموثي إفطار سريع" },
    description: { en: "Healthy and nutritious smoothie to start your day right." },
    author_id: "user-4",
    author_name: "Healthy Living",
    author_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
    main_image: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?auto=format&fit=crop&w=400&q=80",
    prep_time: 5,
    cook_time: 0,
    servings: 1,
    difficulty: "easy",
    rating: 4.6,
    review_count: 98,
    favorite_count: 321,
    ingredient_count: 6,
    category: "Breakfast",
    cuisine: "International",
    dietary_tags: ["Vegan", "Gluten-Free", "Healthy", "Quick"],
    status: "pending",
    is_approved: false,
    created_at: "2024-07-02T08:00:00Z",
    updated_at: "2024-07-02T08:00:00Z"
  },
  {
    id: "r-005",
    slug: "homemade-pasta-carbonara",
    title: { en: "Homemade Pasta Carbonara", es: "Pasta Carbonara Casera", fr: "Pâtes Carbonara Maison", ar: "باستا كاربونارا منزلية" },
    description: { en: "Classic Italian pasta dish with eggs, cheese, pancetta, and black pepper." },
    author_id: "user-5",
    author_name: "Italian Nonna",
    author_avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80",
    main_image: "https://images.unsplash.com/photo-1621996346565-e326b20f5413?auto=format&fit=crop&w=400&q=80",
    prep_time: 15,
    cook_time: 20,
    servings: 4,
    difficulty: "medium",
    rating: 4.9,
    review_count: 452,
    favorite_count: 1823,
    ingredient_count: 10,
    category: "Dinner",
    cuisine: "Italian",
    dietary_tags: ["Vegetarian-Friendly"],
    status: "published",
    is_approved: true,
    created_at: "2024-03-08T12:15:00Z",
    updated_at: "2024-06-20T15:40:00Z"
  }
];

const categories = ["All", "Breakfast", "Lunch", "Dinner", "Dessert", "Snack", "Drink"];
const cuisines = ["All", "French", "Italian", "Thai", "American", "Mexican", "Indian", "Chinese", "Japanese", "Mediterranean", "Middle Eastern", "International"];
const statuses = ["All", "Published", "Pending", "Draft", "Rejected"];
const difficulties = ["All", "Easy", "Medium", "Hard"];
const sortOptions = ["Newest", "Most Popular", "Highest Rated", "Trending"];

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "easy": return "bg-green-100 text-green-800";
    case "medium": return "bg-orange-100 text-orange-800";
    case "hard": return "bg-red-100 text-red-800";
    default: return "bg-neutral-100 text-neutral-800";
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "published":
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">
        Published
      </span>;
    case "pending":
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
        Pending
      </span>;
    case "draft":
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-xs font-medium">
        Draft
      </span>;
    case "rejected":
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-medium">
        Rejected
      </span>;
    default:
      return <span className="text-xs font-medium text-neutral-600">{status}</span>;
  }
}

function formatTime(minutes: number) {
  if (minutes === 0) return "0 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    category?: string; 
    cuisine?: string;
    status?: string;
    difficulty?: string;
    search?: string;
    sort?: string;
    page?: string; 
  }>;
}) {
  const { category: categoryFilter, cuisine: cuisineFilter, status: statusFilter, difficulty: difficultyFilter, search: searchQuery, sort: sortBy, page: pageParam } = await searchParams;
  
  const page = pageParam ? parseInt(pageParam) : 1;
  const perPage = 10;

  // Filter recipes
  let filteredRecipes = [...mockRecipes];
  
  if (categoryFilter && categoryFilter !== "All") {
    filteredRecipes = filteredRecipes.filter(r => r.category === categoryFilter);
  }
  
  if (cuisineFilter && cuisineFilter !== "All") {
    filteredRecipes = filteredRecipes.filter(r => r.cuisine === cuisineFilter);
  }
  
  if (statusFilter && statusFilter !== "All") {
    filteredRecipes = filteredRecipes.filter(r => r.status === statusFilter.toLowerCase());
  }
  
  if (difficultyFilter && difficultyFilter !== "All") {
    filteredRecipes = filteredRecipes.filter(r => r.difficulty === difficultyFilter.toLowerCase());
  }
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredRecipes = filteredRecipes.filter(r => 
      r.title.en.toLowerCase().includes(query) ||
      r.description?.en?.toLowerCase().includes(query) ||
      r.author_name.toLowerCase().includes(query)
    );
  }

  // Sort recipes
  switch (sortBy) {
    case "Most Popular":
      filteredRecipes.sort((a, b) => b.favorite_count - a.favorite_count);
      break;
    case "Highest Rated":
      filteredRecipes.sort((a, b) => b.rating - a.rating);
      break;
    case "Trending":
      filteredRecipes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    default: // Newest
      filteredRecipes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const total = filteredRecipes.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginatedRecipes = filteredRecipes.slice(start, end);

  // Calculate stats
  const totalRecipes = mockRecipes.length;
  const pendingRecipes = mockRecipes.filter(r => r.status === "pending").length;
  const publishedRecipes = mockRecipes.filter(r => r.status === "published").length;
  const totalFavorites = mockRecipes.reduce((sum, r) => sum + r.favorite_count, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-neutral-900 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-recette-600" />
            All Recipes
          </h1>
          <p className="text-neutral-500 mt-1">Manage and moderate user-submitted recipes</p>
        </div>
        <Link href="/recipes/add">
          <Button className="gap-2 bg-recette-600 hover:bg-recette-700">
            <Plus className="h-4 w-4" />
            Add New Recipe
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <BookOpen className="h-4 w-4 text-recette-600" />
            <span>Total Recipes</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totalRecipes}</div>
          <div className="text-sm text-green-600 mt-1">+{Math.floor(Math.random() * 10)} new this week</div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Pending Review</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{pendingRecipes}</div>
          <div className="text-sm text-blue-600 mt-1">Needs approval</div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <TrendingUp className="h-4 w-4 text-recette-600" />
            <span>Published</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{publishedRecipes}</div>
          <div className="text-sm text-green-600 mt-1">+{Math.floor(Math.random() * 5)} today</div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
            <Heart className="h-4 w-4 text-red-600" />
            <span>Total Favorites</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{totalFavorites.toLocaleString()}</div>
          <div className="text-sm text-purple-600 mt-1">All recipes</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search recipes..."
              defaultValue={searchQuery || ""}
              className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
            />
          </div>

          <select
            defaultValue={categoryFilter || "All"}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            defaultValue={cuisineFilter || "All"}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
          >
            {cuisines.map((c) => (
              <option key={c} value={c}>{c}</option>
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
            defaultValue={difficultyFilter || "All"}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-recette-600 focus:border-transparent"
          >
            {difficulties.map((d) => (
              <option key={d} value={d}>{d}</option>
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

      {/* Recipes Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-neutral-900">Recipes List</h2>
          <div className="text-sm text-neutral-500">
            Showing {start + 1}-{Math.min(end, total)} of {total} recipes
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Recipe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Stats</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {paginatedRecipes.map((recipe: any) => (
                <tr key={recipe.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-100">
                        {recipe.main_image && (
                          <img
                            src={recipe.main_image}
                            alt={recipe.title.en || "Recipe"}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">{recipe.title.en}</div>
                        <div className="text-sm text-neutral-500 line-clamp-1">{recipe.description?.en}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden">
                        {recipe.author_avatar && (
                          <img
                            src={recipe.author_avatar}
                            alt={recipe.author_name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">{recipe.author_name}</div>
                        <div className="text-xs text-neutral-500">{recipe.author_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span className="text-sm">{recipe.favorite_count.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3 text-neutral-500" />
                        <span className="text-sm">{recipe.ingredient_count} ingredients</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-sm">{formatTime(recipe.prep_time + recipe.cook_time)} total</div>
                      <div className="text-xs text-neutral-500">
                        Prep: {formatTime(recipe.prep_time)} • Cook: {formatTime(recipe.cook_time)}
                      </div>
                      <div className="text-xs text-neutral-500">Serves: {recipe.servings}</div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                        {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(recipe.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/recipes/${recipe.slug}`} target="_blank" className="text-sm text-recette-600 hover:text-recette-700">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link href={`/admin/recipes/${recipe.id}/edit`} className="text-sm text-blue-600 hover:text-blue-700">
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