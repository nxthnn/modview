import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/components.css";

export default function PostCard({ post, onLike, isLiked, currentUserId }) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    // This will be implemented in Feed.jsx
    onLike("comment", post._id, newComment);
    setNewComment("");
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
      </div>

      {post.caption && <p className="post-caption">{post.caption}</p>}

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
          onClick={() => onLike("like", post._id)}
        >
          ❤️ {post.likes?.length || 0}
        </button>
        <button onClick={() => setShowComments(!showComments)}>
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
          {/* Comments will be rendered here */}
        </div>
      )}
    </div>
  );
}
