import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar, ArrowLeft, Loader2, ArrowRight, Sparkles, Target } from "lucide-react";
import { format } from "date-fns";
import { ThemeProvider } from "@/contexts/ThemeContext";
import DOMPurify from "dompurify";
import { Header } from "@/components/Header";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url: string | null;
  published_at: string;
  tags: string[];
  author_id: string;
  profiles: {
    full_name: string;
  } | null;
}

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts" as any)
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (error) {
        console.error("Error fetching blog post:", error);
        throw error;
      }

      if (data) {
        // Fetch author name separately
        const postData = data as any;
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", postData.author_id)
          .maybeSingle();

        setPost({
          ...postData,
          profiles: profile
        } as any);
      }
    } catch (error) {
      console.error("Error fetching blog post:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">The blog post you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/blog")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen">
        <Header />

        <div className="container mx-auto px-4 py-12 pt-28">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate("/blog")}
              className="mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>

            {post.featured_image_url && (
              <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(post.published_at), "MMMM dd, yyyy")}</span>
              {post.profiles && (
                <>
                  <span>•</span>
                  <span>by {post.profiles.full_name}</span>
                </>
              )}
            </div>

            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="prose prose-lg max-w-none mb-16">
              <div dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(post.content, {
                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
                  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
                  ALLOW_DATA_ATTR: false
                })
              }} />
            </div>

            {/* For Agents/Brokerages Section */}
            <section className="py-12 bg-muted/30 -mx-4 px-4 rounded-lg dotted-pattern">
              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <Card className="p-12 hover-lift">
                  <Sparkles className="h-12 w-12 text-primary mb-6" />
                  <h3 className="text-3xl font-bold mb-4">For Agents</h3>
                  <p className="text-muted-foreground mb-6">
                    Find brokerages that match your goals, values, and growth trajectory.
                  </p>
                  <Link to="/for-agents">
                    <Button size="lg" className="w-full">
                      Explore Opportunities <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </Card>

                <Card className="p-12 hover-lift">
                  <Target className="h-12 w-12 text-primary mb-6" />
                  <h3 className="text-3xl font-bold mb-4">For Brokerages</h3>
                  <p className="text-muted-foreground mb-6">
                    Recruit top-performing agents who fit your culture and vision.
                  </p>
                  <Link to="/for-brokerages">
                    <Button size="lg" variant="outline" className="w-full">
                      Find Top Talent <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </Card>
              </div>
            </section>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default BlogPost;
