import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';

const postSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().trim().min(1, 'Content is required').max(50000, 'Content is too long'),
  excerpt: z.string().trim().max(500, 'Excerpt must be less than 500 characters').optional(),
  tags: z.string().trim().max(200, 'Tags must be less than 200 characters').optional(),
});

const CreatePost = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const validationData = postSchema.parse({ title, content, excerpt, tags });
      
      let imageUrl = null;
      
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const slug = generateSlug(validationData.title);
      const postExcerpt = validationData.excerpt || validationData.content.substring(0, 200);

      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          title: validationData.title,
          slug,
          content: validationData.content,
          excerpt: postExcerpt,
          featured_image: imageUrl,
          author_id: user.id,
        })
        .select()
        .single();

      if (postError) throw postError;

      if (validationData.tags) {
        const tagNames = validationData.tags.split(',').map(t => t.trim()).filter(t => t);
        
        for (const tagName of tagNames) {
          const tagSlug = generateSlug(tagName);
          
          let tagId;
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('slug', tagSlug)
            .maybeSingle();

          if (existingTag) {
            tagId = existingTag.id;
          } else {
            const { data: newTag, error: tagError } = await supabase
              .from('tags')
              .insert({ name: tagName, slug: tagSlug })
              .select()
              .single();

            if (tagError) throw tagError;
            tagId = newTag.id;
          }

          await supabase
            .from('post_tags')
            .insert({ post_id: postData.id, tag_id: tagId });
        }
      }

      toast.success('Post created successfully!');
      navigate(`/posts/${slug}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Error creating post:', error);
        toast.error('Failed to create post');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="container mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Enter post title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  disabled={loading}
                  placeholder="A short summary (optional)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Write your post content"
                  rows={12}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled={loading}
                  placeholder="Comma-separated tags (e.g. Politics, Local News)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Featured Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  disabled={loading}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Post'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePost;
