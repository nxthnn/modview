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
  const [cars, setCars] = useState([]);
  const [composer, setComposer] = useState({ caption: "", carTags: [] });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [posting, setPosting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("modview_token");
    if (!token) {
      navigate("/auth");
      return;
    }
    fetchCurrentUser();
    fetchCars();
    fetchFeed();
  }, []);

  const fetchCars = async () => {
    try {
      const token = localStorage.getItem("modview_token");
      const res = await fetch(`${API_URL}/api/cars`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCars(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

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
      const token = localStorage.getItem("modview_token");
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

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!composer.caption.trim() && mediaFiles.length === 0) {
      alert("Add a caption or media to post");
      return;
    }

    try {
      setPosting(true);
      const token = localStorage.getItem("modview_token");
      const formData = new FormData();
      formData.append("caption", composer.caption);
      formData.append("carTags", JSON.stringify(composer.carTags));
      mediaFiles.forEach((file) => formData.append("media", file));

      const res = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const rawText = await res.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }

      if (res.status === 401) {
        localStorage.removeItem("modview_token");
        navigate("/auth", { replace: true });
        return;
      }

      if (!res.ok) {
        const detail = data?.message || rawText || "Could not create post";
        alert(`Could not create post (${res.status}): ${detail}`);
        return;
      }

      setPosts((prev) => [data, ...prev]);
      setComposer({ caption: "", carTags: [] });
      setMediaFiles([]);
    } catch (err) {
      console.error(err);
      alert("Network error while creating post");
    } finally {
      setPosting(false);
    }
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? { ...p, ...updatedPost } : p)));
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  if (loading && posts.length === 0) return <div className="loading">Loading feed...</div>;

  return (
    <div className="feed-container">
      <h1>Your Feed</h1>

      <form className="post-composer" onSubmit={handleCreatePost}>
        <textarea
          placeholder="Share an update about your build..."
          value={composer.caption}
          onChange={(e) => setComposer((prev) => ({ ...prev, caption: e.target.value }))}
          rows={3}
        />

        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => setMediaFiles(Array.from(e.target.files || []))}
        />

        {cars.length > 0 && (
          <select
            multiple
            value={composer.carTags}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
              setComposer((prev) => ({ ...prev, carTags: selected }));
            }}
          >
            {cars.map((car) => (
              <option key={car._id} value={car._id}>
                {car.year} {car.make} {car.model}
              </option>
            ))}
          </select>
        )}

        <button type="submit" className="btn btn-primary" disabled={posting}>
          {posting ? "Posting..." : "Post"}
        </button>
      </form>

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
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
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
