import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PostCard from "../components/PostCard";
import "../styles/layout.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Profile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchPosts();
    fetchCurrentUser();
  }, [id]);

  useEffect(() => {
    if (!user || !currentUser) return;
    setIsFollowing(user.followers?.some((f) => f._id === currentUser._id) || false);
  }, [user, currentUser]);

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

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/users/${id}`);
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/${id}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem("modview_token");
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`${API_URL}/api/follows/${id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostAction = async (type, postId, data) => {
    try {
      const token = localStorage.getItem("modview_token");
      if (!token) return;

      if (type === "like") {
        const res = await fetch(`${API_URL}/api/posts/${postId}/like`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setPosts((prev) =>
            prev.map((p) =>
              p._id === postId
                ? {
                    ...p,
                    likes: p.likes?.some((l) => l === currentUser?._id)
                      ? p.likes.filter((l) => l !== currentUser?._id)
                      : [...(p.likes || []), currentUser?._id],
                  }
                : p
            )
          );
        }
      } else if (type === "comment") {
        const res = await fetch(`${API_URL}/api/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ postId, text: data }),
        });

        if (res.ok) {
          setPosts((prev) =>
            prev.map((p) =>
              p._id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
            )
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? { ...p, ...updatedPost } : p)));
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  if (loading) return <div className="loading">Loading profile...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img src={user.avatarUrl || "https://via.placeholder.com/150"} alt="avatar" className="profile-avatar" />
        <div className="profile-info">
          <h1>{user.name || user.email}</h1>
          <p>{user.bio || "No bio"}</p>
          <div className="profile-stats">
            <div>
              <strong>{user.postCount}</strong> Posts
            </div>
            <div>
              <strong>{user.followerCount}</strong> Followers
            </div>
            <div>
              <strong>{user.followingCount}</strong> Following
            </div>
          </div>
          {currentUser && currentUser._id !== id && (
            <button className="follow-btn" onClick={handleFollow}>
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>

      <div className="profile-posts">
        <h2>Posts</h2>
        <div className="posts-list">
          {posts.length === 0 ? (
            <p>No posts yet</p>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onLike={handlePostAction}
                isLiked={post.likes?.some((l) => l === currentUser?._id)}
                currentUserId={currentUser?._id}
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
