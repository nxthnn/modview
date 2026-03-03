import { useState, useEffect } from "react";
import PostCard from "../components/PostCard";
import "../styles/layout.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchExplore();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("modview_token");
      if (!token) return;
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

  const fetchExplore = async (cursorParam = null) => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/posts/explore?limit=20`;
      if (cursorParam) url += `&cursor=${cursorParam}`;

      const res = await fetch(url);
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
      if (!token) return;

      if (type === "like") {
        const res = await fetch(`${API_URL}/api/posts/${postId}/like`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && posts.length === 0) return <div className="loading">Loading posts...</div>;

  return (
    <div className="explore-container">
      <h1>Explore</h1>
      <div className="posts-grid">
        {posts.length === 0 ? (
          <p>No posts found</p>
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
        <button onClick={() => fetchExplore(cursor)} className="load-more">
          Load More
        </button>
      )}
    </div>
  );
}
