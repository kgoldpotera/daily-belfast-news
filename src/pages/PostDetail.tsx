import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
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

const PostDetail = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  const fetchPost = async (slug: string) => {
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
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Post Not Found</h1>
        <p className="mb-6 text-lg text-muted-foreground">
          The post you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    );
  }

  const imageUrl = post.featured_image || '';
  const siteUrl = window.location.origin;
  const postUrl = `${siteUrl}/posts/${post.slug}`;

  return (
    <>
      <Helmet>
        <title>{post.title} | DailyBelfastNews</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={postUrl} />
        
        {/* OpenGraph tags */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={postUrl} />
        {imageUrl && <meta property="og:image" content={imageUrl} />}
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        {imageUrl && <meta name="twitter:image" content={imageUrl} />}
      </Helmet>

      <article className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          {post.featured_image && (
            <div className="mb-8 aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={post.featured_image}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <header className="mb-8">
            <div className="mb-4 flex flex-wrap gap-2">
              {post.post_tags?.map((pt, idx) => (
                <Link key={idx} to={`/tags/${pt.tags.slug}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-accent">
                    {pt.tags.name}
                  </Badge>
                </Link>
              ))}
            </div>
            
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">{post.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span>{post.profiles?.full_name || 'Anonymous'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <time dateTime={post.created_at}>
                  {format(new Date(post.created_at), 'MMMM dd, yyyy')}
                </time>
              </div>
            </div>
          </header>

          <div className="prose prose-lg max-w-none">
            {post.content.split('\n').map((paragraph, idx) => (
              <p key={idx} className="mb-4 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </article>
    </>
  );
};

export default PostDetail;
