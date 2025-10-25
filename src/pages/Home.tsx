import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  created_at: string;
  author_id: string;
  profiles: {
    full_name: string;
  };
  post_tags: {
    tags: {
      name: string;
      slug: string;
    };
  }[];
}

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (full_name),
          post_tags (
            tags (name, slug)
          )
        `)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading latest news...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary to-secondary px-4 py-16 text-center">
        <h1 className="mb-4 text-4xl font-bold text-secondary-foreground md:text-5xl">
          Daily Belfast News
        </h1>
        <p className="text-lg text-secondary-foreground/90 md:text-xl">
          Your trusted source for local news and stories
        </p>
      </div>

      {/* Posts Grid */}
      <div className="container mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="text-center">
            <p className="text-lg text-muted-foreground">No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} to={`/posts/${post.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-lg">
                  {post.featured_image && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {post.post_tags?.slice(0, 3).map((pt, idx) => (
                        <Badge key={idx} variant="secondary">
                          {pt.tags.name}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{post.profiles?.full_name || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(post.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
