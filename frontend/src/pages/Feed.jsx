import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PostCard from "../components/PostCard";
import "../styles/layout.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("modview_token");
    if (!token) {
      navigate("/auth");
      return;
    }
    fetchCurrentUser();
    fetchFeed();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("modview_token");
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        setCurrentUser(user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFeed = async (cursorParam = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      let url = `${API_URL}/api/posts/feed?limit=20`;
      if (cursorParam) url += `&cursor=${cursorParam}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (cursorParam) {
          setPosts([...posts, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (type, postId, data) => {
    try {
      const token = localStorage.getItem("modview_token");
      if (type === "like") {
        const res = await fetch(`${API_URL}/api/posts/${postId}/like`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          // Optimistically update UI
          setPosts(
            posts.map((p) =>
              p._id === postId
                ? {
                    ...p,
                    likes: p.likes.some((l) => l === currentUser?._id)
                      ? p.likes.filter((l) => l !== currentUser?._id)
                      : [...(p.likes || []), currentUser?._id],
                  }
                : p
            )
          );
        }
      } else if (type === "comment") {
        // Add comment
        const res = await fetch(`${API_URL}/api/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ postId, text: data }),
        });
        if (res.ok) {
          setPosts(
            posts.map((p) =>
              p._id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
            )
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && posts.length === 0) return <div className="loading">Loading feed...</div>;

  return (
    <div className="feed-container">
      <h1>Your Feed</h1>
      <div className="posts-list">
        {posts.length === 0 ? (
          <p>No posts yet. Follow some car enthusiasts to get started!</p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onLike={handleLike}
              isLiked={post.likes?.some((l) => l === currentUser?._id)}
              currentUserId={currentUser?._id}
            />
          ))
        )}
      </div>

      {hasMore && (
        <button onClick={() => fetchFeed(cursor)} className="load-more">
          Load More
        </button>
      )}
    </div>
  );
}
