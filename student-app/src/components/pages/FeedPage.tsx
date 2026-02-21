import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Image as ImageIcon,
  Send,
  Briefcase,
  GraduationCap,
  Trophy,
  Calendar,
  Plus,
  Trash2,
  Edit,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ProfileViewPage } from "./ProfileViewPage";

interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  audience?: string[];
  author_name?: string;
  author_avatar?: string;
  author_role?: string;
  author_department?: string;
  isLiked?: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
}

interface Profile {
  user_id: string;
  full_name: string;
  profile_picture_url?: string;
  role: string;
  department: string;
  institution_id?: string;
}

export const FeedPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedAudience, setSelectedAudience] = useState<string[]>(['all']);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchPosts();
    }
  }, [currentUser]);

  // Show profile view if selected (after all hooks)
  if (selectedProfileId) {
    return (
      <ProfileViewPage 
        profileId={selectedProfileId} 
        onBack={() => setSelectedProfileId(null)}
      />
    );
  }

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      
      // Fetch current user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setCurrentProfile(profile);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch posts with audience filtering
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Filter posts based on current user's role if not authority
      if (currentProfile?.role !== 'authority') {
        query = query.or(`audience.cs.{all},audience.cs.{${currentProfile?.role}}`);
      }

      const { data: postsData, error } = await query;

      if (error) throw error;

      if (postsData) {
        // Fetch author details
        const authorIds = [...new Set(postsData.map(post => post.author_id))];
        const { data: authors } = await supabase
          .from('profiles')
          .select('user_id, full_name, profile_picture_url, role, department')
          .in('user_id', authorIds);

        const authorsMap = new Map(authors?.map(a => [a.user_id, a]) || []);

        // Fetch user's likes
        const { data: userLikes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', currentUser.id);

        const likedPostIds = new Set(userLikes?.map(like => like.post_id) || []);

        const postsWithDetails = postsData.map(post => {
          const author = authorsMap.get(post.author_id);
          return {
            ...post,
            author_name: author?.full_name || 'Unknown User',
            author_avatar: author?.profile_picture_url,
            author_role: author?.role,
            author_department: author?.department,
            isLiked: likedPostIds.has(post.id)
          };
        });

        setPosts(postsWithDetails);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim() || !currentUser) return;

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) return;
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: currentUser.id,
          content: newPostContent.trim(),
          audience: selectedAudience,
          image_url: imageUrl,
          institution_id: currentProfile?.institution_id
        })
        .select()
        .single();

      if (error) throw error;

      const newPost: Post = {
        ...data,
        author_name: currentProfile?.full_name || 'You',
        author_avatar: currentProfile?.profile_picture_url,
        author_role: currentProfile?.role,
        author_department: currentProfile?.department,
        isLiked: false
      };

      setPosts(prev => [newPost, ...prev]);
      setNewPostContent("");
      setSelectedAudience(['all']);
      removeImage();

      toast({
        title: "Success",
        description: "Post created successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    }
  };

  const updatePost = async () => {
    if (!editingPost || !newPostContent.trim()) return;

    try {
      let imageUrl = editingPost.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) return;
      }

      const { error } = await supabase
        .from('posts')
        .update({
          content: newPostContent.trim(),
          image_url: imageUrl,
          audience: selectedAudience
        })
        .eq('id', editingPost.id);

      if (error) throw error;

      setPosts(prev => prev.map(p => 
        p.id === editingPost.id 
          ? { ...p, content: newPostContent.trim(), image_url: imageUrl, audience: selectedAudience }
          : p
      ));

      setEditingPost(null);
      setNewPostContent("");
      setSelectedAudience(['all']);
      removeImage();

      toast({
        title: "Success",
        description: "Post updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update post",
        variant: "destructive",
      });
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== postId));
      setDeletePostId(null);

      toast({
        title: "Success",
        description: "Post deleted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const startEditPost = (post: Post) => {
    setEditingPost(post);
    setNewPostContent(post.content);
    setSelectedAudience(post.audience || ['all']);
    if (post.image_url) {
      setImagePreview(post.image_url);
    }
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setNewPostContent("");
    setSelectedAudience(['all']);
    removeImage();
  };

  const toggleLike = async (postId: string) => {
    if (!currentUser) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.isLiked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);

        await supabase
          .from('posts')
          .update({ likes_count: Math.max(0, post.likes_count - 1) })
          .eq('id', postId);

        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, isLiked: false, likes_count: Math.max(0, p.likes_count - 1) }
            : p
        ));
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: currentUser.id });

        await supabase
          .from('posts')
          .update({ likes_count: post.likes_count + 1 })
          .eq('id', postId);

        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, isLiked: true, likes_count: p.likes_count + 1 }
            : p
        ));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (commentsData) {
        // Fetch comment authors
        const authorIds = [...new Set(commentsData.map(comment => comment.author_id))];
        const { data: authors } = await supabase
          .from('profiles')
          .select('user_id, full_name, profile_picture_url')
          .in('user_id', authorIds);

        const authorsMap = new Map(authors?.map(a => [a.user_id, a]) || []);

        const commentsWithAuthors = commentsData.map(comment => ({
          ...comment,
          author_name: authorsMap.get(comment.author_id)?.full_name || 'Unknown User',
          author_avatar: authorsMap.get(comment.author_id)?.profile_picture_url
        }));

        setComments(commentsWithAuthors);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedPost || !currentUser) return;

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: selectedPost.id,
          author_id: currentUser.id,
          content: newComment.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Update comments count
      await supabase
        .from('posts')
        .update({ comments_count: selectedPost.comments_count + 1 })
        .eq('id', selectedPost.id);

      // Add comment to local state
      const newCommentWithAuthor: Comment = {
        ...data,
        author_name: currentProfile?.full_name || 'You',
        author_avatar: currentProfile?.profile_picture_url
      };

      setComments(prev => [...prev, newCommentWithAuthor]);
      setNewComment("");

      // Update post in posts list
      setPosts(prev => prev.map(p => 
        p.id === selectedPost.id 
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ));

      toast({
        title: "Success",
        description: "Comment added successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const openComments = (post: Post) => {
    setSelectedPost(post);
    setIsCommentsOpen(true);
    fetchComments(post.id);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMs = now.getTime() - postTime.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return <GraduationCap className="h-3 w-3" />;
      case 'mentor': case 'teacher': return <Briefcase className="h-3 w-3" />;
      case 'authority': return <Trophy className="h-3 w-3" />;
      default: return <GraduationCap className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'mentor': case 'teacher': return 'bg-green-100 text-green-800';
      case 'authority': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAudienceChange = (audience: string, checked: boolean) => {
    if (audience === 'all') {
      setSelectedAudience(['all']);
    } else {
      // When selecting a specific audience, automatically uncheck "all"
      if (checked) {
        setSelectedAudience(prev => {
          const newAudience = prev.filter(a => a !== 'all');
          return [...newAudience, audience];
        });
      } else {
        setSelectedAudience(prev => {
          const newAudience = prev.filter(a => a !== audience);
          return newAudience.length === 0 ? ['all'] : newAudience;
        });
      }
    }
  };

  const getAudienceDisplay = (audience?: string[]) => {
    if (!audience || audience.includes('all')) {
      return 'Everyone';
    }
    return audience.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ');
  };

  const getAudienceColor = (audience?: string[]) => {
    if (!audience || audience.includes('all')) {
      return 'bg-gray-100 text-gray-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="animate-pulse space-y-6">
            <Card>
              <CardHeader className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-16 bg-muted rounded"></div>
              </CardHeader>
            </Card>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-3 bg-muted rounded w-16"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            College Feed
          </h1>
          <p className="text-lg text-muted-foreground">
            Stay updated with your college community
          </p>
        </div>

        {/* Create/Edit Post */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">
                {editingPost ? 'Edit Post' : 'Create Post'}
              </h3>
              {editingPost && (
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentProfile?.profile_picture_url} />
                <AvatarFallback>
                  {currentProfile?.full_name?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="What's happening in your college life?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Audience Selection for Authority Users */}
            {currentProfile?.role === 'authority' && (
              <div className="mb-4 p-4 border rounded-lg bg-muted/50">
                <Label className="text-sm font-medium mb-2 block">Select Audience:</Label>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all"
                      checked={selectedAudience.includes('all')}
                      onCheckedChange={(checked) => handleAudienceChange('all', checked as boolean)}
                    />
                    <Label htmlFor="all" className="text-sm">Everyone</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="student"
                      checked={selectedAudience.includes('student')}
                      onCheckedChange={(checked) => handleAudienceChange('student', checked as boolean)}
                    />
                    <Label htmlFor="student" className="text-sm cursor-pointer">Students</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="teacher"
                      checked={selectedAudience.includes('teacher')}
                      onCheckedChange={(checked) => handleAudienceChange('teacher', checked as boolean)}
                    />
                    <Label htmlFor="teacher" className="text-sm cursor-pointer">Teachers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mentor"
                      checked={selectedAudience.includes('mentor')}
                      onCheckedChange={(checked) => handleAudienceChange('mentor', checked as boolean)}
                    />
                    <Label htmlFor="mentor" className="text-sm cursor-pointer">Mentors</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="authority"
                      checked={selectedAudience.includes('authority')}
                      onCheckedChange={(checked) => handleAudienceChange('authority', checked as boolean)}
                    />
                    <Label htmlFor="authority" className="text-sm cursor-pointer">Authority</Label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-4 relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="rounded-lg max-h-64 w-auto object-cover"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Photo
                </Button>
              </div>
              <Button 
                onClick={editingPost ? updatePost : createPost}
                disabled={!newPostContent.trim() || uploadingImage}
              >
                {uploadingImage ? (
                  "Uploading..."
                ) : editingPost ? (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Update
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={post.author_avatar} />
                        <AvatarFallback>
                          {post.author_name?.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 
                            className="font-semibold cursor-pointer hover:text-primary transition-colors"
                            onClick={() => setSelectedProfileId(post.author_id)}
                          >
                            {post.author_name}
                          </h3>
                          {post.author_role && (
                            <Badge 
                              variant="secondary" 
                              className={`${getRoleColor(post.author_role)} text-xs`}
                            >
                              <span className="mr-1">{getRoleIcon(post.author_role)}</span>
                              {post.author_role}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {post.author_department} • {formatTimeAgo(post.created_at)}
                        </p>
                      </div>
                    </div>
                    {currentUser && post.author_id === currentUser.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEditPost(post)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Post
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeletePostId(post.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Audience Badge */}
                  {post.audience && !post.audience.includes('all') && (
                    <div className="mb-3">
                      <Badge 
                        variant="outline" 
                        className={`${getAudienceColor(post.audience)} text-xs`}
                      >
                        📢 For {getAudienceDisplay(post.audience)}
                      </Badge>
                    </div>
                  )}
                  
                  <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
                  
                  {post.image_url && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={post.image_url} 
                        alt="Post content" 
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleLike(post.id)}
                        className={post.isLiked ? 'text-red-500' : ''}
                      >
                        <Heart 
                          className={`h-4 w-4 mr-2 ${post.isLiked ? 'fill-current' : ''}`} 
                        />
                        {post.likes_count}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openComments(post)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {post.comments_count}
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground">
                  Be the first to share something with your college community!
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Comments Modal */}
        <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Comments</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col space-y-4 max-h-[60vh] overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.author_avatar} />
                    <AvatarFallback>
                      {comment.author_name?.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span 
                          className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            setIsCommentsOpen(false);
                            setSelectedProfileId(comment.author_id);
                          }}
                        >
                          {comment.author_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentProfile?.profile_picture_url} />
                <AvatarFallback>
                  {currentProfile?.full_name?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Input
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addComment()}
                className="flex-1"
              />
              <Button onClick={addComment} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletePostId} onOpenChange={(open) => !open && setDeletePostId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this post? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deletePostId && deletePost(deletePostId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};