import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowLeft, Tag } from 'lucide-react';
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
}

const TagPosts = () => {
  const { slug } = useParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [tagName, setTagName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPostsByTag(slug);
    }
  }, [slug]);

  const fetchPostsByTag = async (tagSlug: string) => {
    try {
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select('id, name')
        .eq('slug', tagSlug)
        .maybeSingle();

      if (tagError) throw tagError;
      if (!tagData) {
        setLoading(false);
        return;
      }

      setTagName(tagData.name);

      const { data: postTagsData, error: postTagsError } = await supabase
        .from('post_tags')
        .select(`
          posts (
            *,
            profiles:author_id (full_name)
          )
        `)
        .eq('tag_id', tagData.id);

      if (postTagsError) throw postTagsError;

      const postsData = (postTagsData || [])
        .map((pt: any) => pt.posts)
        .filter((post: any): post is Post => post !== null && post !== undefined) as Post[];

      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts by tag:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <div className="mb-8 flex items-center gap-3">
          <Tag className="h-8 w-8 text-accent" />
          <h1 className="text-4xl font-bold">
            {tagName ? `Posts tagged "${tagName}"` : 'Tag not found'}
          </h1>
        </div>

        {posts.length === 0 ? (
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              No posts found with this tag.
            </p>
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
                    <Badge variant="secondary" className="mb-2 w-fit">
                      {tagName}
                    </Badge>
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

export default TagPosts;
