import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Heart, MessageCircle, Send, Loader2 } from 'lucide-react';

export default function FeedScreen({ user }: { user: any }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, likes_count, comments_count, author_id,
          profiles:author_id (full_name, profile_picture_url, department)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      setPosts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const { error } = await supabase.from('posts').insert({
        content: newPost.trim(),
        author_id: user.id,
      });
      if (!error) {
        setNewPost('');
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string, currentLikes: number) => {
    await supabase.from('posts').update({ likes_count: currentLikes + 1 }).eq('id', postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: currentLikes + 1 } : p));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Post composer */}
      <div className="p-4 bg-white border-b border-gray-100">
        <div className="flex gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share something with your campus..."
              className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm outline-none border border-gray-100 focus:border-indigo-300"
              onKeyDown={(e) => e.key === 'Enter' && handlePost()}
            />
            <button
              onClick={handlePost}
              disabled={posting || !newPost.trim()}
              className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center disabled:opacity-50 flex-shrink-0"
            >
              {posting ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No posts yet. Be the first!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {posts.map((post) => (
              <div key={post.id} className="p-4 bg-white">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                    {(post.profiles as any)?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm text-gray-900">{(post.profiles as any)?.full_name || 'Unknown'}</span>
                      <span className="text-xs text-gray-400">{(post.profiles as any)?.department}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{post.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => handleLike(post.id, post.likes_count || 0)}
                        className="flex items-center gap-1 text-gray-400 active:text-red-500 transition-colors"
                      >
                        <Heart className="h-4 w-4" />
                        <span className="text-xs">{post.likes_count || 0}</span>
                      </button>
                      <div className="flex items-center gap-1 text-gray-400">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-xs">{post.comments_count || 0}</span>
                      </div>
                      <span className="text-xs text-gray-300 ml-auto">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
