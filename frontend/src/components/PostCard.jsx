import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/components.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function PostCard({
  post,
  onLike,
  isLiked,
  currentUserId,
  onPostUpdated,
  onPostDeleted,
}) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption || "");

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const res = await fetch(`${API_URL}/api/comments?postId=${post._id}`);
      if (!res.ok) return;
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await onLike?.("comment", post._id, newComment);

    const token = localStorage.getItem("modview_token");
    const me = post.authorId && currentUserId === post.authorId._id ? post.authorId : null;
    setComments((prev) => [
      {
        _id: `${Date.now()}`,
        text: newComment,
        authorId: me || { _id: currentUserId, name: "You", avatarUrl: "" },
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    if (token) {
      fetchComments();
    }

    setNewComment("");
  };

  const handleToggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next) fetchComments();
  };

  const canManagePost = currentUserId && post.authorId?._id === currentUserId;

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem("modview_token");
      const res = await fetch(`${API_URL}/api/posts/${post._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caption: editCaption }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Could not edit post");
        return;
      }

      const data = await res.json();
      onPostUpdated?.(data);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Network error while editing post");
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Delete this post?")) return;

    try {
      const token = localStorage.getItem("modview_token");
      const res = await fetch(`${API_URL}/api/posts/${post._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Could not delete post");
        return;
      }

      onPostDeleted?.(post._id);
    } catch (err) {
      console.error(err);
      alert("Network error while deleting post");
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.authorId._id}`} className="post-author">
          <img src={post.authorId.avatarUrl || "https://via.placeholder.com/40"} alt="avatar" />
          <div>
            <h4>{post.authorId.name || post.authorId.email}</h4>
            <small>{new Date(post.createdAt).toLocaleDateString()}</small>
          </div>
        </Link>
        {canManagePost && (
          <div className="post-manage-actions">
            <button type="button" onClick={() => setIsEditing((v) => !v)}>
              {isEditing ? "Cancel" : "Edit"}
            </button>
            <button type="button" className="btn-danger" onClick={handleDeletePost}>
              Delete
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="post-edit-wrap">
          <textarea
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            rows={3}
          />
          <button type="button" onClick={handleSaveEdit}>Save</button>
        </div>
      ) : (
        post.caption && <p className="post-caption">{post.caption}</p>
      )}

      {post.carTags && post.carTags.length > 0 && (
        <div className="post-cars">
          {post.carTags.map((car) => (
            <span key={car._id} className="car-tag">
              {car.year} {car.make} {car.model}
            </span>
          ))}
        </div>
      )}

      <div className="post-media">
        {post.mediaUrls && post.mediaUrls.slice(0, 3).map((url, idx) => (
          <div key={idx} className="media-item">
            {url.includes("video") || url.endsWith(".mp4") ? (
              <video controls src={url} />
            ) : (
              <img src={url} alt="post media" />
            )}
          </div>
        ))}
      </div>

      <div className="post-actions">
        <button
          className={`like-btn ${isLiked ? "liked" : ""}`}
          onClick={() => onLike?.("like", post._id)}
          disabled={!onLike}
        >
          ❤️ {post.likes?.length || 0}
        </button>
        <button onClick={handleToggleComments}>
          💬 {post.commentCount || 0}
        </button>
        <button>↗️ Share</button>
      </div>

      {showComments && (
        <div className="post-comments">
          <div className="comment-input">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
            />
            <button onClick={handleAddComment}>Post</button>
          </div>
          <div className="comment-list">
            {commentsLoading ? (
              <p>Loading comments...</p>
            ) : comments.length === 0 ? (
              <p>No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="comment-item">
                  <img
                    src={comment.authorId?.avatarUrl || "https://via.placeholder.com/28"}
                    alt="comment author"
                  />
                  <div>
                    <p>
                      <strong>{comment.authorId?.name || comment.authorId?.email || "User"}</strong> {comment.text}
                    </p>
                    <small>{new Date(comment.createdAt).toLocaleString()}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
